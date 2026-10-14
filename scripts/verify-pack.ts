#!/usr/bin/env bun
/**
 * End-to-end packaging regression test.
 *
 * Pipeline: build -> pack -> install tarball into an isolated temp
 * consumer -> verify Bun bundle, Node import, and TypeScript type
 * resolution. This is the exact consumer flow that broke for the
 * v1.1.2..v1.2.0 releases (159 byte stub bundle + `bun` export condition
 * pointing at src/index.ts, which is absent from the tarball).
 *
 * Intended for the release workflow (before semantic-release publishes)
 * and for manual runs. Requires network access to install the consumer's
 * peer dependencies from the public registry.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");

function fail(message: string): never {
  console.error(`verify-pack: FAIL: ${message}`);
  process.exit(1);
}

function run(cmd: string[], cwd: string, label: string): string {
  const result = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  const stdout = result.stdout.toString();
  const stderr = result.stderr.toString();
  if (result.exitCode !== 0) {
    fail(`${label} failed (exit ${result.exitCode}):\n${stdout}\n${stderr}`);
  }
  return stdout;
}

// 1. Hermetic rebuild (also runs scripts/verify-dist.ts via the build script).
console.log("verify-pack: building...");
run(["bun", "run", "build"], root, "bun run build");

// 2. Pack the tarball exactly as `npm publish` would.
const packDir = mkdtempSync(join(tmpdir(), "swipefeed-pack-"));
let tarball = "";
try {
  const packOut = run(["npm", "pack", "--pack-destination", packDir, "--silent"], root, "npm pack");
  const packLines = packOut.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  const tgzName = packLines.length > 0 ? packLines[packLines.length - 1] : "";
  if (!tgzName.endsWith(".tgz")) fail(`unexpected npm pack output: ${packOut}`);
  tarball = join(packDir, tgzName);

  // 3. Inspect tarball contents.
  const listing = run(["tar", "tzf", tarball], packDir, "tar list").split("\n").map((l) => l.trim()).filter(Boolean);
  for (const required of ["package/dist/index.js", "package/dist/index.d.ts", "package/package.json"]) {
    if (!listing.includes(required)) fail(`tarball missing ${required}`);
  }
  const srcLeak = listing.find((entry) => entry === "package/src" || entry.startsWith("package/src/"));
  if (srcLeak) fail(`tarball leaks unpublished source: ${srcLeak}`);

  // Every export target in the packed package.json must be in the tarball.
  const packedPkg = JSON.parse(
    run(["tar", "xOzf", tarball, "package/package.json"], packDir, "tar extract package.json"),
  ) as { main?: string; module?: string; types?: string; exports?: unknown };
  const targets = new Set<string>();
  const collect = (node: unknown): void => {
    if (typeof node === "string") {
      targets.add(node.startsWith("./") ? node.slice(2) : node);
      return;
    }
    if (node && typeof node === "object") {
      for (const value of Object.values(node)) collect(value);
    }
  };
  if (packedPkg.main) collect(packedPkg.main);
  if (packedPkg.module) collect(packedPkg.module);
  if (packedPkg.types) collect(packedPkg.types);
  collect(packedPkg.exports);
  for (const target of targets) {
    if (!listing.includes(`package/${target}`)) {
      fail(`export target "${target}" is not in the tarball (tarball is not self-contained)`);
    }
  }
  console.log(`verify-pack: tarball OK (${listing.length} files, ${targets.size} export targets)`);

  // 4. Install the tarball into an isolated consumer.
  const consumer = mkdtempSync(join(tmpdir(), "swipefeed-consumer-"));
  try {
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({ name: "swipefeed-pack-consumer", version: "0.0.0", type: "module" }, null, 2),
    );
    console.log("verify-pack: installing consumer...");
    run(
      ["npm", "install", "--no-audit", "--no-fund", "--silent", tarball, "react", "react-dom"],
      consumer,
      "consumer npm install",
    );
    run(
      ["npm", "install", "--no-audit", "--no-fund", "--silent", "-D", "typescript", "@types/react", "@types/react-dom"],
      consumer,
      "consumer dev npm install",
    );

    // 4a. Bun bundle probe (the exact flow that failed downstream with "S is not declared").
    const bunProbe = join(consumer, "probe.ts");
    writeFileSync(
      bunProbe,
      'import { SwipeDeck, useSwipeDeck, useWindowSize, useSwipeItem } from "swipefeed";\n' +
        "export const probe = { SwipeDeck, useSwipeDeck, useWindowSize, useSwipeItem };\n",
    );
    const bunOut = join(consumer, "probe.bundle.js");
    run(
      [
        "bun", "build", bunProbe, "--outfile", bunOut, "--target", "browser", "--format", "esm",
        "--external", "react", "--external", "react-dom", "--external", "@tanstack/react-virtual",
      ],
      consumer,
      "consumer bun build",
    );
    const bundled = readFileSync(bunOut, "utf8");
    for (const name of ["SwipeDeck", "useSwipeDeck", "useWindowSize", "useSwipeItem"]) {
      if (!bundled.includes(name)) fail(`consumer Bun bundle lost export "${name}"`);
    }
    console.log("verify-pack: Bun bundle probe OK");

    // 4b. Plain Node ESM import probe.
    const nodeProbe = join(consumer, "probe.mjs");
    writeFileSync(
      nodeProbe,
      'import { SwipeDeck, useSwipeDeck, useWindowSize, useSwipeItem } from "swipefeed";\n' +
        "for (const [name, value] of Object.entries({ SwipeDeck, useSwipeDeck, useWindowSize, useSwipeItem })) {\n" +
        '  if (typeof value !== "function") throw new Error(`export ${name} is not a function`);\n' +
        "}\n" +
        'console.log("node import probe OK");\n',
    );
    const nodeOut = run(["node", nodeProbe], consumer, "consumer node import");
    if (!nodeOut.includes("node import probe OK")) fail(`unexpected node probe output: ${nodeOut}`);

    // 4c. TypeScript type-resolution probe (runtime + type-only imports).
    const typeProbe = join(consumer, "probe-types.ts");
    writeFileSync(
      typeProbe,
      'import { SwipeDeck, useSwipeDeck } from "swipefeed";\n' +
        'import type { SwipeDeckProps, SwipeDeckOptions, SwipeDeckState, Orientation } from "swipefeed";\n' +
        "export const runtime = { SwipeDeck, useSwipeDeck };\n" +
        "export type { SwipeDeckProps, SwipeDeckOptions, SwipeDeckState, Orientation };\n",
    );
    run(
      [
        join(consumer, "node_modules", ".bin", "tsc"),
        "--noEmit", "--strict", "--skipLibCheck",
        "--jsx", "react-jsx", "--module", "esnext", "--moduleResolution", "bundler",
        "--target", "es2020", "--lib", "es2020,dom,dom.iterable", typeProbe,
      ],
      consumer,
      "consumer tsc type probe",
    );
    console.log("verify-pack: Node import + tsc probes OK");
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }
} finally {
  rmSync(packDir, { recursive: true, force: true });
}

console.log("verify-pack: OK (tarball is consumable via Bun, Node, and tsc)");
