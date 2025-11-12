import { defineConfig } from "vite";
import { aliases, defineDevelopment, dtsPlugin, reactPlugins } from "./vite.config.base";

export default defineConfig({
  plugins: [...reactPlugins, dtsPlugin],
  define: defineDevelopment,
  resolve: {
    alias: aliases,
  },
  server: {
    headers: {
      "Document-Policy": "js-profiling",
    },
    historyApiFallback: true,
  },
});
