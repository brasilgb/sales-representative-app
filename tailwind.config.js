/** @type {import('tailwindcss').Config} */
const { platformSelect } = require("nativewind/theme");
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-raised': '#F1F5F9',
        header: '#166534',
        primary: '#166534',
        'primary-foreground': '#FFFFFF',
        foreground: '#0F172A',
        muted: '#64748B',
        'brand-accent': '#22C55E',
        'brand-dark': '#14532D',
        'brand-soft': '#F0FDF4',
        success: '#16A34A',
        warning: '#B45309',
        destructive: '#DC2626',
        secondary: '#15803D',
        terciary: '#14532D',
        megbgray: '#EBEBEB',
        orange: '#15803D',
      },
    },
  },
  plugins: [],
};
