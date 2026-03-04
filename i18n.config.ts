// i18n runtime configuration — vue-i18n options only.
// Translations are loaded via @nuxtjs/i18n file-based loading (lazy: false)
// which bundles all locale files into the server bundle at build time,
// ensuring translations are available synchronously during SSR on Vercel.
export default {
  legacy: false,
  compositionOnly: true,
  silentTranslationWarn: false,
  silentFallbackWarn: false,
  missingWarn: false,
  fallbackWarn: false,
  fallbackLocale: 'pl',
  pluralizationRules: {
    pl: (choice: number) => {
      if (choice === 0) return 'zero'
      if (choice === 1) return 'one'
      if (choice >= 2 && choice <= 4) return 'few'
      return 'many'
    },
    uk: (choice: number) => {
      if (choice === 0) return 'zero'
      if (choice === 1) return 'one'
      if (choice >= 2 && choice <= 4) return 'few'
      return 'many'
    },
    be: (choice: number) => {
      if (choice === 0) return 'zero'
      if (choice === 1) return 'one'
      if (choice % 10 === 1 && choice % 100 !== 11) return 'one'
      return 'many'
    }
  }
}
