import react from '@vitejs/plugin-react';
import MagicString from 'magic-string';
import { sep } from 'node:path';
import { resolve } from 'path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';

const removeReactDevToolsMessagePlugin: () => Plugin = () => ({
  name: 'remove-react-devtools-message',
  transform(code, id) {
    if (id.includes(`${sep}react-dom${sep}`) && code.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
      const ms = new MagicString(code);
      ms.replaceAll('__REACT_DEVTOOLS_GLOBAL_HOOK__', '({ isDisabled: true })');
      const map = ms.generateMap({ hires: true });
      console.log(map);
      return {
        code: ms.toString(),
        map,
      };
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
    svgr(),
    removeReactDevToolsMessagePlugin(),
  ],
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'sentry-spotlight',
      // the proper extensions will be added
      fileName: 'sentry-spotlight',
    },
    sourcemap: true,
  },
});
