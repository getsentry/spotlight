// vite.node.config.ts
import { resolve as resolve2 } from "node:path";
import { sentryVitePlugin } from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/@sentry+vite-plugin@2.23.0/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import { defineConfig } from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/vite@5.4.19_@types+node@22.15.28_lightningcss@1.30.1_terser@5.43.1/node_modules/vite/dist/node/index.js";

// vite.config.base.ts
import { resolve } from "node:path";
import tailwindcss from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/@tailwindcss+vite@4.1.11_vite@5.4.19_@types+node@22.15.28_lightningcss@1.30.1_terser@5.43.1_/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/@vitejs+plugin-react@4.4.1_vite@5.4.19_@types+node@22.15.28_lightningcss@1.30.1_terser@5.43.1_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import dts from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/vite-plugin-dts@4.5.4_@types+node@22.15.28_rollup@4.53.3_typescript@5.9.2_vite@5.4.19_@types+_zr3zen6atxtlp4fefutsjtdq7a/node_modules/vite-plugin-dts/dist/index.mjs";
import svgr from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/vite-plugin-svgr@3.3.0_rollup@4.53.3_typescript@5.9.2_vite@5.4.19_@types+node@22.15.28_lightn_qxw6f53spytjc7walk5dz62vve/node_modules/vite-plugin-svgr/dist/index.js";
var __vite_injected_original_dirname = "/home/byk/Projects/getsentry/spotlight/packages/spotlight";
var aliases = {
  "@spotlight/ui": resolve(__vite_injected_original_dirname, "src/ui"),
  "@spotlight/server": resolve(__vite_injected_original_dirname, "src/server"),
  "@spotlight/shared": resolve(__vite_injected_original_dirname, "src/shared")
};
var defineProduction = {
  "process.env.NODE_ENV": '"production"',
  "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
  // Set to false for tree-shaking; Electron config overrides to true
  __IS_ELECTRON__: false
};
var defineDevelopment = {
  "process.env.NODE_ENV": '"development"',
  "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
  // Set to false for tree-shaking; Electron config overrides to true
  __IS_ELECTRON__: false
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
var sentryPluginOptions = {
  org: process.env.MAIN_VITE_SENTRY_ORG,
  authToken: process.env.MAIN_VITE_SENTRY_AUTH_TOKEN,
  release: {
    name: process.env.npm_package_version
  }
};

// vite.node.config.ts
var __vite_injected_original_dirname2 = "/home/byk/Projects/getsentry/spotlight/packages/spotlight";
var shebangPlugin = () => ({
  name: "shebang",
  apply: "build",
  enforce: "post",
  generateBundle(_options, bundle) {
    for (const [fileName, chunk] of Object.entries(bundle)) {
      if (fileName === "run.js" && chunk.type === "chunk") {
        if (!chunk.code.startsWith("#!/usr/bin/env node\n")) {
          chunk.code = `#!/usr/bin/env node
${chunk.code}`;
        }
      }
    }
  }
});
var vite_node_config_default = defineConfig({
  plugins: [
    dtsPlugin,
    sentryVitePlugin({
      ...sentryPluginOptions,
      project: process.env.MAIN_VITE_UI_SENTRY_PROJECT
    }),
    shebangPlugin()
  ],
  define: defineProduction,
  resolve: {
    alias: aliases
  },
  build: {
    target: "node20",
    outDir: "dist",
    lib: {
      entry: {
        run: resolve2(__vite_injected_original_dirname2, "src/run.ts"),
        "server/main": resolve2(__vite_injected_original_dirname2, "src/server/main.ts"),
        "server/sdk": resolve2(__vite_injected_original_dirname2, "src/server/sdk.ts")
      },
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        // Externalize all Node.js built-ins
        /^node:.*/,
        // Externalize all dependencies
        "@hono/mcp",
        "@hono/node-server",
        "@jridgewell/trace-mapping",
        "@modelcontextprotocol/sdk",
        "@sentry/core",
        "@sentry/electron",
        "@sentry/node",
        "chalk",
        "electron-store",
        "electron-updater",
        "eventsource",
        "fast-fuzzy",
        "hono",
        "launch-editor",
        "logfmt",
        "mcp-proxy",
        "semver",
        "uuidv7",
        "yaml",
        "zod"
      ],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        preserveModules: true,
        preserveModulesRoot: "src"
      }
    },
    minify: false,
    sourcemap: true
  }
});
export {
  vite_node_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5ub2RlLmNvbmZpZy50cyIsICJ2aXRlLmNvbmZpZy5iYXNlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvYnlrL1Byb2plY3RzL2dldHNlbnRyeS9zcG90bGlnaHQvcGFja2FnZXMvc3BvdGxpZ2h0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9ieWsvUHJvamVjdHMvZ2V0c2VudHJ5L3Nwb3RsaWdodC9wYWNrYWdlcy9zcG90bGlnaHQvdml0ZS5ub2RlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9ieWsvUHJvamVjdHMvZ2V0c2VudHJ5L3Nwb3RsaWdodC9wYWNrYWdlcy9zcG90bGlnaHQvdml0ZS5ub2RlLmNvbmZpZy50c1wiO2ltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBzZW50cnlWaXRlUGx1Z2luIH0gZnJvbSBcIkBzZW50cnkvdml0ZS1wbHVnaW5cIjtcbmltcG9ydCB0eXBlIHsgUGx1Z2luIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgeyBhbGlhc2VzLCBkZWZpbmVQcm9kdWN0aW9uLCBkdHNQbHVnaW4sIHNlbnRyeVBsdWdpbk9wdGlvbnMgfSBmcm9tIFwiLi92aXRlLmNvbmZpZy5iYXNlXCI7XG5cbi8vIEN1c3RvbSBwbHVnaW4gdG8gYWRkIHNoZWJhbmcgdG8gdGhlIENMSSBlbnRyeSBwb2ludFxuLy8gVGhpcyBydW5zIGFmdGVyIGFsbCBvdGhlciB0cmFuc2Zvcm1hdGlvbnMgdG8gZW5zdXJlIHRoZSBzaGViYW5nIGlzIHRoZSBmaXJzdCBsaW5lXG5jb25zdCBzaGViYW5nUGx1Z2luID0gKCk6IFBsdWdpbiA9PiAoe1xuICBuYW1lOiBcInNoZWJhbmdcIixcbiAgYXBwbHk6IFwiYnVpbGRcIixcbiAgZW5mb3JjZTogXCJwb3N0XCIsXG4gIGdlbmVyYXRlQnVuZGxlKF9vcHRpb25zLCBidW5kbGUpIHtcbiAgICBmb3IgKGNvbnN0IFtmaWxlTmFtZSwgY2h1bmtdIG9mIE9iamVjdC5lbnRyaWVzKGJ1bmRsZSkpIHtcbiAgICAgIGlmIChmaWxlTmFtZSA9PT0gXCJydW4uanNcIiAmJiBjaHVuay50eXBlID09PSBcImNodW5rXCIpIHtcbiAgICAgICAgLy8gRW5zdXJlIHNoZWJhbmcgaXMgdGhlIHZlcnkgZmlyc3QgbGluZVxuICAgICAgICBpZiAoIWNodW5rLmNvZGUuc3RhcnRzV2l0aChcIiMhL3Vzci9iaW4vZW52IG5vZGVcXG5cIikpIHtcbiAgICAgICAgICBjaHVuay5jb2RlID0gYCMhL3Vzci9iaW4vZW52IG5vZGVcXG4ke2NodW5rLmNvZGV9YDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgZHRzUGx1Z2luLFxuICAgIHNlbnRyeVZpdGVQbHVnaW4oe1xuICAgICAgLi4uc2VudHJ5UGx1Z2luT3B0aW9ucyxcbiAgICAgIHByb2plY3Q6IHByb2Nlc3MuZW52Lk1BSU5fVklURV9VSV9TRU5UUllfUFJPSkVDVCxcbiAgICB9KSxcbiAgICBzaGViYW5nUGx1Z2luKCksXG4gIF0sXG4gIGRlZmluZTogZGVmaW5lUHJvZHVjdGlvbixcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiBhbGlhc2VzLFxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogXCJub2RlMjBcIixcbiAgICBvdXREaXI6IFwiZGlzdFwiLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6IHtcbiAgICAgICAgcnVuOiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvcnVuLnRzXCIpLFxuICAgICAgICBcInNlcnZlci9tYWluXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9zZXJ2ZXIvbWFpbi50c1wiKSxcbiAgICAgICAgXCJzZXJ2ZXIvc2RrXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9zZXJ2ZXIvc2RrLnRzXCIpLFxuICAgICAgfSxcbiAgICAgIGZvcm1hdHM6IFtcImVzXCJdLFxuICAgIH0sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFtcbiAgICAgICAgLy8gRXh0ZXJuYWxpemUgYWxsIE5vZGUuanMgYnVpbHQtaW5zXG4gICAgICAgIC9ebm9kZTouKi8sXG4gICAgICAgIC8vIEV4dGVybmFsaXplIGFsbCBkZXBlbmRlbmNpZXNcbiAgICAgICAgXCJAaG9uby9tY3BcIixcbiAgICAgICAgXCJAaG9uby9ub2RlLXNlcnZlclwiLFxuICAgICAgICBcIkBqcmlkZ2V3ZWxsL3RyYWNlLW1hcHBpbmdcIixcbiAgICAgICAgXCJAbW9kZWxjb250ZXh0cHJvdG9jb2wvc2RrXCIsXG4gICAgICAgIFwiQHNlbnRyeS9jb3JlXCIsXG4gICAgICAgIFwiQHNlbnRyeS9lbGVjdHJvblwiLFxuICAgICAgICBcIkBzZW50cnkvbm9kZVwiLFxuICAgICAgICBcImNoYWxrXCIsXG4gICAgICAgIFwiZWxlY3Ryb24tc3RvcmVcIixcbiAgICAgICAgXCJlbGVjdHJvbi11cGRhdGVyXCIsXG4gICAgICAgIFwiZXZlbnRzb3VyY2VcIixcbiAgICAgICAgXCJmYXN0LWZ1enp5XCIsXG4gICAgICAgIFwiaG9ub1wiLFxuICAgICAgICBcImxhdW5jaC1lZGl0b3JcIixcbiAgICAgICAgXCJsb2dmbXRcIixcbiAgICAgICAgXCJtY3AtcHJveHlcIixcbiAgICAgICAgXCJzZW12ZXJcIixcbiAgICAgICAgXCJ1dWlkdjdcIixcbiAgICAgICAgXCJ5YW1sXCIsXG4gICAgICAgIFwiem9kXCIsXG4gICAgICBdLFxuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiBcIltuYW1lXS5qc1wiLFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJbbmFtZV0uanNcIixcbiAgICAgICAgcHJlc2VydmVNb2R1bGVzOiB0cnVlLFxuICAgICAgICBwcmVzZXJ2ZU1vZHVsZXNSb290OiBcInNyY1wiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIG1pbmlmeTogZmFsc2UsXG4gICAgc291cmNlbWFwOiB0cnVlLFxuICB9LFxufSk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9ob21lL2J5ay9Qcm9qZWN0cy9nZXRzZW50cnkvc3BvdGxpZ2h0L3BhY2thZ2VzL3Nwb3RsaWdodFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvYnlrL1Byb2plY3RzL2dldHNlbnRyeS9zcG90bGlnaHQvcGFja2FnZXMvc3BvdGxpZ2h0L3ZpdGUuY29uZmlnLmJhc2UudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvYnlrL1Byb2plY3RzL2dldHNlbnRyeS9zcG90bGlnaHQvcGFja2FnZXMvc3BvdGxpZ2h0L3ZpdGUuY29uZmlnLmJhc2UudHNcIjtpbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJAdGFpbHdpbmRjc3Mvdml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IGR0cyBmcm9tIFwidml0ZS1wbHVnaW4tZHRzXCI7XG5pbXBvcnQgc3ZnciBmcm9tIFwidml0ZS1wbHVnaW4tc3ZnclwiO1xuXG5leHBvcnQgY29uc3QgYWxpYXNlcyA9IHtcbiAgXCJAc3BvdGxpZ2h0L3VpXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy91aVwiKSxcbiAgXCJAc3BvdGxpZ2h0L3NlcnZlclwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvc2VydmVyXCIpLFxuICBcIkBzcG90bGlnaHQvc2hhcmVkXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9zaGFyZWRcIiksXG59O1xuXG5leHBvcnQgY29uc3QgZGVmaW5lUHJvZHVjdGlvbiA9IHtcbiAgXCJwcm9jZXNzLmVudi5OT0RFX0VOVlwiOiAnXCJwcm9kdWN0aW9uXCInLFxuICBcInByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb25cIjogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiksXG4gIC8vIFNldCB0byBmYWxzZSBmb3IgdHJlZS1zaGFraW5nOyBFbGVjdHJvbiBjb25maWcgb3ZlcnJpZGVzIHRvIHRydWVcbiAgX19JU19FTEVDVFJPTl9fOiBmYWxzZSxcbn07XG5cbmV4cG9ydCBjb25zdCBkZWZpbmVEZXZlbG9wbWVudCA9IHtcbiAgXCJwcm9jZXNzLmVudi5OT0RFX0VOVlwiOiAnXCJkZXZlbG9wbWVudFwiJyxcbiAgXCJwcm9jZXNzLmVudi5ucG1fcGFja2FnZV92ZXJzaW9uXCI6IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb24pLFxuICAvLyBTZXQgdG8gZmFsc2UgZm9yIHRyZWUtc2hha2luZzsgRWxlY3Ryb24gY29uZmlnIG92ZXJyaWRlcyB0byB0cnVlXG4gIF9fSVNfRUxFQ1RST05fXzogZmFsc2UsXG59O1xuXG5leHBvcnQgY29uc3QgcmVhY3RQbHVnaW5zID0gW1xuICByZWFjdCgpLFxuICBzdmdyKHtcbiAgICBzdmdyT3B0aW9uczoge1xuICAgICAgdGl0bGVQcm9wOiB0cnVlLFxuICAgIH0sXG4gIH0pLFxuICB0YWlsd2luZGNzcygpLFxuXTtcblxuZXhwb3J0IGNvbnN0IGR0c1BsdWdpbiA9IGR0cyh7XG4gIGluc2VydFR5cGVzRW50cnk6IHRydWUsXG59KTtcblxuZXhwb3J0IGNvbnN0IHNlbnRyeVBsdWdpbk9wdGlvbnMgPSB7XG4gIG9yZzogcHJvY2Vzcy5lbnYuTUFJTl9WSVRFX1NFTlRSWV9PUkcsXG4gIGF1dGhUb2tlbjogcHJvY2Vzcy5lbnYuTUFJTl9WSVRFX1NFTlRSWV9BVVRIX1RPS0VOLFxuICByZWxlYXNlOiB7XG4gICAgbmFtZTogcHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbixcbiAgfSxcbn07XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVXLFNBQVMsV0FBQUEsZ0JBQWU7QUFDL1gsU0FBUyx3QkFBd0I7QUFFakMsU0FBUyxvQkFBb0I7OztBQ0gwVSxTQUFTLGVBQWU7QUFDL1gsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFKakIsSUFBTSxtQ0FBbUM7QUFNbEMsSUFBTSxVQUFVO0FBQUEsRUFDckIsaUJBQWlCLFFBQVEsa0NBQVcsUUFBUTtBQUFBLEVBQzVDLHFCQUFxQixRQUFRLGtDQUFXLFlBQVk7QUFBQSxFQUNwRCxxQkFBcUIsUUFBUSxrQ0FBVyxZQUFZO0FBQ3REO0FBRU8sSUFBTSxtQkFBbUI7QUFBQSxFQUM5Qix3QkFBd0I7QUFBQSxFQUN4QixtQ0FBbUMsS0FBSyxVQUFVLFFBQVEsSUFBSSxtQkFBbUI7QUFBQTtBQUFBLEVBRWpGLGlCQUFpQjtBQUNuQjtBQUVPLElBQU0sb0JBQW9CO0FBQUEsRUFDL0Isd0JBQXdCO0FBQUEsRUFDeEIsbUNBQW1DLEtBQUssVUFBVSxRQUFRLElBQUksbUJBQW1CO0FBQUE7QUFBQSxFQUVqRixpQkFBaUI7QUFDbkI7QUFFTyxJQUFNLGVBQWU7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixLQUFLO0FBQUEsSUFDSCxhQUFhO0FBQUEsTUFDWCxXQUFXO0FBQUEsSUFDYjtBQUFBLEVBQ0YsQ0FBQztBQUFBLEVBQ0QsWUFBWTtBQUNkO0FBRU8sSUFBTSxZQUFZLElBQUk7QUFBQSxFQUMzQixrQkFBa0I7QUFDcEIsQ0FBQztBQUVNLElBQU0sc0JBQXNCO0FBQUEsRUFDakMsS0FBSyxRQUFRLElBQUk7QUFBQSxFQUNqQixXQUFXLFFBQVEsSUFBSTtBQUFBLEVBQ3ZCLFNBQVM7QUFBQSxJQUNQLE1BQU0sUUFBUSxJQUFJO0FBQUEsRUFDcEI7QUFDRjs7O0FEOUNBLElBQU1DLG9DQUFtQztBQVF6QyxJQUFNLGdCQUFnQixPQUFlO0FBQUEsRUFDbkMsTUFBTTtBQUFBLEVBQ04sT0FBTztBQUFBLEVBQ1AsU0FBUztBQUFBLEVBQ1QsZUFBZSxVQUFVLFFBQVE7QUFDL0IsZUFBVyxDQUFDLFVBQVUsS0FBSyxLQUFLLE9BQU8sUUFBUSxNQUFNLEdBQUc7QUFDdEQsVUFBSSxhQUFhLFlBQVksTUFBTSxTQUFTLFNBQVM7QUFFbkQsWUFBSSxDQUFDLE1BQU0sS0FBSyxXQUFXLHVCQUF1QixHQUFHO0FBQ25ELGdCQUFNLE9BQU87QUFBQSxFQUF3QixNQUFNLElBQUk7QUFBQSxRQUNqRDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTywyQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1A7QUFBQSxJQUNBLGlCQUFpQjtBQUFBLE1BQ2YsR0FBRztBQUFBLE1BQ0gsU0FBUyxRQUFRLElBQUk7QUFBQSxJQUN2QixDQUFDO0FBQUEsSUFDRCxjQUFjO0FBQUEsRUFDaEI7QUFBQSxFQUNBLFFBQVE7QUFBQSxFQUNSLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsUUFDTCxLQUFLQyxTQUFRQyxtQ0FBVyxZQUFZO0FBQUEsUUFDcEMsZUFBZUQsU0FBUUMsbUNBQVcsb0JBQW9CO0FBQUEsUUFDdEQsY0FBY0QsU0FBUUMsbUNBQVcsbUJBQW1CO0FBQUEsTUFDdEQ7QUFBQSxNQUNBLFNBQVMsQ0FBQyxJQUFJO0FBQUEsSUFDaEI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQTtBQUFBLFFBRVI7QUFBQTtBQUFBLFFBRUE7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsUUFDaEIsaUJBQWlCO0FBQUEsUUFDakIscUJBQXFCO0FBQUEsTUFDdkI7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsRUFDYjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInJlc29sdmUiLCAiX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUiLCAicmVzb2x2ZSIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSJdCn0K
