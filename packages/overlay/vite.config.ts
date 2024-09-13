import react from '@vitejs/plugin-react';
import MagicString from 'magic-string';
import { resolve, sep } from 'node:path';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';

const removeReactDevToolsMessagePlugin: () => PluginOption = () => ({
  name: 'remove-react-devtools-message',
  transform(code, id) {
    if (id.includes(`${sep}react-dom${sep}`) && code.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')) {
      const ms = new MagicString(code);
      ms.replaceAll('__REACT_DEVTOOLS_GLOBAL_HOOK__', '({ isDisabled: true })');
      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: true }),
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
    svgr({
      svgrOptions: {
        titleProp: true,
      },
    }),
    removeReactDevToolsMessagePlugin(),
  ],
  define: {
    'process.env.NODE_ENV': "'production'",
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'Spotlight',
      // the proper extensions will be added
      fileName: 'sentry-spotlight',
      formats: ['es', 'iife'],
    },
    rollupOptions: {
      treeshake: 'smallest',
      output: {
        footer: '(function(S){S && S.init({integrations: [S.sentry(), S.console()]})}(window.Spotlight))',
      },
    },
    sourcemap: true,
  },
});
