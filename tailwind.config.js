const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        raleway: ["Raleway", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  // only exists for demo
  plugins: [require("@tailwindcss/forms")],
  // corePlugins: {
  //   preflight: false,
  // },
  // prefix: "sentry-spotlight-",
};
