/** @type {import('tailwindcss').Config} */
const { platformSelect } = require("nativewind/theme");
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#0b1220',
        surface: '#101a2d',
        'surface-raised': '#16233a',
        header: '#15365f',
        primary: '#22b8f0',
        'primary-foreground': '#07111f',
        foreground: '#f7f8fa',
        muted: '#a8b3c7',
        success: '#2ed3a0',
        warning: '#ffbd66',
        destructive: '#f97066',
        secondary: '#08A9E1',
        terciary: '#4682B4',
        megbgray: '#EBEBEB',
        orange: '#EF7722',
      },
    },
  },
  plugins: [],
};
