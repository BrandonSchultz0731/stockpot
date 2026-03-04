const colors = require('./theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
    './navigation/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      borderRadius: {
        card: '20px',
        button: '50px',
        input: '14px',
        pill: '50px',
      },
      fontFamily: {
        serif: ['Fraunces-Bold'],
        'serif-heavy': ['Fraunces-ExtraBold'],
        sans: ['PlusJakartaSans-Regular'],
        'sans-medium': ['PlusJakartaSans-Medium'],
        'sans-semibold': ['PlusJakartaSans-SemiBold'],
        'sans-bold': ['PlusJakartaSans-Bold'],
      },
    },
  },
  plugins: [],
};
