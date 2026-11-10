import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0B1F3A', 700: '#13305A', 500: '#1F4A85', 100: '#E3EAF4' },
        sakura: { DEFAULT: '#BC002D', 700: '#97002A' }, // Japanese red accent
        surface: '#F4F5F7',
        ok: '#15803D',
        warn: '#B45309',
        danger: '#B91C1C',
      },
      fontFamily: {
        sans: ['system-ui', 'Segoe UI', 'Hiragino Sans', 'Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
