import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.{vue,js,ts}',
    './app/pages/**/*.vue',
    './app/plugins/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue'
  ],
  safelist: [
    { pattern: /primary-(50|100|400|500|600|700|800|900)/ },
    { pattern: /accent-(400|500|600|700|800|900)/ },
    { pattern: /neutral-(50|100|200|300|400|500|600|700|800|900)/ },
    { pattern: /(success|warning|error|info)/ },
    { pattern: /hn-(orange|orange-dark|beige|gray|gray-dark)/ },
    { pattern: /(deadline-hot|deadline-warm|deadline-normal)/ },
    { pattern: /hover:(primary|accent|neutral|success|warning|error|info)-(50|100|400|500|600|700|800|900)/ },
    { pattern: /hover:(success|warning|error|info)/ },
    { pattern: /hover:bg-(primary|accent|neutral)-(50|100|400|500|600|700|800|900)/ },
    { pattern: /hover:text-(primary|accent|neutral)-(50|100|400|500|600|700|800|900)/ },
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
        accent: {
          400: '#f0924a',
          500: '#E07B39',
          600: '#c4621f',
          700: '#a05119',
          800: '#804114',
          900: '#6b2e0a',
        },
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
        hn: {
          orange: '#ff6600',
          'orange-dark': '#e65c00',
          beige: '#f6f6ef',
          gray: '#e5e5e5',
          'gray-dark': '#828282',
        },
        success: '#1a7a4a',
        warning: '#92610a',
        error: '#c0392b',
        info: '#1a4e8c',
        'deadline-hot': '#c0392b',
        'deadline-warm': '#92610a',
        'deadline-normal': '#1a7a4a',
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
} satisfies Config
