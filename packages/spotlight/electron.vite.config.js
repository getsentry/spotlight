import { resolve } from "node:path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "electron-vite";
import sourcemaps from "rollup-plugin-sourcemaps2";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // By default, only env variables prefixed with `MAIN_VITE_`,
  // `PRELOAD_VITE_` and `RENDERER_VITE_` are loaded,
  // unless the third parameter `prefixes` is changed.
  let env = {};
  if (mode !== "development") {
    env = loadEnv(mode);
  }
  return {
    main: {
      resolve: {
        alias: {
          "~": resolve(__dirname, "src/sidecar"),
        },
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
        sourcemap: true,
        rollupOptions: {
          plugins: [sourcemaps()],
          input: {
            index: resolve(__dirname, "src/electron/main/index.ts"),
          },
        },
      },
    },
    preload: {
      resolve: {
        alias: {
          "~": resolve(__dirname, "src/sidecar"),
        },
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
        sourcemap: true,
        rollupOptions: {
          plugins: [sourcemaps()],
          input: {
            index: resolve(__dirname, "src/electron/preload/index.ts"),
          },
        },
      },
    },
    renderer: {
      resolve: {
        alias: {
          "~": resolve(__dirname, "src/ui"),
        },
      },
      define: {
        "process.env.NODE_ENV": '"production"',
        "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
      },
      plugins: [
        react(),
        svgr({
          svgrOptions: {
            titleProp: true,
          },
        }),
        sentryVitePlugin({
          org: env.MAIN_VITE_SENTRY_ORG,
          project: env.MAIN_VITE_SENTRY_PROJECT,
          authToken: env.MAIN_VITE_SENTRY_AUTH_TOKEN,
          debug: true,
        }),
      ],
      root: ".",
      build: {
        sourcemap: true,
        rollupOptions: {
          plugins: [sourcemaps()],
          input: {
            index: resolve(__dirname, "electron.html"),
          },
        },
      },
    },
  };
});
