// Static packaging regression test (no build/pack/network required).
// Runs under the repo's default jsdom environment; node:fs works fine there.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Static packaging regression test (no build/pack/network required).
 *
 * The v1.1.2..v1.2.0 releases shipped two tarball defects:
 *   1. The `bun` export condition pointed at `./src/index.ts`, which is
 *      absent from the published tarball (`files: ["dist"]`), so Bun
 *      consumers resolved to a missing file.
 *   2. The published `dist/index.js` was a 159 byte export stub.
 *      (Defect 2 is covered at build time by scripts/verify-dist.ts and
 *      end-to-end by scripts/verify-pack.ts.)
 *
 * This test keeps defect 1 fixed: every file referenced by the published
 * entry points must live under a directory covered by `files`.
 */
describe("packaging", () => {
    const pkgPath = resolve(__dirname, "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
        files?: string[];
        main?: string;
        module?: string;
        types?: string;
        exports?: unknown;
    };

    function collectTargets(node: unknown, into: string[]): void {
        if (typeof node === "string") {
            into.push(node);
            return;
        }
        if (node && typeof node === "object") {
            for (const value of Object.values(node)) collectTargets(value, into);
        }
    }

    it("exposes files covering every export target", () => {
        const targets: string[] = [];
        if (pkg.main) targets.push(pkg.main);
        if (pkg.module) targets.push(pkg.module);
        if (pkg.types) targets.push(pkg.types);
        collectTargets(pkg.exports, targets);

        expect(targets.length).toBeGreaterThan(0);
        const files = pkg.files ?? [];
        for (const target of targets) {
            const normalized = target.startsWith("./") ? target.slice(2) : target;
            const covered = files.some(
                (entry) => normalized === entry || normalized.startsWith(`${entry}/`),
            );
            expect(
                covered,
                `export target "${target}" is not covered by "files": ${JSON.stringify(files)}`,
            ).toBe(true);
        }
    });

    it("never points consumers at unpublished TypeScript source", () => {
        const targets: string[] = [];
        if (pkg.main) targets.push(pkg.main);
        if (pkg.module) targets.push(pkg.module);
        if (pkg.types) targets.push(pkg.types);
        collectTargets(pkg.exports, targets);

        for (const target of targets) {
            expect(
                target.endsWith(".ts") && !target.endsWith(".d.ts"),
                `export target "${target}" points at unpublished source`,
            ).toBe(false);
        }
    });
});
