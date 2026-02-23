/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: {DEFAULT: '#16213E', light: '#1a2744'},
        orange: {DEFAULT: '#FF6B35', light: '#FF8A5C', pale: '#FFF3ED'},
        cream: '#FAFAF7',
        dark: '#1A1A2E',
        body: '#4A4A5A',
        muted: '#8E8E9A',
        border: '#EBEBEF',
        success: {DEFAULT: '#34C759', pale: '#E8F9ED'},
        danger: {DEFAULT: '#FF3B30', pale: '#FFEDED'},
        warning: {DEFAULT: '#FFCC00', pale: '#FFF9E0'},
      },
      borderRadius: {
        card: '16px',
        button: '14px',
        input: '14px',
        pill: '20px',
      },
    },
  },
  plugins: [],
};
