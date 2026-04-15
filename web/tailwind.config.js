/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        anansi: {
          black: "#0A0A0A",
          deep: "#060606",
          red: "#7A0F14",
          "red-light": "#9A1A20",
          white: "#F8F8F5",
          gray: "#6B6B6B",
          "gray-dark": "#333333",
          line: "#1A1A1A",
          "line-light": "#E2E2E2",
          // Legacy (keep for /caribcoin page)
          cream: "#FAFAF5",
          light: "#F5F5F0",
          border: "#E6E6E6",
        },
      },
      fontFamily: {
        /* FONT SWAP — change 'Syne' to 'Clash Display', 'General Sans', or 'Satoshi' */
        display: ["Clash Display", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
