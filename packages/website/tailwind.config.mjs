import starlightPlugin from '@astrojs/starlight-tailwind';
import typographyPlugin from '@tailwindcss/typography';
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        raleway: ['Raleway', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        fadeIn: '0.5s fadeIn forwards',
        fadeOut: '0.5s fadeOut forwards',
      },

      // that is actual animation
      keyframes: () => ({
        fadeIn: {
          '0%': { opacity: 0, transform: 'translate(-20px, 0)' },
          '100%': { opacity: 1, transform: 'translate(0, 0)' },
        },
        fadeOut: {
          '0%': { opacity: 1, transform: 'translate(0, 0)' },
          '100%': { opacity: 0, transform: 'translate(-20px, 0)' },
        },
      }),
    },
  },
  plugins: [starlightPlugin(), typographyPlugin()],
};
