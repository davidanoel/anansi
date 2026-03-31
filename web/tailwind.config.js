/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        anansi: {
          black: '#0E0E0E',
          red: '#7A0F14',
          cream: '#FAFAF5',
          gray: '#6B6B6B',
          light: '#F5F5F0',
          border: '#E6E6E6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
