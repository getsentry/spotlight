import { resolve } from "node:path";
import { defineConfig } from "vite";
import { aliases, defineDevelopment, dtsPlugin, reactPlugins } from "./vite.config.base";

export default defineConfig({
  plugins: [...reactPlugins, dtsPlugin],
  define: defineDevelopment,
  resolve: {
    alias: aliases,
  },
  server: {
    headers: {
      "Document-Policy": "js-profiling",
    },
    historyApiFallback: true,
  },
  build: {
    outDir: resolve(__dirname, "dist", "ui"),
    manifest: "manifest.json",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      // We disable versioned filenames here explicitly
      // so we can include the script when sidecar is running
      // for server-side frameworks
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
