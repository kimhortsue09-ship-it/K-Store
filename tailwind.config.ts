import type { Config } from 'tailwindcss';

/**
 * Nova Kit — Tailwind configuration
 * Colours map to CSS variables defined in app/globals.css, so the whole theme (and the
 * dark/light toggle) is driven by tokens — change a variable, not a hundred classes.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        card: 'var(--card)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-contrast': 'var(--accent-contrast)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--info)',
      },
      fontFamily: { sans: 'var(--font)' },
      borderRadius: { sm: '8px', md: '12px', lg: '16px', xl: '22px', pill: '999px' },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.18)',
        pop: '0 12px 32px rgba(0,0,0,.34)',
      },
      maxWidth: { app: '520px' },
    },
  },
  plugins: [],
};

export default config;
