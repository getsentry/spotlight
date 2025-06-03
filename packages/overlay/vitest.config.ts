/// <reference types="vitest" />

// import tsconfigPaths from "vite-tsconfig-paths";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const isCI = Boolean(process.env.CI);
export default defineConfig({
  //   plugins: [tsconfigPaths()],
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
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
});
