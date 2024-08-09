import { builtinModules } from 'node:module';
import { defineConfig } from 'vite';

import packageJson from './package.json';

const dependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
});

export default defineConfig({
  build: {
    ssr: './src/main.ts',
    outDir: './dist',
    sourcemap: true,
    rollupOptions: {
      external: [...dependencies, ...builtinModules.map(x => `node:${x}`)],
    },
  },
});
