import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{test,eval}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["vitest-evals/reporter"],
    coverage: {
      provider: "v8",
    },
    setupFiles: ["./src/setup-env.ts"],
    testTimeout: 30000,
  },
  resolve: {
    extensions: [".ts", ".js", ".mjs", ".json"],
  },
});