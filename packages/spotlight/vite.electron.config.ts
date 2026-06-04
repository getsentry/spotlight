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
              // The Electron main process runs in Node, so target a modern
              // runtime. Without this, vite 6's default browser target makes
              // esbuild 0.27+ error on async destructuring it can't down-transpile.
              target: "node20",
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
      // Electron always ships a modern Chromium, so target esnext. This also
      // avoids vite 6 / esbuild 0.27+ erroring when it can't down-transpile
      // certain destructuring patterns to the default legacy browser target.
      target: "esnext",
      rollupOptions: {
        input: { index: "index.html" },
      },
    },
  };
});
