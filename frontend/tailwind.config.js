/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        coral: '#FF6B6B',
        sage: '#87C38F',
        sunshine: '#F9C74F',
        warmPaper: '#FFFCF5',
        textPrimary: '#2D3436',
        textSecondary: '#636E72',
        textMuted: '#B2BEC3',
      },
      fontFamily: {
        fraunces: ['Fraunces', 'serif'],
        nunito: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};