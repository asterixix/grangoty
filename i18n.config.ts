// i18n Configuration
export default {
  localeDir: 'locales',
  keySeparator: '.',
  legacy: false,
  compositionOnly: true,
  silentTranslationWarn: false,
  silentFallbackWarn: false,
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
  },
  missingWarn: false,
  fallbackWarn: false
}