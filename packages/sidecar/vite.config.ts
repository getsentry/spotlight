import { builtinModules } from "node:module";
import { defineConfig } from "vite";

import packageJson from "./package.json";

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
});

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: "./src/main.ts",
        "vite-plugin": "./src/vite-plugin.ts",
        constants: "./src/constants.ts",
        server: "./server.ts",
      },
      formats: ["es"],
    },
    outDir: "./dist",
    sourcemap: true,
    rollupOptions: {
      external: [...dependencies, ...builtinModules.map(x => `node:${x}`), ...builtinModules],
    },
  },
});
