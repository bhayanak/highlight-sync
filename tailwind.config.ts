/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        highlight: {
          yellow: '#fef08a',
          green: '#bbf7d0',
          blue: '#bfdbfe',
          pink: '#fbcfe8',
          purple: '#ddd6fe',
        },
      },
    },
  },
  plugins: [],
};
