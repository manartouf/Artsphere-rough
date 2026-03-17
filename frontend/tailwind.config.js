/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryPurple: '#6c3483',
        darkBG: '#1a1a2e',
      }
    },
  },
  plugins: [],
}