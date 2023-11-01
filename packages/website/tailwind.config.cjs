/** @type {import('tailwindcss').Config} */

const starlightPlugin = require("@astrojs/starlight-tailwind");

module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      animation: {
        fadeIn: "0.5s fadeIn forwards",
        fadeOut: "0.5s fadeOut forwards",
      },

      // that is actual animation
      keyframes: (theme) => ({
        fadeIn: {
          "0%": { opacity: 0, transform: "translate(-20px, 0)" },
          "100%": { opacity: 1, transform: "translate(0, 0)" },
        },
        fadeOut: {
          "0%": { opacity: 1, transform: "translate(0, 0)" },
          "100%": { opacity: 0, transform: "translate(-20px, 0)" },
        },
      }),
    },
  },
  plugins: [starlightPlugin(), require("@tailwindcss/typography")],
};
