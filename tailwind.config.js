/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#C9A84C',
        'gold-light': '#E8C96A',
        'gold-dim': '#5A4820',
        base: '#0B0D14',
        surface: '#12151F',
        elevated: '#1A1E2E',
        hover: '#222640',
        border: '#1E2337',
        'border-light': '#2A3050',
        'text-muted': '#6B7080',
        'text-dim': '#3D4257',
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'count-up': 'countUp 0.5s ease forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        countUp: {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
