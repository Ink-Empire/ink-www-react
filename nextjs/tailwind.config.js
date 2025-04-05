/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#60A5FA',
        },
        secondary: {
          DEFAULT: '#10B981',
          dark: '#059669',
          light: '#34D399',
        },
        background: {
          light: '#F9FAFB',
          dark: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'tattoo': ['Tattoo-Font', 'Arial', 'cursive'],
      },
    },
  },
  plugins: [],
}