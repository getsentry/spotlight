import node from '@astrojs/node';
import react from '@astrojs/react';
import sentry from '@sentry/astro';
import spotlight from '@spotlightjs/astro';
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  vite: {
    build: {
      sourcemap: true,
    },
    server: {},
    plugins: [],
  },
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    svelte({ include: ['**/svelte/*'] }),
    react({ include: ['**/react/*'] }),
    sentry({
      debug: true,
    }),
    spotlight({ debug: true }),
  ],
});
