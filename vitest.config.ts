import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["json", "text", "lcov"],
      reportsDirectory: "./coverage/unit",
      include: ["src/**"],
      exclude: ["src/__tests__/**", "src/stories/**"],
      thresholds: {
        lines: 94,
        functions: 88,
        branches: 80,
        statements: 92,
      },
    },
  },
});

