import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': "'production'",
    'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version),
  },
  build: {
    outDir: resolve(__dirname, 'dist', 'overlay'),
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src', 'index.html'),
      },
      // We disable versioned filenames here explicitly
      // so we can include the script when sidecar is running
      // for server-side frameworks
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
