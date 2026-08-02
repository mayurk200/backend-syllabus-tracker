/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1d1f20',
        bg: '#f2f2f3',
        surface: '#e9e9ea',
        accent: '#5980a6',
        'accent-600': '#597ea3',
        'accent-700': '#416180',
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
        body: ['Barlow', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
