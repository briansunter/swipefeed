#!/usr/bin/env bun
/**
 * Fail-closed post-build check for the published bundle.
 *
 * Guard against regressions like the v1.1.2..v1.2.0 releases, where the
 * published dist/index.js was a ~159 byte stub
 * (`export{p as useWindowSize, ...}`) referencing undeclared identifiers
 * with no bundled modules. Run automatically as the last step of
 * `bun run build` (and therefore also via `prepublishOnly`).
 *
 * Checks:
 *   1. Required dist files exist (index.js, index.js.map, index.d.ts).
 *   2. dist/index.js is a real bundle, not an export stub (size floor).
 *   3. React stays external (bundled output must import it, not embed it).
 *   4. Every runtime public export resolves and re-bundles via Bun.build.
 *   5. Every type re-export in dist/index.d.ts resolves to a .d.ts file.
 *   6. No test/story declarations leak into dist (keeps tarball clean).
 *   7. Every package.json export target exists on disk under dist/.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const dist = join(root, "dist");

/** Minimum plausible bundle size in bytes. A healthy bundle is ~15-20KB; the broken stub releases were 159 bytes. */
const MIN_BUNDLE_BYTES = 10_000;

const RUNTIME_EXPORTS = ["SwipeDeck", "useSwipeDeck", "useWindowSize", "useSwipeItem"] as const;
const EXTERNALS = ["react", "react-dom", "@tanstack/react-virtual"];

function fail(message: string): never {
  console.error(`verify-dist: FAIL: ${message}`);
  process.exit(1);
}

function mustExist(path: string): void {
  if (!existsSync(path)) fail(`missing required file: ${path}`);
}

// 1. Required files.
for (const file of ["index.js", "index.js.map", "index.d.ts"]) {
  mustExist(join(dist, file));
}

// 2. Size floor: catches export-stub bundles with no bundled modules.
const indexJsPath = join(dist, "index.js");
const bundleText = readFileSync(indexJsPath, "utf8");
const bundleBytes = statSync(indexJsPath).size;
if (bundleBytes < MIN_BUNDLE_BYTES) {
  fail(`dist/index.js is only ${bundleBytes} bytes (minimum ${MIN_BUNDLE_BYTES}); refusing stub bundle`);
}

// 3. React must stay external so consumers never get a duplicate copy.
if (!/from\s*["']react["']/.test(bundleText)) {
  fail('dist/index.js does not import external "react" (duplicate-React risk)');
}

// 4. Every runtime export must resolve and survive a consumer-style bundle.
const probeDir = mkdtempSync(join(tmpdir(), "swipefeed-verify-dist-"));
try {
  const probeEntry = join(probeDir, "probe.ts");
  writeFileSync(
    probeEntry,
    `${RUNTIME_EXPORTS.map((name) => `import { ${name} } from ${JSON.stringify(indexJsPath)};`).join("\n")}\n` +
      `export const probe = { ${RUNTIME_EXPORTS.join(", ")} };\n`,
  );
  const outdir = join(probeDir, "out");
  let result: Awaited<ReturnType<typeof Bun.build>>;
  try {
    result = await Bun.build({
      entrypoints: [probeEntry],
      outdir,
      external: EXTERNALS,
      target: "browser",
      format: "esm",
      minify: true,
    });
  } catch (error) {
    // Bun.build throws (instead of reporting logs) when the entry graph
    // references undeclared export bindings, as in the poisoned v1.1.2+
    // stub bundles ("S is not declared").
    fail(`probe bundle threw: ${error}`);
  }
  if (!result.success) {
    for (const log of result.logs) fail(`probe bundle failed: ${log}`);
    fail("probe bundle failed for unknown reasons");
  }
  const probeOut = join(outdir, "probe.js");
  mustExist(probeOut);
  const probeText = readFileSync(probeOut, "utf8");
  for (const name of RUNTIME_EXPORTS) {
    if (!probeText.includes(name)) fail(`probe bundle lost export "${name}"`);
  }
} finally {
  rmSync(probeDir, { recursive: true, force: true });
}

// 5. Type re-exports in dist/index.d.ts must resolve to emitted .d.ts files.
const indexDts = readFileSync(join(dist, "index.d.ts"), "utf8");
const typeTargets = [...indexDts.matchAll(/from\s*["'](\.[^"']+)["']/g)].map((m) => m[1]);
if (typeTargets.length === 0) fail("dist/index.d.ts contains no relative re-exports");
for (const target of typeTargets) {
  const resolved = resolve(dist, `${target}.d.ts`);
  if (!existsSync(resolved)) fail(`type target missing: ${target} (expected ${resolved})`);
}

// 6. Test/story declarations must not leak into the published output.
for (const leaked of ["__tests__", "stories"]) {
  if (existsSync(join(dist, leaked))) {
    fail(`dist/${leaked}/ must not be emitted (check tsconfig.build.json excludes)`);
  }
}

// 7. Every package.json export target must exist on disk.
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, unknown>;
};
const targets = new Set<string>();
if (pkg.main) targets.add(pkg.main);
if (pkg.module) targets.add(pkg.module);
if (pkg.types) targets.add(pkg.types);
const collect = (node: unknown): void => {
  if (typeof node === "string") {
    targets.add(node);
    return;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) collect(value);
  }
};
collect(pkg.exports);
for (const target of targets) {
  mustExist(resolve(root, target));
}

console.log(`verify-dist: OK (${bundleBytes} bytes, ${RUNTIME_EXPORTS.length} runtime exports, ${typeTargets.length} type targets)`);
