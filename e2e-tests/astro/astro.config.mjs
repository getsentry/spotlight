import { defineConfig } from 'astro/config';

import sentry from '@sentry/astro';
import spotlightjs from '@spotlightjs/astro';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  integrations: [sentry(), spotlightjs()],
  adapter: node({ mode: 'standalone' }),
  output: 'server',
});
