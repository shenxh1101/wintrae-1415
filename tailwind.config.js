/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#eef2f8',
          100: '#d4dee9',
          200: '#a9bcd4',
          300: '#7d9bbf',
          400: '#5279aa',
          500: '#1e3a5f',
          600: '#1a3251',
          700: '#152a43',
          800: '#102235',
          900: '#0b1a27',
        },
        accent: {
          50: '#fbf6eb',
          100: '#f3e7c8',
          200: '#e6cf92',
          300: '#dab75b',
          400: '#d4a853',
          500: '#c8993e',
          600: '#a67e32',
          700: '#846327',
          800: '#62481b',
          900: '#402e10',
        },
      },
      fontFamily: {
        sans: ['"Source Han Sans SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 4px 24px -8px rgba(30, 58, 95, 0.15)',
        'card-hover': '0 8px 32px -8px rgba(30, 58, 95, 0.25)',
      },
    },
  },
  plugins: [],
};
