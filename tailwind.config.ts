import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#14161b',
        paper: '#f7f5f0',
        faint: '#8a8780',
        rule: '#d9d5cc',
      },
    },
  },
  plugins: [],
};

export default config;
