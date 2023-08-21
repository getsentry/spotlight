/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  // only exists for demo
  plugins: [require("@tailwindcss/forms")],
  // corePlugins: {
  //   preflight: false,
  // },
  // prefix: "sentry-spotlight-",
};
