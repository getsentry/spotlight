import { sentryVitePlugin } from "@sentry/vite-plugin";
import sourcemaps from "rollup-plugin-sourcemaps2";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";
import { aliases, defineDevelopment, defineProduction, reactPlugins, sentryPluginOptions } from "./vite.config.base";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    root: ".",
    publicDir: "public",
    plugins: [
      ...reactPlugins,
      sentryVitePlugin({
        ...sentryPluginOptions,
        project: process.env.MAIN_VITE_SENTRY_PROJECT,
      }),
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
                ...sentryPluginOptions,
                project: process.env.MAIN_VITE_SENTRY_PROJECT,
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
      }),
    ],
    resolve: {
      alias: aliases,
    },
    define: {
      ...(isDev ? defineDevelopment : defineProduction),
      __IS_ELECTRON__: true,
    },
    build: {
      outDir: "dist-electron/renderer",
      sourcemap: true,
      rollupOptions: {
        input: { index: "index.html" },
      },
    },
  };
});
