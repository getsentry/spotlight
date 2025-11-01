import type { Config } from "tailwindcss";

import colors from "tailwindcss/colors";
import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        raleway: ["Raleway", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        primary: colors.indigo,
      },
      gridTemplateColumns: {
        "2-auto": "minmax(auto, max-content) 1fr",
      },
    },
  },
} satisfies Config;
