/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d12",
        panel: "#13161d",
        panel2: "#191c25",
        border: "#262b36",
        accent: "#22c55e",
        accent2: "#3b82f6",
      },
    },
  },
  plugins: [],
};
