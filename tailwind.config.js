/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1a1a1a',
        'primary-hover': '#000000',
        'background-light': '#ffffff',
        'background-alt': '#f7f7f7',
        'background-subtle': '#f7f7f7',
        'background-dark': '#191919',
        'gray-light': '#f2f2f2',
        'text-main': '#1a1a1a',
        'text-muted': '#6b7280',
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
        'sans': ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'DEFAULT': '0.375rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        'full': '9999px'
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}

