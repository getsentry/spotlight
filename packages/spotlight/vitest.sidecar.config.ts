import { defineConfig } from "vitest/config";
import { aliases } from "./vite.config.base";

export default defineConfig({
  test: {
    alias: aliases,
  },
});
