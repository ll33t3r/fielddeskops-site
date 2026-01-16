/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        industrial: {
          bg: "#1a1a1a",       // Dark Asphalt
          card: "#262626",     // Gunmetal
          border: "#404040",   // Dark Grey
          orange: "#FF6700",   // Safety Orange
          green: "#22c55e",    // Profit Green
          red: "#ef4444",      // Loss Red
        }
      },
      fontFamily: {
        oswald: ["var(--font-oswald)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};