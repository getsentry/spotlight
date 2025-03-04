import spotlightSidecar from '@spotlightjs/sidecar/vite-plugin';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';

import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    spotlightSidecar(),
    react(),
    dts({
      insertTypesEntry: true,
    }),
    svgr({
      svgrOptions: {
        titleProp: true,
      },
    }),
  ],
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version),
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
  server: {
    headers: {
      'Document-Policy': 'js-profiling',
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist', 'overlay'),
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
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
