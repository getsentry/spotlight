import { resolve } from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig, loadEnv } from "vite";
import { aliases, defineProduction, dtsPlugin } from "./vite.config.base";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  let env: Record<string, string> = {};

  if (!isDev) {
    env = loadEnv(mode, process.cwd());
  }

  return {
    plugins: [
      dtsPlugin,
      sentryVitePlugin({
        org: env.MAIN_VITE_SENTRY_ORG,
        project: env.MAIN_VITE_UI_SENTRY_PROJECT,
        authToken: env.MAIN_VITE_SENTRY_AUTH_TOKEN,
        release: {
          name: process.env.npm_package_version,
        },
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
  };
});
