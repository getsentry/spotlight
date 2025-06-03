import { resolve, sep } from "node:path";
import spotlightSidecar from "@spotlightjs/sidecar/vite-plugin";
import react from "@vitejs/plugin-react";
import MagicString from "magic-string";
import type { RenderedChunk } from "rollup";
import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";

const removeReactDevToolsMessagePlugin: () => PluginOption = () => ({
  name: "remove-react-devtools-message",
  transform(code, id) {
    if (id.includes(`${sep}react-dom${sep}`) && code.includes("__REACT_DEVTOOLS_GLOBAL_HOOK__")) {
      const ms = new MagicString(code);
      ms.replaceAll("__REACT_DEVTOOLS_GLOBAL_HOOK__", "({ isDisabled: true })");
      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: true }),
      };
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    spotlightSidecar(),
    react(),
    dts({
      insertTypesEntry: true,
    }),
    svgr({
      svgrOptions: {
        titleProp: true,
      },
    }),
    removeReactDevToolsMessagePlugin(),
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "Spotlight",
      // the proper extensions will be added
      fileName: "sentry-spotlight",
      formats: ["es", "iife", "umd"],
    },
    rollupOptions: {
      treeshake: "smallest",
      output: {
        footer(chunk: RenderedChunk) {
          if (chunk.fileName.endsWith(".iife.js")) {
            return "(function(S){S && S.init()}(window.Spotlight))";
          }
          return "";
        },
      },
    },
    sourcemap: true,
  },
});
