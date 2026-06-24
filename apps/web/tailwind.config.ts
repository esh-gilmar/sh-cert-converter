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
        soft: '0 18px 50px rgba(0, 85, 43, 0.10)',
        'sh-card': '0 24px 70px rgba(0, 85, 43, 0.12)',
        'sh-soft': '0 12px 30px rgba(0, 85, 43, 0.10)',
        'sh-glow':
          '0 0 0 1px rgba(179, 217, 140, 0.35), 0 20px 50px rgba(0, 85, 43, 0.16)',
        'sh-inset': 'inset 0 1px 0 rgba(255, 255, 255, 0.72)'
      }
    }
  },
  plugins: []
} satisfies Config;
