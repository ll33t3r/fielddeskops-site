/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'industrial': {
          'bg': '#1a1a1a',
          'surface': '#262626',
          'primary': '#FF6700',
          'text-heading': '#FFFFFF',
          'text-body': '#A3A3A3',
          'border': '#404040',
        }
      }
    },
  },
  plugins: [],
}