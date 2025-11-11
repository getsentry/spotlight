import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    alias: {
      "@spotlight/sidecar": path.resolve(__dirname, "src/sidecar"),
      "@spotlight/shared": path.resolve(__dirname, "src/shared"),
    },
  },
});
