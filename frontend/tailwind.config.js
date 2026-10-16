/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-Contrast Bold Scheme (Dashboard)
        void: "#05050A",     // True dark background
        plasma: "#00E5FF",   // Bold Electric Cyan accent
        ghost: "#FFFFFF",    // Pure white text
        graphite: "#12121A", // Solid card surfaces
        alert: {
          red: "#FF3B30",
          orange: "#FF9500",
          yellow: "#FFCC00",
          green: "#34C759",
        },
        // Landing Page Colors
        background: "#F0EFF4",  // Light background
        primary: "#F0EFF4",     // Primary light
        dark: "#18181B",        // Dark text
        textDark: "#18181B",    // Dark text alias
        accent: "#FF6B35",      // Orange accent
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        drama: ['"Instrument Serif"', 'serif'],
        mono: ['"Fira Code"', 'monospace'],
        sans: ['Sora', 'sans-serif'],
        heading: ['Sora', 'sans-serif'],
        data: ['"Fira Code"', 'monospace'],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '3rem',
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(0, 229, 255, 0.4)',
        'float': '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
      }
    },
  },
  plugins: [],
}
