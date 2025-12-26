import { resolve } from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { aliases, defineProduction, dtsPlugin, sentryPluginOptions } from "./vite.config.base";

// Custom plugin to add shebang to the CLI entry point
// This runs after all other transformations to ensure the shebang is the first line
const shebangPlugin = (): Plugin => ({
  name: "shebang",
  apply: "build",
  enforce: "post",
  generateBundle(_options, bundle) {
    for (const [fileName, chunk] of Object.entries(bundle)) {
      if (fileName === "run.js" && chunk.type === "chunk") {
        // Ensure shebang is the very first line
        if (!chunk.code.startsWith("#!/usr/bin/env node\n")) {
          chunk.code = `#!/usr/bin/env node\n${chunk.code}`;
        }
      }
    }
  },
});

export default defineConfig({
  plugins: [
    dtsPlugin,
    sentryVitePlugin({
      ...sentryPluginOptions,
      project: process.env.MAIN_VITE_UI_SENTRY_PROJECT,
    }),
    shebangPlugin(),
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
        "launch-editor",
        "logfmt",
        "mcp-proxy",
        "semver",
        "uuidv7",
        "yaml",
        "zod",
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
