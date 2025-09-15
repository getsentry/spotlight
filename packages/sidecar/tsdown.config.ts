import { defineConfig } from "tsdown";
import pkg from "./package.json" assert { type: "json" };

export default defineConfig({
  entry: ["./server.ts", ...Object.values(pkg.exports).map(x => x.import.replace("dist/", "").replace(".js", ".ts"))],
  sourcemap: true,
});
