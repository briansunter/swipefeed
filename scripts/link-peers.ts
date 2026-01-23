#!/usr/bin/env bun
/**
 * Sets up symlinks for peer dependencies when using swipefeed locally.
 *
 * Usage from consumer project:
 *   bun run ../swipefeed/scripts/link-peers.ts
 *
 * This creates symlinks from swipefeed/node_modules to the consumer's
 * node_modules, ensuring a single React instance.
 */

import { existsSync, mkdirSync, symlinkSync, unlinkSync, lstatSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const PEERS = ["react", "react-dom", "@tanstack", "@types"];

// Find swipefeed root (where this script lives)
const scriptDir = dirname(Bun.main);
const swipefeedRoot = resolve(scriptDir, "..");
const swipefeedNodeModules = join(swipefeedRoot, "node_modules");

// Find consumer's node_modules (current working directory)
const consumerRoot = process.cwd();
const consumerNodeModules = join(consumerRoot, "node_modules");

console.log("Setting up peer dependency symlinks for swipefeed...");
console.log(`  Swipefeed: ${swipefeedRoot}`);
console.log(`  Consumer:  ${consumerRoot}`);

// Ensure swipefeed/node_modules exists
if (!existsSync(swipefeedNodeModules)) {
  mkdirSync(swipefeedNodeModules, { recursive: true });
}

let linked = 0;
let skipped = 0;

for (const peer of PEERS) {
  const consumerPath = join(consumerNodeModules, peer);
  const swipefeedPath = join(swipefeedNodeModules, peer);

  // Check if consumer has this dependency
  if (!existsSync(consumerPath)) {
    console.log(`  ⚠ ${peer}: not found in consumer, skipping`);
    skipped++;
    continue;
  }

  // Remove existing symlink or directory
  if (existsSync(swipefeedPath)) {
    try {
      const stats = lstatSync(swipefeedPath);
      if (stats.isSymbolicLink()) {
        unlinkSync(swipefeedPath);
      } else {
        console.log(`  ⚠ ${peer}: exists and is not a symlink, skipping`);
        skipped++;
        continue;
      }
    } catch {
      // Ignore errors
    }
  }

  // Create symlink
  try {
    symlinkSync(consumerPath, swipefeedPath);
    console.log(`  ✓ ${peer}: linked`);
    linked++;
  } catch (err) {
    console.log(`  ✗ ${peer}: failed to link - ${err}`);
    skipped++;
  }
}

console.log(`\nDone! Linked ${linked} dependencies, skipped ${skipped}.`);

if (linked > 0) {
  console.log("\nYou can now use swipefeed with:");
  console.log('  "swipefeed": "file:../swipefeed"');
}
