/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        customBlue: '#264653', // Add your custom color code here
        customGreen: '#2a9d8f', // Another example color
        customRed: '#e76f51',
        customOrange: '#f4a261',
      },
    },
  },
  plugins: [],
}