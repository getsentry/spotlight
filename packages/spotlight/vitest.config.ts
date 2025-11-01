/// <reference types="vitest" />

import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

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
    alias: [
      { find: /^~\/formatters\/(.*)\.js$/, replacement: resolve(__dirname, "src/sidecar/formatters/$1.ts") },
      { find: /^~\/parser\/(.*)\.js$/, replacement: resolve(__dirname, "src/sidecar/parser/$1.ts") },
      { find: /^~\/utils\/(.*)\.js$/, replacement: resolve(__dirname, "src/sidecar/utils/$1.ts") },
      { find: /^~\/types\/(.*)\.js$/, replacement: resolve(__dirname, "src/sidecar/types/$1.ts") },
      { find: /^~\/mcp\/(.*)\.js$/, replacement: resolve(__dirname, "src/sidecar/mcp/$1.ts") },
      { find: "~/main.js", replacement: resolve(__dirname, "src/sidecar/main.ts") },
      { find: "~/logger.js", replacement: resolve(__dirname, "src/sidecar/logger.ts") },
      { find: "~/constants.js", replacement: resolve(__dirname, "src/sidecar/constants.ts") },
      { find: "~", replacement: resolve(__dirname, "src/ui") },
    ],
  },
});
