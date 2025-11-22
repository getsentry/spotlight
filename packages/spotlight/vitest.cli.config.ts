/// <reference types="vitest" />

import { defineConfig } from "vitest/config";
import { aliases } from "./vite.config.base";

const isCI = Boolean(process.env.CI);
export default defineConfig({
  test: {
    reporters: isCI ? ["junit", "default"] : ["default"],
    outputFile: "junit-e2e.xml",
    globals: true,
    include: ["./tests/e2e/cli/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/e2e/ui/**", // Exclude Playwright tests
      "**/tests/electron.test.ts", // Exclude Playwright electron test
    ],
    watchExclude: [".*\\/node_modules\\/.*", ".*\\/dist\\/.*"],
  },
  resolve: {
    alias: aliases,
  },
});
