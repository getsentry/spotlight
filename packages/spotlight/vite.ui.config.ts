import { resolve } from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from "vite";
import { aliases, defineProduction, reactPlugins } from "./vite.config.base";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  let env: Record<string, string> = {};

  if (!isDev) {
    env = process.env as Record<string, string>;
  }

  console.log("ENV", isDev);
  console.log("ENV", "MAIN_VITE_UI_SENTRY_PROJECT" in process.env);
  console.log("ENV", "MAIN_VITE_SENTRY_ORG" in process.env);
  console.log("ENV", "MAIN_VITE_SENTRY_PROJECT" in process.env);

  return {
    plugins: [
      reactPlugins,
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
  };
});
