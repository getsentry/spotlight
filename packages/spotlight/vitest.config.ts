/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import { aliases } from "./vite.config.base";

const isCI = Boolean(process.env.CI);
export default defineConfig({
  test: {
    environment: "happy-dom",
    reporters: isCI ? ["junit", "default"] : ["default"],
    outputFile: "junit.xml",
    coverage: {
      enabled: isCI,
      provider: "v8",
      reporter: ["json"],
    },
    globals: true,
    include: [
      "./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "./tests/e2e/cli/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/e2e/ui/**", // Exclude Playwright tests from vitest
      "**/tests/launch.test.ts", // Exclude Playwright electron test
    ],
    watchExclude: [".*\\/node_modules\\/.*", ".*\\/dist\\/.*"],
    testTimeout: 30000, // 30 seconds for e2e tests
  },
  resolve: {
    alias: aliases,
  },
});
