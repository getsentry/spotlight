import { resolve } from "node:path";
import type { RenderedChunk } from "rollup";
import { defineConfig } from "vite";
import { aliases, defineProduction, dtsPlugin, reactPlugins } from "./vite.config.base";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [...reactPlugins, dtsPlugin],
  define: defineProduction,
  resolve: {
    alias: aliases,
  },
  build: {
    emptyOutDir: false,
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
