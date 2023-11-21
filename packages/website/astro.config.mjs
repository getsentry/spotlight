import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import vercelStatic from '@astrojs/vercel/static';
import sentry from '@sentry/astro';
import spotlight from '@spotlightjs/astro';
import { defineConfig } from 'astro/config';
import Inspect from 'vite-plugin-inspect';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://spotlightjs.com',
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
      components: {
        Hero: './src/components/Hero.astro',
        Header: './src/components/Header.astro',
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
      customCss: ['./src/tailwind.css', './src/theme.css'],
    }),
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
  ],
  output: 'static',
  adapter: vercelStatic(),
});
