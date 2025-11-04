import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";

import packageJson from "./package.json";

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
});

export default defineConfig({
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.npm_package_version": JSON.stringify(
      process.env.npm_package_version
    ),
  },
  build: {
    ssr: true,
    lib: {
      entry: {
        sidecar: resolve(__dirname, "src/sidecar.ts"),
        run: resolve(__dirname, "src/run.ts"),
      },
    },
    rollupOptions: {
      external: [...dependencies, ...builtinModules.map((x) => `node:${x}`)],
    },
  },
});
