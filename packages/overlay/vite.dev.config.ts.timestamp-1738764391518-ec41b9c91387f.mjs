// vite.dev.config.ts
import spotlightSidecar from "file:///home/byk/Projects/getsentry/spotlight/packages/sidecar/dist/vite-plugin.js";
import react from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/@vitejs+plugin-react@4.3.2_vite@5.4.12_@types+node@22.7.5_terser@5.37.0_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import dts from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/vite-plugin-dts@3.9.1_@types+node@22.7.5_rollup@4.34.1_typescript@5.6.2_vite@5.4.12_@types+node@22.7.5_terser@5.37.0_/node_modules/vite-plugin-dts/dist/index.mjs";
import svgr from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/vite-plugin-svgr@3.3.0_rollup@4.34.1_typescript@5.6.2_vite@5.4.12_@types+node@22.7.5_terser@5.37.0_/node_modules/vite-plugin-svgr/dist/index.js";
import { resolve } from "node:path";
import { defineConfig } from "file:///home/byk/Projects/getsentry/spotlight/node_modules/.pnpm/vite@5.4.12_@types+node@22.7.5_terser@5.37.0/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "/home/byk/Projects/getsentry/spotlight/packages/overlay";
var vite_dev_config_default = defineConfig({
  plugins: [
    spotlightSidecar(),
    react(),
    dts({
      insertTypesEntry: true
    }),
    svgr({
      svgrOptions: {
        titleProp: true
      }
    })
  ],
  define: {
    "process.env.NODE_ENV": '"development"',
    "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version)
  },
  resolve: {
    alias: {
      "~": resolve(__vite_injected_original_dirname, "src")
    }
  },
  build: {
    outDir: resolve(__vite_injected_original_dirname, "dist", "overlay"),
    manifest: "manifest.json",
    rollupOptions: {
      input: {
        main: resolve(__vite_injected_original_dirname, "index.html")
      },
      // We disable versioned filenames here explicitly
      // so we can include the script when sidecar is running
      // for server-side frameworks
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]"
      }
    }
  }
});
export {
  vite_dev_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5kZXYuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL2hvbWUvYnlrL1Byb2plY3RzL2dldHNlbnRyeS9zcG90bGlnaHQvcGFja2FnZXMvb3ZlcmxheVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvYnlrL1Byb2plY3RzL2dldHNlbnRyeS9zcG90bGlnaHQvcGFja2FnZXMvb3ZlcmxheS92aXRlLmRldi5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvYnlrL1Byb2plY3RzL2dldHNlbnRyeS9zcG90bGlnaHQvcGFja2FnZXMvb3ZlcmxheS92aXRlLmRldi5jb25maWcudHNcIjtpbXBvcnQgc3BvdGxpZ2h0U2lkZWNhciBmcm9tICdAc3BvdGxpZ2h0anMvc2lkZWNhci92aXRlLXBsdWdpbic7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xuaW1wb3J0IHN2Z3IgZnJvbSAndml0ZS1wbHVnaW4tc3Zncic7XG5cbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdub2RlOnBhdGgnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBzcG90bGlnaHRTaWRlY2FyKCksXG4gICAgcmVhY3QoKSxcbiAgICBkdHMoe1xuICAgICAgaW5zZXJ0VHlwZXNFbnRyeTogdHJ1ZSxcbiAgICB9KSxcbiAgICBzdmdyKHtcbiAgICAgIHN2Z3JPcHRpb25zOiB7XG4gICAgICAgIHRpdGxlUHJvcDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIGRlZmluZToge1xuICAgICdwcm9jZXNzLmVudi5OT0RFX0VOVic6ICdcImRldmVsb3BtZW50XCInLFxuICAgICdwcm9jZXNzLmVudi5ucG1fcGFja2FnZV92ZXJzaW9uJzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiksXG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ34nOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgb3V0RGlyOiByZXNvbHZlKF9fZGlybmFtZSwgJ2Rpc3QnLCAnb3ZlcmxheScpLFxuICAgIG1hbmlmZXN0OiAnbWFuaWZlc3QuanNvbicsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IHtcbiAgICAgICAgbWFpbjogcmVzb2x2ZShfX2Rpcm5hbWUsICdpbmRleC5odG1sJyksXG4gICAgICB9LFxuICAgICAgLy8gV2UgZGlzYWJsZSB2ZXJzaW9uZWQgZmlsZW5hbWVzIGhlcmUgZXhwbGljaXRseVxuICAgICAgLy8gc28gd2UgY2FuIGluY2x1ZGUgdGhlIHNjcmlwdCB3aGVuIHNpZGVjYXIgaXMgcnVubmluZ1xuICAgICAgLy8gZm9yIHNlcnZlci1zaWRlIGZyYW1ld29ya3NcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uanMnLFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uW2V4dF0nLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQStWLE9BQU8sc0JBQXNCO0FBQzVYLE9BQU8sV0FBVztBQUNsQixPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBRWpCLFNBQVMsZUFBZTtBQUN4QixTQUFTLG9CQUFvQjtBQU43QixJQUFNLG1DQUFtQztBQVF6QyxJQUFPLDBCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxpQkFBaUI7QUFBQSxJQUNqQixNQUFNO0FBQUEsSUFDTixJQUFJO0FBQUEsTUFDRixrQkFBa0I7QUFBQSxJQUNwQixDQUFDO0FBQUEsSUFDRCxLQUFLO0FBQUEsTUFDSCxhQUFhO0FBQUEsUUFDWCxXQUFXO0FBQUEsTUFDYjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLHdCQUF3QjtBQUFBLElBQ3hCLG1DQUFtQyxLQUFLLFVBQVUsUUFBUSxJQUFJLG1CQUFtQjtBQUFBLEVBQ25GO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLElBQy9CO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUSxRQUFRLGtDQUFXLFFBQVEsU0FBUztBQUFBLElBQzVDLFVBQVU7QUFBQSxJQUNWLGVBQWU7QUFBQSxNQUNiLE9BQU87QUFBQSxRQUNMLE1BQU0sUUFBUSxrQ0FBVyxZQUFZO0FBQUEsTUFDdkM7QUFBQTtBQUFBO0FBQUE7QUFBQSxNQUlBLFFBQVE7QUFBQSxRQUNOLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLE1BQ2xCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
