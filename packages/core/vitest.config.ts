/// <reference types="vitest" />

// import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from 'vitest/config';

export default defineConfig({
  //   plugins: [tsconfigPaths()],
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['json'],
    },
    globals: true,
    // setupFiles: ["./src/test/setup-test-env.ts"],
    include: ['./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    watchExclude: ['.*\\/node_modules\\/.*', '.*\\/dist\\/.*'],
  },
});
