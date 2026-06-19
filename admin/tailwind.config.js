/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── HAIQ Palette ──────────────────────────────────────────────────────
        'haiq-amber':  '#B8752A',
        'haiq-tan':    '#D4A574',
        'haiq-cream':  '#F2EAD8',
        'haiq-gold':   '#E8C88A',
        'haiq-mocha':  '#8C7355',
        'haiq-sienna': '#7A3B1E',

        // ── Admin semantic tokens ─────────────────────────────────────────────
        gold:        '#B8752A',   // primary amber — used for active nav, buttons
        'gold-light': '#E8C88A',  // light gold — loyalty highlights
        ink:         '#1A0A00',   // darkest background
        surface:     '#2A1200',   // card/panel background
        panel:       '#0E0600',   // sidebar background
        border:      '#3D2000',   // border color
        muted:       '#8C7355',   // subdued text
        sienna:      '#7A3B1E',   // deep accent

        // ── Aliases used throughout the UI (previously undefined → unstyled) ──
        primary:     '#B8752A',   // amber — buttons, links, active state
        secondary:   '#D4A574',   // tan — hover / secondary accent
        accent:      '#E8C88A',   // gold — headings & highlights
        dark:        '#1A0A00',   // dark surface / button text on gold
        light:       '#F2EAD8',   // cream — primary text
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
