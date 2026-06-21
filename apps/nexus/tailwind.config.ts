import type { Config } from 'tailwindcss';

// Design system do Nexus (tema dark). Cores e fontes vêm do briefing §7.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Fundo base e elevações
        base: '#060A15',
        surface: '#0B1120',
        elevated: '#111A2E',
        border: '#1E293B',
        // Texto
        ink: '#E6EDF7',
        muted: '#8A99B0',
        // Marca / semânticas
        brand: '#4169E1', // azul royal
        gold: '#C8922A',
        success: '#10B981',
        danger: '#E5534B',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};

export default config;
