/** @type {import('tailwindcss').Config} */
const { platformSelect } = require("nativewind/theme");
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#0B78BC', // Default Tailwind color
        secondary: '#08A9E1', // Default Tailwind color
        terciary: '#4682B4', // Default Tailwind color
        megbgray: '#EBEBEB', // Default Tailwind color
        destructive: '#FF4500', // Default Tailwind color
        orange: '#EF7722', // Default Tailwind color
      },
    },
  },
  plugins: [],
};