import { builtinModules } from "node:module";
import { defineConfig } from "tsdown";
import packageJson from "./package.json";

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
});

export default defineConfig({
  entry: ["./src/main.ts", "./src/vite-plugin.ts", "./src/constants.ts", "./server.ts"],
  sourcemap: true,
  external: [...dependencies, ...builtinModules.map(x => `node:${x}`)],
});
