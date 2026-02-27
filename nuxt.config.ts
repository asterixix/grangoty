import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'NGO Grants Aggregator',
      meta: [
        { name: 'description', content: 'Aggregating grants for NGOs across Europe' },
        { name: 'theme-color', content: '#ffffff' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },

  // CSS is handled by @nuxtjs/tailwindcss module
  // css: [],

  modules: [
    '@nuxtjs/i18n',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],

  // @ts-expect-error - i18n module extends NuxtConfig
  i18n: {
    strategy: 'prefix',
    locales: [
      { code: 'pl', name: 'Polski', file: 'pl.json', language: 'pl-PL' },
      { code: 'en', name: 'English', file: 'en.json', language: 'en-US' },
      { code: 'uk', name: 'Українська', file: 'uk.json', language: 'uk-UA' },
      { code: 'be', name: 'Беларуская', file: 'be.json', language: 'be-BY' },
      { code: 'de', name: 'Deutsch', file: 'de.json', language: 'de-DE' }
    ],
    defaultLocale: 'pl',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      fallbackLocale: 'pl'
    },
    lazy: true,
    langDir: 'locales',
    vueI18n: './i18n.config.ts'
  },

  tailwindcss: {
    cssPath: 'app/assets/styles/tailwind.css',
    configPath: 'tailwind.config.ts',
    exposeConfig: false,
    injectPosition: 0,
    viewer: true
  },

  nitro: {
    preset: 'vercel',
    routeRules: {
      '/': { isr: 300 },
      '/grant/**': { isr: 600 },
      '/api/rss': { headers: { 'Content-Type': 'application/rss+xml' } }
    }
  },

  experimental: {
    typedPages: true
  },

  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        moduleResolution: 'bundler'
      }
    }
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/variables" as *;'
        }
      }
    }
  }
})