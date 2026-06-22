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
        sidebar: "#070809",
        sidebar2: "#11141a",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(34,197,94,0.12), 0 12px 40px -8px rgba(34,197,94,0.22)",
        "glow-blue": "0 0 0 1px rgba(59,130,246,0.14), 0 12px 40px -8px rgba(59,130,246,0.25)",
        "glow-lg": "0 0 0 1px rgba(34,197,94,0.15), 0 24px 60px -12px rgba(34,197,94,0.3)",
      },
      keyframes: {
        blobFloat: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(4%, 6%) scale(1.08)" },
          "66%": { transform: "translate(-3%, -4%) scale(0.95)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        blob: "blobFloat 22s ease-in-out infinite",
        "blob-slow": "blobFloat 30s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
