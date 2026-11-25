import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{astro,html,ts,tsx,js,jsx,md,mdx}'],
  theme: {
    extend: {
      // border-white/12 and similar hairlines are used across pages.
      opacity: { 6: '0.06', 12: '0.12', 22: '0.22', 72: '0.72' },
      colors: {
        brand: {
          DEFAULT: '#BA2D20',
          dark: '#8F1F15',
        },
        ink: {
          0: '#FFFFFF',
          100: '#F7F7F5',
          200: '#E8E8E4',
          300: '#C7C7C0',
          600: '#494949',
          800: '#252E39',
          900: '#1A1F26',
          950: '#12161C',
        },
        // Warm limestone — premium architectural neutral. Used for trust-building
        // sections where pure white feels clinical and ink-100 too generic.
        stone: {
          50:  '#F7F2E9',
          100: '#ECE5D9',
          200: '#DCD2C0',
          300: '#C2B59C',
          600: '#6B6450',
        },
        // Cream-rosy palette — limestone tinted with trace brand red (~5% mix).
        // Premium "blueprint paper" tone unifying every section. Nothing pure
        // black, nothing pure white — single drafting-sheet ambience.
        cream: {
          50:  '#FAF3EA',
          100: '#F2E8DC',
          200: '#E7D7C5',
          300: '#D2BCA4',
          600: '#7A6B5C',
        },
      },
      fontFamily: {
        // Original АРТСТРОЙ pair (artstroismolian.com): Poiret One for
        // headings, Didact Gothic for body/UI. Both are 400-only.
        display: ['"Poiret One"', '"Century Gothic"', 'Futura', '"Avenir Next"', 'sans-serif'],
        sans: ['"Didact Gothic"', '"Century Gothic"', '"Avenir Next"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fluid display sizes via clamp(min, preferred, max)
        'display-sm': ['clamp(1.75rem, 1.5rem + 1.25vw, 2.25rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(2.25rem, 1.75rem + 2.5vw, 3.5rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
        'display-lg': ['clamp(2.75rem, 2rem + 3.75vw, 4.5rem)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        'display-xl': ['clamp(3rem, 2rem + 5vw, 5.75rem)', { lineHeight: '1', letterSpacing: '-0.025em' }],
        'display-2xl': ['clamp(3rem, 2rem + 6.25vw, 7rem)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        eyebrow: '0.2em',
      },
      boxShadow: {
        lift: '0 24px 48px -12px rgb(0 0 0 / 0.18), 0 0 0 1px rgb(0 0 0 / 0.04)',
        card: '0 8px 24px -8px rgb(0 0 0 / 0.12)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1100': '1100ms',
        '4000': '4000ms',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        'marquee-slow': 'marquee 60s linear infinite',
        'fade-up': 'fade-up 800ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
      maxWidth: {
        '8xl': '90rem',
        '9xl': '120rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
