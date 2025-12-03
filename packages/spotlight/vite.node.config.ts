import { resolve } from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import { aliases, defineProduction, dtsPlugin, sentryPluginOptions } from "./vite.config.base";

export default defineConfig({
  plugins: [
    dtsPlugin,
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
    target: "node20",
    outDir: "dist",
    lib: {
      entry: {
        run: resolve(__dirname, "src/run.ts"),
        "server/main": resolve(__dirname, "src/server/main.ts"),
        "server/sdk": resolve(__dirname, "src/server/sdk.ts"),
      },
      formats: ["es"],
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
        "import-meta-resolve",
        "launch-editor",
        "logfmt",
        "mcp-proxy",
        "uuidv7",
        "yaml",
        "zod",
        "pidusage",
      ],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        preserveModules: true,
        preserveModulesRoot: "src",
      },
    },
    minify: false,
    sourcemap: true,
  },
});
