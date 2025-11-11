import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        titleProp: true,
      },
    }),
    tailwindcss(),
  ],
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.npm_package_version": JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      "~/shared": resolve(__dirname, "src/shared"),
      "~/sidecar": resolve(__dirname, "src/sidecar"),
      "~": resolve(__dirname, "src/ui"),
    },
  },
  build: {
    outDir: resolve(__dirname, "dist", "ui"),
    manifest: "manifest.json",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      // We disable versioned filenames here explicitly
      // so we can include the script when sidecar is running
      // for server-side frameworks
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
