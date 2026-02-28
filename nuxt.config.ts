import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'GRANgoTY - Find grants for your organization',
      meta: [
        { name: 'description', content: 'GRANgoTY - Aggregating grants for NGOs across Europe. Find funding opportunities for your organization.' },
        { name: 'theme-color', content: '#0F6E84' },
        { property: 'og:title', content: 'GRANgoTY' },
        { property: 'og:description', content: 'GRANgoTY - Aggregating grants for NGOs across Europe. Find funding opportunities for your organization.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og-image.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'GRANgoTY' },
        { name: 'twitter:description', content: 'GRANgoTY - Aggregating grants for NGOs across Europe. Find funding opportunities for your organization.' },
        { name: 'twitter:image', content: '/og-image.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap' }
      ]
    }
  },

  // Source directory
  srcDir: 'app/',

  css: ['~/assets/styles/tailwind.css'],

  modules: [
    '@nuxtjs/i18n',
    '@pinia/nuxt',
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
    vueI18n: './i18n.config.ts',
    ignoreRoutes: ['api', 'api/**', '_nuxt', 'assets']
  },

  // tailwindcss: {
  //   cssPath: '~/assets/styles/tailwind.css',
  //   configPath: 'tailwind.config.ts',
  // },

  nitro: {
    preset: 'vercel',
    routeRules: {
      '/api/**': { cors: true, prerender: false, cache: false },
      '/**': { isr: 300 }
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
      siteUrl: process.env.SITE_URL || 'https://grangoty.vercel.app',
      // Sentry DSN (safe to expose - it's a public identifier)
      sentryDsn: process.env.SENTRY_DSN,
    }
  },

  // sentry: {
  //   sourceMapsUploadOptions: {
  //     org: process.env.SENTRY_ORG,
  //     project: 'granthub-pl',
  //     authToken: process.env.SENTRY_AUTH_TOKEN,
  //   },
  // },
})