import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/main.ts", "./src/vite-plugin.ts", "./src/constants.ts", "./server.ts"],
  sourcemap: true,
});
