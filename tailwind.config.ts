import type { Config } from 'tailwindcss'

export default {
  content: {
    files: [
      './app/**/*.{vue,js,ts}',
      './components/**/*.{vue,js,ts}',
      './layouts/**/*.{vue,js,ts}',
      './pages/**/*.vue',
      './plugins/**/*.{js,ts}',
      './error.vue'
    ],
    transform: {
      vue: (content) => {
        return content
          .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '$1')
          .replace(/<template[^>]*>([\s\S]*?)<\/template>/gi, '$1')
      }
    }
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75'
        }
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      },
      spacing: {
        '128': '32rem',
        '144': '36rem'
      },
      borderRadius: {
        '4xl': '2rem'
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: true
  }
} satisfies Config