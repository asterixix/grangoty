import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'GRANgoTY - Grant Aggregator for NGOs',
      meta: [
        { name: 'description', content: 'GRANgoTY - Aggregating grants for NGOs across Europe. Find funding opportunities for your organization.' },
        { name: 'theme-color', content: '#ff6600' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  // Source directory
  srcDir: 'app/',

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
    cssPath: 'assets/styles/tailwind.css',
    configPath: '../tailwind.config.ts',
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
  },

  // Runtime config for environment variables
  runtimeConfig: {
    // Server-side only
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    deeplApiKey: process.env.DEEPL_API_KEY,
    // Public (client-side)
    public: {
      siteName: 'GRANgoTY',
      siteUrl: process.env.SITE_URL || 'https://grangoty.vercel.app'
    }
  }
})