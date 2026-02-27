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
  theme: {
    extend: {
      fontFamily: {
        sans: ['Verdana', 'Geneva', 'sans-serif'],
        mono: ['Monaco', 'Consolas', 'monospace']
      },
      colors: {
        // Hacker News inspired colors
        'hn': {
          'orange': '#ff6600',
          'orange-dark': '#e65c00',
          'orange-light': '#ff8533',
          'beige': '#f6f6ef',
          'gray': '#828282',
          'gray-light': '#aaaaaa',
          'gray-dark': '#6a6a6a',
        },
        'primary': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        }
      },
      fontSize: {
        'xs': '10px',
        'sm': '12px',
        'base': '14px',
        'lg': '16px',
        'xl': '18px',
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: true
  }
} satisfies Config
