/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: 'var(--background)',
        surface: 'var(--surface)',
        // Text
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        // Accent (Gold)
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          dark: 'var(--accent-dark)',
        },
        // Primary (alias for accent)
        primary: {
          DEFAULT: 'var(--primary)',
          light: 'var(--primary-light)',
          dark: 'var(--primary-dark)',
        },
        // Secondary
        secondary: {
          DEFAULT: 'var(--secondary)',
          light: 'var(--secondary-light)',
          dark: 'var(--secondary-dark)',
        },
        // Status colors
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',
        info: 'var(--info)',
        // Borders
        border: {
          DEFAULT: 'var(--border)',
          light: 'var(--border-light)',
        },
        // Semantic
        available: 'var(--available)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        'tattoo': ['Tattoo-Font', 'Arial', 'cursive'],
      },
    },
  },
  plugins: [],
}