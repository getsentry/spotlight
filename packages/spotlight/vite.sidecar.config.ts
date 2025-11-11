import { builtinModules } from "node:module";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { aliases, defineProduction } from "./vite.config.base";

import packageJson from "./package.json";

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
});

export default defineConfig({
  define: defineProduction,
  resolve: {
    alias: aliases,
  },
  build: {
    ssr: true,
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: {
        run: resolve(__dirname, "src/run.ts"),
        instrument: resolve(__dirname, "src/instrument.ts"),
      },
    },
    rollupOptions: {
      external: [...dependencies, ...builtinModules.map(x => `node:${x}`)],
      output: {
        banner: chunk => {
          if (chunk.name === "run") {
            return "#!/usr/bin/env node";
          }
          return "";
        },
      },
    },
  },
});
