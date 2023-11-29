import { resolve } from 'path';
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
      },
      // the proper extensions will be added
      //   fileName: 'sentry-spotlight',
    },
    rollupOptions: {
      external: dependencies,
    },
  },
});
