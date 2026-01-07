import { resolve } from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import { aliases, defineProduction, reactPlugins, sentryPluginOptions } from "./vite.config.base";

export default defineConfig({
  plugins: [
    ...reactPlugins,
    sentryVitePlugin({
      ...sentryPluginOptions,
      project: process.env.MAIN_VITE_UI_SENTRY_PROJECT,
    }),
  ],
  define: defineProduction,
  resolve: {
    alias: aliases,
  },
  build: {
    outDir: resolve(__dirname, "dist", "ui"),
    manifest: "manifest.json",
    sourcemap: true,
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
