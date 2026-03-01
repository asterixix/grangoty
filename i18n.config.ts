import pl from './app/locales/pl.json'
import en from './app/locales/en.json'
import uk from './app/locales/uk.json'
import be from './app/locales/be.json'
import de from './app/locales/de.json'

// i18n Configuration — translations are inlined here so they are always
// compiled directly into the bundle, bypassing any file-based lazy-load
// caching that can leave stale locale chunks on Vercel.
export default {
  legacy: false,
  compositionOnly: true,
  silentTranslationWarn: false,
  silentFallbackWarn: false,
  messages: { pl, en, uk, be, de },
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
