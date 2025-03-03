import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import vercelStatic from '@astrojs/vercel/static';
import sentry from '@sentry/astro';
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
      clientInitPath: 'sentry.client.config.mjs',
      debug: process.env.NODE_ENV === 'development',
      sourceMapsUploadOptions: {
        project: 'spotlight-website',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
    starlight({
      title: 'Spotlight',
      logo: {
        src: './public/images/glyph.svg',
      },
      social: {
        discord: 'https://discord.gg/EJjqM3XtXQ',
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
              label: 'For Astro',
              link: '/setup/astro/',
            },
            {
              label: 'For Next.js',
              link: '/setup/nextjs/',
            },
            {
              label: 'For Remix',
              link: '/setup/remix/',
            },
            {
              label: 'For SvelteKit',
              link: '/setup/sveltekit/',
            },
            {
              label: 'For Vite',
              link: '/setup/vite/',
            },
            {
              label: 'Just HTML',
              link: '/setup/html/',
            },
            {
              label: 'For Other Frameworks',
              link: '/setup/other/',
            },
            {
              label: 'Migration Guide',
              link: '/setup/migration/',
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
