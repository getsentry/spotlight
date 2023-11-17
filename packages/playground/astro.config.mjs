import node from '@astrojs/node';
import react from '@astrojs/react';
import sentry from '@sentry/astro';
import spotlight from '@spotlightjs/astro';
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  experimental: {
    devOverlay: true,
  },
  vite: {
    build: {
      sourcemap: true,
    },
    server: {},
    plugins: [
      {
        id: 'test-plugin',
        transform(code, id) {
          //   if (code.includes("error")) {
          //     console.log("----------");
          //     console.log(code);
          //   }
          return code;
        },
        configureServer(server) {
          server.middlewares.use((err, req, res, next) => {
            console.log('----------');
            console.log({
              err,
            });
            next();
          });
        },
      },
    ],
  },
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    svelte(),
    react({ include: ['**/react/*'] }),
    sentry({
      debug: true,
    }),
    spotlight(),
  ],
});
