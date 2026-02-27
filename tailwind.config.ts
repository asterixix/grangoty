import type { Config } from 'tailwindcss'

export default {
  content: {
    files: [
      './app/**/*.{vue,js,ts}',
      './app/components/**/*.{vue,js,ts}',
      './app/layouts/**/*.{vue,js,ts}',
      './app/pages/**/*.vue',
      './app/plugins/**/*.{js,ts}',
      './app/app.vue',
      './app/error.vue'
    ],
    transform: {
      vue: (content: string) => {
        return content
          .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '$1')
          .replace(/<template[^>]*>([\s\S]*?)<\/template>/gi, '$1')
      }
    }
  },
  safelist: [
    // Primary colors
    { pattern: /primary-(50|100|400|500|600|700|800|900)/ },
    // Accent colors
    { pattern: /accent-(400|500|600|700|800|900)/ },
    // Neutral colors
    { pattern: /neutral-(50|100|200|300|400|500|600|700|800|900)/ },
    // Semantic colors
    { pattern: /(success|warning|error|info)/ },
    // Deadline colors
    { pattern: /(deadline-hot|deadline-warm|deadline-normal)/ },
    // Hover states
    { pattern: /hover:(primary|accent|neutral|success|warning|error|info)-(50|100|400|500|600|700|800|900)/ },
    { pattern: /hover:(success|warning|error|info)/ },
    { pattern: /hover:bg-(primary|accent|neutral)-(50|100|400|500|600|700|800|900)/ },
    { pattern: /hover:text-(primary|accent|neutral)-(50|100|400|500|600|700|800|900)/ },
    // Dark mode
    { pattern: /dark:(primary|accent|neutral|success|warning|error|info)-(50|100|400|500|600|700|800|900)/ },
    { pattern: /dark:bg-(primary|accent|neutral)-(50|100|400|500|600|700|800|900)/ },
    { pattern: /dark:text-(primary|accent|neutral)-(50|100|400|500|600|700|800|900)/ },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Public Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      colors: {
        // Civic Teal - Primary brand color
        primary: {
          50: '#f0f9fb',
          100: '#d0eef4',
          400: '#3ba8c2',
          500: '#0F6E84',
          600: '#0a5569',
          700: '#084457',
          800: '#063545',
          900: '#042e3a',
        },
        // Warm Amber - Accent color for CTAs and urgency
        accent: {
          400: '#f0924a',
          500: '#E07B39',
          600: '#c4621f',
          700: '#a05119',
          800: '#804114',
          900: '#6b2e0a',
        },
        // Warm Gray - Neutral colors
        neutral: {
          50: '#fafaf8',
          100: '#f3f3f0',
          200: '#e5e4e0',
          300: '#d1d0cc',
          400: '#b5b4b0',
          500: '#737370',
          600: '#605f5d',
          700: '#464644',
          800: '#363634',
          900: '#1a1a18',
        },
        // Semantic colors
        success: '#1a7a4a',
        warning: '#92610a',
        error: '#c0392b',
        info: '#1a4e8c',
        // Deadline urgency tiers
        'deadline-hot': '#c0392b',
        'deadline-warm': '#92610a',
        'deadline-normal': '#1a7a4a',
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      spacing: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
        'full': '9999px',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
} satisfies Config