import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: 'https://getsentry.github.io',
  base: '/spotlight',
  integrations: [
    starlight({
      title: "Spotlight",
      social: {
        github: "https://github.com/getsentry/spotlight",
      },
      sidebar: [
        {
          label: "Start here",
          items: [
            // Each item here is one entry in the navigation menu.
            {
              label: "What is Spotlight?",
              link: "/what-is-spotlight/",
            },
          ],
        },

        {
          label: "Setup",
          items: [
            {
              label: "for your custom project",
              link: "/setup/",
            },
            {
              label: "for Astro",
              link: "/setup/astro/",
            },
          ],
        },
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            {
              label: "Write a plugin",
              link: "/guides/plugin/",
            },
          ],
        },
        {
          label: "Reference",
          autogenerate: {
            directory: "reference",
          },
        },
      ],
      customCss: ["./src/tailwind.css"],
    }),
    tailwind({
      // Disable the default base styles:
      applyBaseStyles: false,
    }),
  ],
});
