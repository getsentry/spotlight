import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/main.ts", "./src/constants.ts", "./server.ts", "./src/parser/index.ts", "./src/format/index.ts"],
  sourcemap: true,
});
