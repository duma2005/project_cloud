import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0F19',
        card: '#121826',
        text: '#E6E8EF',
        muted: '#A3AAB8',
        accent: '#F5C518',
        border: 'rgba(255,255,255,0.08)'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.25)'
      }
    }
  },
  plugins: []
} satisfies Config;

