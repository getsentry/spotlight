// vitest.config.ts
import { defineConfig } from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/vitest@0.34.6_happy-dom@20.0.2_lightningcss@1.30.1_playwright@1.54.2_terser@5.43.1/node_modules/vitest/dist/config.js";

// vite.config.base.ts
import { resolve } from "node:path";
import tailwindcss from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/@tailwindcss+vite@4.1.11_vite@5.4.19_@types+node@22.15.28_lightningcss@1.30.1_terser@5.43.1_/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/@vitejs+plugin-react@4.4.1_vite@5.4.19_@types+node@22.15.28_lightningcss@1.30.1_terser@5.43.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import dts from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/vite-plugin-dts@4.5.4_@types+node@22.15.28_rollup@4.52.4_typescript@5.9.2_vite@5.4.19_@types+_phw27v3nopwt7lqprnx2qnykpu/node_modules/vite-plugin-dts/dist/index.mjs";
import svgr from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/vite-plugin-svgr@3.3.0_rollup@4.52.4_typescript@5.9.2_vite@5.4.19_@types+node@22.15.28_lightn_yeg7eswmwsy4e4ofotdbxfbi4e/node_modules/vite-plugin-svgr/dist/index.js";
var __vite_injected_original_dirname = "/home/byk/Projects/getsentry/spotlight/packages/spotlight";
var aliases = {
  "@spotlight/ui": resolve(__vite_injected_original_dirname, "src/ui"),
  "@spotlight/server": resolve(__vite_injected_original_dirname, "src/server"),
  "@spotlight/shared": resolve(__vite_injected_original_dirname, "src/shared")
};
var defineProduction = {
  "process.env.NODE_ENV": '"production"',
  "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version)
};
var defineDevelopment = {
  "process.env.NODE_ENV": '"development"',
  "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version)
};
var reactPlugins = [
  react(),
  svgr({
    svgrOptions: {
      titleProp: true
    }
  }),
  tailwindcss()
];
var dtsPlugin = dts({
  insertTypesEntry: true
});

// vitest.config.ts
var isCI = Boolean(process.env.CI);
var vitest_config_default = defineConfig({
  test: {
    environment: "happy-dom",
    reporters: isCI ? ["junit", "default"] : ["default"],
    outputFile: "junit.xml",
    coverage: {
      enabled: isCI,
      provider: "v8",
      reporter: ["json"]
    },
    globals: true,
    include: [
      "./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/tests/**"
      // Exclude all e2e tests from unit test run
    ],
    watchExclude: [".*\\/node_modules\\/.*", ".*\\/dist\\/.*"],
    testTimeout: 3e4
    // 30 seconds for e2e tests
  },
  resolve: {
    alias: aliases
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyIsICJ2aXRlLmNvbmZpZy5iYXNlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvYnlrL1Byb2plY3RzL2dldHNlbnRyeS9zcG90bGlnaHQvcGFja2FnZXMvc3BvdGxpZ2h0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9ieWsvUHJvamVjdHMvZ2V0c2VudHJ5L3Nwb3RsaWdodC9wYWNrYWdlcy9zcG90bGlnaHQvdml0ZXN0LmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9ieWsvUHJvamVjdHMvZ2V0c2VudHJ5L3Nwb3RsaWdodC9wYWNrYWdlcy9zcG90bGlnaHQvdml0ZXN0LmNvbmZpZy50c1wiOy8vLyA8cmVmZXJlbmNlIHR5cGVzPVwidml0ZXN0XCIgLz5cblxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVzdC9jb25maWdcIjtcbmltcG9ydCB7IGFsaWFzZXMgfSBmcm9tIFwiLi92aXRlLmNvbmZpZy5iYXNlXCI7XG5cbmNvbnN0IGlzQ0kgPSBCb29sZWFuKHByb2Nlc3MuZW52LkNJKTtcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHRlc3Q6IHtcbiAgICBlbnZpcm9ubWVudDogXCJoYXBweS1kb21cIixcbiAgICByZXBvcnRlcnM6IGlzQ0kgPyBbXCJqdW5pdFwiLCBcImRlZmF1bHRcIl0gOiBbXCJkZWZhdWx0XCJdLFxuICAgIG91dHB1dEZpbGU6IFwianVuaXQueG1sXCIsXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIGVuYWJsZWQ6IGlzQ0ksXG4gICAgICBwcm92aWRlcjogXCJ2OFwiLFxuICAgICAgcmVwb3J0ZXI6IFtcImpzb25cIl0sXG4gICAgfSxcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGluY2x1ZGU6IFtcbiAgICAgIFwiLi9zcmMvKiovKi57dGVzdCxzcGVjfS57anMsbWpzLGNqcyx0cyxtdHMsY3RzLGpzeCx0c3h9XCIsXG4gICAgXSxcbiAgICBleGNsdWRlOiBbXG4gICAgICBcIioqL25vZGVfbW9kdWxlcy8qKlwiLFxuICAgICAgXCIqKi9kaXN0LyoqXCIsXG4gICAgICBcIioqL3Rlc3RzLyoqXCIsIC8vIEV4Y2x1ZGUgYWxsIGUyZSB0ZXN0cyBmcm9tIHVuaXQgdGVzdCBydW5cbiAgICBdLFxuICAgIHdhdGNoRXhjbHVkZTogW1wiLipcXFxcL25vZGVfbW9kdWxlc1xcXFwvLipcIiwgXCIuKlxcXFwvZGlzdFxcXFwvLipcIl0sXG4gICAgdGVzdFRpbWVvdXQ6IDMwMDAwLCAvLyAzMCBzZWNvbmRzIGZvciBlMmUgdGVzdHNcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiBhbGlhc2VzLFxuICB9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL2J5ay9Qcm9qZWN0cy9nZXRzZW50cnkvc3BvdGxpZ2h0L3BhY2thZ2VzL3Nwb3RsaWdodFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvYnlrL1Byb2plY3RzL2dldHNlbnRyeS9zcG90bGlnaHQvcGFja2FnZXMvc3BvdGxpZ2h0L3ZpdGUuY29uZmlnLmJhc2UudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvYnlrL1Byb2plY3RzL2dldHNlbnRyeS9zcG90bGlnaHQvcGFja2FnZXMvc3BvdGxpZ2h0L3ZpdGUuY29uZmlnLmJhc2UudHNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IGR0cyBmcm9tIFwidml0ZS1wbHVnaW4tZHRzXCI7XG5pbXBvcnQgc3ZnciBmcm9tIFwidml0ZS1wbHVnaW4tc3ZnclwiO1xuXG5leHBvcnQgY29uc3QgYWxpYXNlcyA9IHtcbiAgXCJAc3BvdGxpZ2h0L3VpXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy91aVwiKSxcbiAgXCJAc3BvdGxpZ2h0L3NlcnZlclwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvc2VydmVyXCIpLFxuICBcIkBzcG90bGlnaHQvc2hhcmVkXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9zaGFyZWRcIiksXG59O1xuXG5leHBvcnQgY29uc3QgZGVmaW5lUHJvZHVjdGlvbiA9IHtcbiAgXCJwcm9jZXNzLmVudi5OT0RFX0VOVlwiOiAnXCJwcm9kdWN0aW9uXCInLFxuICBcInByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb25cIjogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiksXG59O1xuXG5leHBvcnQgY29uc3QgZGVmaW5lRGV2ZWxvcG1lbnQgPSB7XG4gIFwicHJvY2Vzcy5lbnYuTk9ERV9FTlZcIjogJ1wiZGV2ZWxvcG1lbnRcIicsXG4gIFwicHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvblwiOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5ucG1fcGFja2FnZV92ZXJzaW9uKSxcbn07XG5cbmV4cG9ydCBjb25zdCByZWFjdFBsdWdpbnMgPSBbXG4gIHJlYWN0KCksXG4gIHN2Z3Ioe1xuICAgIHN2Z3JPcHRpb25zOiB7XG4gICAgICB0aXRsZVByb3A6IHRydWUsXG4gICAgfSxcbiAgfSksXG4gIHRhaWx3aW5kY3NzKCksXG5dO1xuXG5leHBvcnQgY29uc3QgZHRzUGx1Z2luID0gZHRzKHtcbiAgaW5zZXJ0VHlwZXNFbnRyeTogdHJ1ZSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsb0JBQW9COzs7QUNGMFUsU0FBUyxlQUFlO0FBQy9YLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sV0FBVztBQUNsQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBSmpCLElBQU0sbUNBQW1DO0FBTWxDLElBQU0sVUFBVTtBQUFBLEVBQ3JCLGlCQUFpQixRQUFRLGtDQUFXLFFBQVE7QUFBQSxFQUM1QyxxQkFBcUIsUUFBUSxrQ0FBVyxZQUFZO0FBQUEsRUFDcEQscUJBQXFCLFFBQVEsa0NBQVcsWUFBWTtBQUN0RDtBQUVPLElBQU0sbUJBQW1CO0FBQUEsRUFDOUIsd0JBQXdCO0FBQUEsRUFDeEIsbUNBQW1DLEtBQUssVUFBVSxRQUFRLElBQUksbUJBQW1CO0FBQ25GO0FBRU8sSUFBTSxvQkFBb0I7QUFBQSxFQUMvQix3QkFBd0I7QUFBQSxFQUN4QixtQ0FBbUMsS0FBSyxVQUFVLFFBQVEsSUFBSSxtQkFBbUI7QUFDbkY7QUFFTyxJQUFNLGVBQWU7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixLQUFLO0FBQUEsSUFDSCxhQUFhO0FBQUEsTUFDWCxXQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0YsQ0FBQztBQUFBLEVBQ0QsWUFBWTtBQUNkO0FBRU8sSUFBTSxZQUFZLElBQUk7QUFBQSxFQUMzQixrQkFBa0I7QUFDcEIsQ0FBQzs7O0FEN0JELElBQU0sT0FBTyxRQUFRLFFBQVEsSUFBSSxFQUFFO0FBQ25DLElBQU8sd0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU07QUFBQSxJQUNKLGFBQWE7QUFBQSxJQUNiLFdBQVcsT0FBTyxDQUFDLFNBQVMsU0FBUyxJQUFJLENBQUMsU0FBUztBQUFBLElBQ25ELFlBQVk7QUFBQSxJQUNaLFVBQVU7QUFBQSxNQUNSLFNBQVM7QUFBQSxNQUNULFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxNQUFNO0FBQUEsSUFDbkI7QUFBQSxJQUNBLFNBQVM7QUFBQSxJQUNULFNBQVM7QUFBQSxNQUNQO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBO0FBQUEsSUFDRjtBQUFBLElBQ0EsY0FBYyxDQUFDLDBCQUEwQixnQkFBZ0I7QUFBQSxJQUN6RCxhQUFhO0FBQUE7QUFBQSxFQUNmO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsRUFDVDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
