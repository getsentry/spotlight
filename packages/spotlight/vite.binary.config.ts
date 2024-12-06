import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: true,
    emptyOutDir: false,
    reportCompressedSize: false,
    lib: {
      entry: {
        spotlight: resolve(__dirname, 'bin/run.js'),
      },
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['node:sea', ...builtinModules, ...builtinModules.map(x => `node:${x}`)],
    },
  },
});
