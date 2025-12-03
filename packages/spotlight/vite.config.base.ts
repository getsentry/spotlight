import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";

export const aliases = {
  "@spotlight/ui": resolve(__dirname, "src/ui"),
  "@spotlight/server": resolve(__dirname, "src/server"),
  "@spotlight/shared": resolve(__dirname, "src/shared"),
};

export const defineProduction = {
  "process.env.NODE_ENV": '"production"',
  "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
  // Set to false for tree-shaking; Electron config overrides to true
  __IS_ELECTRON__: false,
};

export const defineDevelopment = {
  "process.env.NODE_ENV": '"development"',
  "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
  // Set to false for tree-shaking; Electron config overrides to true
  __IS_ELECTRON__: false,
};

export const reactPlugins = [
  react(),
  svgr({
    svgrOptions: {
      titleProp: true,
    },
  }),
  tailwindcss(),
];

export const dtsPlugin = dts({
  insertTypesEntry: true,
});

export const sentryPluginOptions = {
  org: process.env.MAIN_VITE_SENTRY_ORG,
  authToken: process.env.MAIN_VITE_SENTRY_AUTH_TOKEN,
  release: {
    name: process.env.npm_package_version,
  },
};
