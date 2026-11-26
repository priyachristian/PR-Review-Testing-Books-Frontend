/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './src/**/*.{html,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary-500)',
          light: 'var(--primary-500)',
        },
        heading: {
          DEFAULT: 'var(--heading)',
        },
        text: {
          primary: 'rgba(0, 0, 0, 0.85)',
          secondary: 'rgba(0, 0, 0, 0.45)',
        },
        border: {
          light: 'rgba(0, 0, 0, 0.15)',
          primary: '#ff944d',
        },
        background: '#ffffff',
        'muted-foreground': 'rgba(0, 0, 0, 0.45)',
      },
      fontFamily: {
        sans: [
          '"Instrument Sans"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        'instrument-sans': ['"Instrument Sans"', 'sans-serif'],
        inter: ['"Instrument Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.no-scrollbar::-webkit-scrollbar': {
          display: 'none',
        },
        '.no-scrollbar': {
          scrollbarWidth: 'none',
        },
      });
    },
  ],
};
