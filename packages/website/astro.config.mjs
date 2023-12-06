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
  devOverlay: true,
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
        discord: 'https://discord.com/channels/621778831602221064/1176977569678114847',
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
            {
              label: 'Roadmap',
              link: '/roadmap/',
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
              label: 'for Astro',
              link: '/setup/astro/',
            },
            {
              label: 'for Other Frameworks',
              link: '/setup/other/',
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
      editLink: {
        baseUrl: 'https://github.com/getsentry/spotlight/edit/main/packages/website/',
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
