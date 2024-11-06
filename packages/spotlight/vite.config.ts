import { builtinModules } from 'node:module';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

import packageJson from './package.json';

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
});

export default defineConfig({
  build: {
    lib: {
      entry: {
        overlay: resolve(__dirname, 'src/overlay.ts'),
        sidecar: resolve(__dirname, 'src/sidecar.ts'),
        'vite-plugin': resolve(__dirname, 'src/vite-plugin.ts'),
      },
    },
    rollupOptions: {
      external: [...dependencies, ...builtinModules.map(x => `node:${x}`)],
    },
  },
});
