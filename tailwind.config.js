/** @type {import('tailwindcss').Config} */
const { platformSelect } = require("nativewind/theme");
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#0B78BC', // Default Tailwind color
        secundary: '#08A9E1', // Default Tailwind color
        terciary: '#FFA836', // Default Tailwind color
        'megb-gray': '#EBEBEB', // Default Tailwind color
      },
    },
  },
  plugins: [],
};