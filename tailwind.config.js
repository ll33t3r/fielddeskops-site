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
        // Mapped to CSS Variables for Auto-Switching
        background: "var(--bg-main)", 
        foreground: "var(--text-main)",
        
        industrial: {
          bg: "var(--bg-main)",        // Dynamic: Black -> Silver
          card: "var(--glass-bg)",     // Dynamic: Dark Glass -> Frosted Ice
          border: "var(--glass-border)",// Dynamic: Faint -> Icy Edge
          text: "var(--text-main)",    // Dynamic: White -> Gunmetal
          muted: "var(--text-muted)",  // Dynamic: Gray -> Dark Gray
          
          // Constants (These stay the same in both modes)
          orange: "var(--color-primary)", // #FF6700
          green: "#22c55e",
          red: "#ef4444",
        }
      },
      fontFamily: {
        oswald: ["Oswald", "sans-serif"], // Direct font name fallback
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};