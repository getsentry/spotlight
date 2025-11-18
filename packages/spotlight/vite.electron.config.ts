import { sentryVitePlugin } from "@sentry/vite-plugin";
import sourcemaps from "rollup-plugin-sourcemaps2";
import { defineConfig, loadEnv } from "vite";
import electron from "vite-plugin-electron/simple";
import { aliases, defineDevelopment, defineProduction, reactPlugins } from "./vite.config.base";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  let env: Record<string, string> = {};

  if (!isDev) {
    env = loadEnv(mode, process.cwd());
  }

  return {
    root: ".",
    publicDir: "public",
    plugins: [
      ...reactPlugins,
      electron({
        main: {
          entry: "src/electron/main/index.ts",
          onstart({ startup }) {
            // Manually start Electron with the correct entry point
            // This allows package.json main to point to the sidecar for npm usage
            startup(["dist-electron/main/index.js", "--no-sandbox"]);
          },
          vite: {
            resolve: {
              alias: aliases,
            },
            define: isDev ? defineDevelopment : defineProduction,
            plugins: [
              sentryVitePlugin({
                org: env.MAIN_VITE_SENTRY_ORG,
                project: env.MAIN_VITE_SENTRY_PROJECT,
                authToken: env.MAIN_VITE_SENTRY_AUTH_TOKEN,
                release: {
                  name: process.env.npm_package_version,
                },
              }),
            ],
            build: {
              outDir: "dist-electron/main",
              sourcemap: true,
              rollupOptions: {
                plugins: [sourcemaps()],
              },
            },
          },
        },
        preload: {
          input: "src/electron/preload/index.ts",
          vite: {
            resolve: {
              alias: aliases,
            },
            plugins: [
              sentryVitePlugin({
                org: env.MAIN_VITE_SENTRY_ORG,
                project: env.MAIN_VITE_SENTRY_PROJECT,
                authToken: env.MAIN_VITE_SENTRY_AUTH_TOKEN,
                release: {
                  name: process.env.npm_package_version,
                },
              }),
            ],
            build: {
              outDir: "dist-electron/preload",
              sourcemap: true,
              rollupOptions: {
                plugins: [sourcemaps()],
                output: {
                  format: "cjs",
                  entryFileNames: "[name].cjs",
                },
              },
            },
          },
        },
      }),
    ],
    resolve: {
      alias: aliases,
    },
    define: isDev ? defineDevelopment : defineProduction,
    build: {
      outDir: "dist-electron/renderer",
      rollupOptions: {
        input: { index: "index.html" },
      },
    },
  };
});
