/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f1115",
        card: "#171a21",
        border: "#262b36",
        muted: "#9aa3b2",
        accent: "#6ea8fe",
        accent2: "#7ee0b5",
      },
    },
  },
  plugins: [],
};
