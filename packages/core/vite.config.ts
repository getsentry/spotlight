import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      include: ["src/**/*"],
      exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "sentry/index": resolve(__dirname, "src/sentry/index.ts"),
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: ["dayjs", "@sentry/core"],
    },
    sourcemap: true,
  },
});
