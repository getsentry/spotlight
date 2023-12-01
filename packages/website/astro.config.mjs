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
    spotlight({
      debug: true,
    }),
    starlight({
      title: 'Spotlight',
      logo: {
        src: './public/images/glyph.svg',
      },
      social: {
        discord: 'https://discord.gg/sentry',
        github: 'https://github.com/getsentry/spotlight',
      },
      components: {
        Hero: './src/components/Hero.astro',
        Header: './src/components/Header.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
      },

      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: '/images/trace.png' },
        },
        {
          tag: 'meta',
          attrs: { property: 'twitter:image', content: '/images/trace.png' },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:description',
            content:
              "Spotlight is Sentry for Development. Inspired by an old project, Django Debug Toolbar, Spotlight brings a rich debug overlay into development environments, and it does it by leveraging the existing power of Sentry's SDKs.",
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'twitter:description',
            content:
              "Spotlight is Sentry for Development. Inspired by an old project, Django Debug Toolbar, Spotlight brings a rich debug overlay into development environments, and it does it by leveraging the existing power of Sentry's SDKs.",
          },
        },
      ],
      sidebar: [
        {
          label: 'About',
          items: [
            {
              label: 'What is Spotlight?',
              link: '/about/',
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
              label: 'Spotlight',
              link: '/setup/',
            },
            {
              label: 'with Sentry',
              link: '/setup/sentry/',
            },
            {
              label: 'for Astro',
              link: '/setup/astro/',
            },
            {
              label: 'for Remix',
              link: '/setup/remix/',
            },
            {
              label: 'for SvelteKit',
              link: '/setup/sveltekit/',
            },
          ],
        },
        {
          label: 'Sidecar',
          autogenerate: {
            directory: 'sidecar',
          },
        },
        {
          label: 'Integrations',
          autogenerate: {
            directory: 'integrations',
          },
        },
        {
          label: 'Contribute',
          autogenerate: {
            directory: 'contribute',
          },
        },
        {
          label: 'Reference',
          autogenerate: {
            directory: 'reference',
          },
        },
      ],
      expressiveCode: {
        themes: ['starlight-dark'],
        useStarlightUiThemeColors: true,
      },
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
