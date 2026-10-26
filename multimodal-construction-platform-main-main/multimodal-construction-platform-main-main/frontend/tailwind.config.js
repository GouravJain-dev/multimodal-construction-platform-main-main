/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#070b14',
        surface: '#0d1424',
        card: '#101c33',
        cardBorder: '#1e3050',
        muted: '#94a3b8',
        accentCyan: '#0ea5e9',
        accentBlue: '#0284c7',
        accentGlow: '#38bdf8',
        accentYellow: '#0ea5e9', // updated theme alias
      },
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
