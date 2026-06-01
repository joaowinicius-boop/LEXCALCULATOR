/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // LexHub design system
        background: 'hsl(220 20% 7%)',
        foreground: 'hsl(220 10% 94%)',
        primary: {
          DEFAULT: 'hsl(199 89% 48%)',
          foreground: '#fff',
        },
        card:      'hsl(220 20% 10%)',
        secondary: 'hsl(220 20% 14%)',
        muted:     'hsl(220 20% 14%)',
        'muted-fg':'hsl(220 10% 50%)',
        border:    'hsl(220 20% 18%)',
        sidebar:   'hsl(220 20% 5%)',
        destructive: 'hsl(0 62% 50%)',
        // Semantic
        success: 'hsl(150 86% 65%)',
        warning: 'hsl(46 87% 65%)',
        info:    'hsl(216 87% 65%)',
        // Orange accent (badge secondary)
        orange: 'rgb(249,115,22)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        md: '10px',
        lg: '12px',
      },
      boxShadow: {
        card: '0 1px 3px 0 hsl(0 0% 0% / .3), 0 1px 2px -1px hsl(0 0% 0% / .3)',
        elevated: '0 10px 15px -3px hsl(0 0% 0% / .4), 0 4px 6px -4px hsl(0 0% 0% / .4)',
        login: '0 25px 50px -12px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
