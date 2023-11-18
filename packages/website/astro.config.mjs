import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import sentry from '@sentry/astro';
import spotlight from '@spotlightjs/astro';
import { defineConfig } from 'astro/config';
import Inspect from 'vite-plugin-inspect';

import vercel from '@astrojs/vercel/serverless';

// https://astro.build/config
export default defineConfig({
  site: 'https://getsentry.github.io',
  base: '/spotlight',
  vite: {
    plugins: [
      Inspect({
        dev: true,
        build: true,
      }),
    ],
    build: {
      sourcemap: true,
    },
  },
  experimental: {
    devOverlay: true,
  },
  integrations: [
    sentry({
      debug: true,
    }),
    spotlight(),
    starlight({
      title: 'Spotlight',
      social: {
        github: 'https://github.com/getsentry/spotlight',
      },
      sidebar: [
        {
          label: 'Start here',
          items: [
            {
              label: 'What is Spotlight?',
              link: '/what-is-spotlight/',
            },
            {
              label: 'Architecture',
              link: '/architecture/',
            },
          ],
        },
        {
          label: 'Setup',
          items: [
            {
              label: 'for Astro',
              link: '/setup/astro/',
            },
            {
              label: 'for your project',
              link: '/setup/',
            },
          ],
        },
        {
          label: 'Guides',
          items: [
            {
              label: 'Write an integration',
              link: '/guides/integration/',
            },
          ],
        },
        {
          label: 'Integrations',
          autogenerate: {
            directory: 'integrations',
          },
        },
        {
          label: 'Reference',
          autogenerate: {
            directory: 'reference',
          },
        },
      ],
      customCss: ['./src/tailwind.css'],
    }),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  output: 'server',
  adapter: vercel(),
});
