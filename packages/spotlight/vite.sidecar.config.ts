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
    "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      "~/main.js": resolve(__dirname, "src/sidecar/main.ts"),
      "~/logger.js": resolve(__dirname, "src/sidecar/logger.ts"),
      "~/constants.js": resolve(__dirname, "src/sidecar/constants.ts"),
      "~/parser/index.js": resolve(__dirname, "src/sidecar/parser/index.ts"),
      "~/parser/helpers.js": resolve(__dirname, "src/sidecar/parser/helpers.ts"),
      "~/parser/types.js": resolve(__dirname, "src/sidecar/parser/types.ts"),
      "~/formatters/md/__tests__/test_envelopes.js": resolve(
        __dirname,
        "src/sidecar/formatters/md/__tests__/test_envelopes.ts",
      ),
      "~/mcp/mcp.js": resolve(__dirname, "src/sidecar/mcp/mcp.ts"),
      "~/routes/stream/userAgent.js": resolve(__dirname, "src/sidecar/routes/stream/userAgent.ts"),
      "~/types/env.js": resolve(__dirname, "src/sidecar/types/env.ts"),
      "~/utils/index.js": resolve(__dirname, "src/sidecar/utils/index.ts"),
    },
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
