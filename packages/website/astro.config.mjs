import starlight from "@astrojs/starlight";
import vercel from "@astrojs/vercel";
import sentry from "@sentry/astro";
import sentryStarlightTheme, {
  monochromeCodeTheme,
} from "@sentry/starlight-theme";
import { defineConfig } from "astro/config";
import Inspect from "vite-plugin-inspect";
import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

// Website entry point: homepage remains custom Astro/Tailwind, while /docs is owned by
// Starlight plus the shared Sentry theme and project-specific docs metadata.
export default defineConfig({
  site: "https://spotlightjs.com",
  vite: {
    plugins: [
      Inspect({
        dev: true,
        build: true,
      }),
      tailwindcss(),
    ],
    build: {
      sourcemap: true,
    },
  },
  devOverlay: true,
  integrations: [
    sentry({
      clientInitPath: "sentry.client.config.mjs",
      debug: process.env.NODE_ENV === "development",
      sourceMapsUploadOptions: {
        project: "spotlight-website",
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
    starlight({
      title: "Spotlight",
      logo: {
        src: "./public/images/glyph.svg",
      },
      social: [
        { icon: "discord", label: "Discord", href: "https://discord.gg/EJjqM3XtXQ" },
        { icon: "github", label: "GitHub", href: "https://github.com/getsentry/spotlight" },
      ],
      plugins: [sentryStarlightTheme()],
      components: {
        ThemeProvider: "./src/components/ThemeProvider.astro",
      },

      head: [
        {
          tag: "meta",
          attrs: { property: "og:image", content: "/images/trace.png" },
        },
        {
          tag: "meta",
          attrs: { property: "twitter:image", content: "/images/trace.png" },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:description",
            content:
              "Spotlight is Sentry for Development. Inspired by an old project, Django Debug Toolbar, Spotlight brings a rich debug overlay into development environments, and it does it by leveraging the existing power of Sentry's SDKs.",
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "twitter:description",
            content:
              "Spotlight is Sentry for Development. Inspired by an old project, Django Debug Toolbar, Spotlight brings a rich debug overlay into development environments, and it does it by leveraging the existing power of Sentry's SDKs.",
          },
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          link: "/docs/getting-started/",
        },
        {
          label: "Quick Starts",
          items: [{ autogenerate: { directory: "docs/quickstart" } }],
        },
        {
          label: "CLI",
          items: [{ autogenerate: { directory: "docs/cli" } }],
        },
        {
          label: "MCP Server",
          items: [{ autogenerate: { directory: "docs/mcp" } }],
        },
        {
          label: "Desktop App",
          items: [{ autogenerate: { directory: "docs/desktop-app" } }],
        },
        {
          label: "Sidecar",
          items: [{ autogenerate: { directory: "docs/sidecar" } }],
        },
        {
          label: "SDK",
          items: [{ autogenerate: { directory: "docs/sdk" } }],
        },
        {
          label: "Contribute",
          items: [{ autogenerate: { directory: "docs/contribute" } }],
        },
        {
          label: "About",
          items: [
            {
              label: "What is Spotlight?",
              link: "/docs/about/",
            },
            {
              label: "Architecture",
              link: "/docs/architecture/",
            },
          ],
        },
        {
          label: "Reference",
          items: [{ autogenerate: { directory: "docs/reference" } }],
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/getsentry/spotlight/edit/main/packages/website/",
      },
      customCss: ["./src/tailwind.css"],
    }),
    react(),
  ],
  markdown: {
    shikiConfig: {
      theme: monochromeCodeTheme,
    },
  },
  output: "static",
  adapter: vercel(),
});
