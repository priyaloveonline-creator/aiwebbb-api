/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0edff',
          100: '#e0d9ff',
          400: '#9b87f5',
          500: '#6c47ff',
          600: '#5a38e8',
          700: '#4a2fcf',
        },
      },
      animation: {
        'fade-in':   'fadeIn 0.15s ease',
        'slide-up':  'slideUp 0.2s ease',
        'blink':     'blink 1s step-end infinite',
        'dot':       'dot 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(6px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        blink:   { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
        dot:     { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
};
