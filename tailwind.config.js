/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faf8f0',
          100: '#f5ecd1',
          200: '#ebdca3',
          300: '#dec26b',
          400: '#d4ac3f',
          500: '#D4AF37', // Techveons Gold
          600: '#b78d2a',
          700: '#926a21',
          800: '#72511c',
          900: '#5e4219',
          950: '#33210b',
        },
        dark: {
          bg: '#000000', // Pitch Black
          card: '#0B0B0C', // Near-Black
          border: '#1E1E1E', // Very dark gray
          surface: '#121213', // Slightly lighter near-black
        }
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.3), 0 0 10px rgba(212, 175, 55, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.6), 0 0 30px rgba(212, 175, 55, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
