/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f4f6f9",
        panel: "#ffffff",
        panel2: "#f1f4f8",
        border: "#e2e8f0",
        accent: "#16a34a",
        accent2: "#2563eb",
        sidebar: "#0f172a",
        sidebar2: "#1e293b",
      },
    },
  },
  plugins: [],
};
