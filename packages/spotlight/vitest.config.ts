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
    include: ["./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    watchExclude: [".*\\/node_modules\\/.*", ".*\\/dist\\/.*"],
  },
  resolve: {
    alias: aliases,
  },
});
