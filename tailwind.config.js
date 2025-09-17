/** @type {import('tailwindcss').Config} */
const { platformSelect } = require("nativewind/theme");
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        error: platformSelect({
          ios: "red",
          android: "blue",
          default: "green",
        }),
      },
    },
  },
  plugins: [],
};