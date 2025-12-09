import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        testTimeout: 10000, // 10 second timeout per test
        hookTimeout: 10000,
        include: ["src/__tests__/**/*.browser.test.{ts,tsx}"],
        browser: {
            enabled: true,
            name: "chromium",
            provider: "playwright",
            headless: true,
        },
        coverage: {
            provider: "istanbul",
            reporter: ["json", "text", "lcov"],
            reportsDirectory: "./coverage/browser",
            include: ["src/**"],
            exclude: ["src/__tests__/**", "src/stories/**"],
        },
    },
});
