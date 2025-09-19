import { resolve, sep } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { RenderedChunk } from "rollup";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
    svgr({
      svgrOptions: {
        titleProp: true,
      },
    }),
    tailwindcss(),
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
