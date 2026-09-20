/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        sunk: 'var(--paper-sunk)',
        ink: 'var(--ink)',
        body: 'var(--ink-body)',
        muted: 'var(--ink-muted)',
        rule: 'var(--rule)',
        accent: 'var(--accent)',
        signal: 'var(--signal)'
      },
      fontFamily: {
        sans: ['Archivo', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Source Serif 4', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      fontSize: {
        // Typografische Skala, Faktor 1,28 — keine Zwischenwerte.
        xs: ['12px', '1.4'],
        sm: ['14px', '1.5'],
        base: ['16px', '1.62'],
        lg: ['20px', '1.4'],
        xl: ['26px', '1.15'],
        '2xl': ['33px', '1.1'],
        '3xl': ['42px', '1.05'],
        '4xl': ['54px', '1']
      },
      borderRadius: { DEFAULT: '2px', none: '0', sm: '2px' },
      spacing: { safe: 'env(safe-area-inset-bottom)' }
    }
  },
  plugins: []
}
