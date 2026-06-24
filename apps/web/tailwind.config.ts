import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sh: {
          green: '#00552B',
          orange: '#E67817',
          teal: '#43948C',
          light: '#B3D98C',
          blue: '#0050A3',
          background: '#F7FAF8'
        }
      },
      fontFamily: {
        sans: ['Dax Medium', 'Inter', 'Segoe UI', 'Arial', 'sans-serif']
      },
      boxShadow: {
        soft: '0 18px 50px rgba(0, 85, 43, 0.10)'
      }
    }
  },
  plugins: []
} satisfies Config;
