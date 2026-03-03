import { defineNuxtPlugin } from '#imports'
import pl from '../locales/pl.json'
import en from '../locales/en.json'
import uk from '../locales/uk.json'
import be from '../locales/be.json'
import de from '../locales/de.json'

export default defineNuxtPlugin((nuxtApp) => {
  const i18n = (nuxtApp as any).$i18n
  if (i18n) {
    const allMessages = {
      pl: { ...pl },
      en: { ...en },
      uk: { ...uk },
      be: { ...be },
      de: { ...de },
    }
    
    for (const [locale, messages] of Object.entries(allMessages)) {
      i18n.global.mergeLocaleMessage(locale, messages)
    }
  }
})
