import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LocaleCode } from '~/app/types'

export const useLocaleStore = defineStore('locale', () => {
  const currentLocale = ref<LocaleCode>('pl')
  const availableLocales = [
    { code: 'pl', name: 'Polski', iso: 'pl-PL' },
    { code: 'en', name: 'English', iso: 'en-US' },
    { code: 'uk', name: 'Українська', iso: 'uk-UA' },
    { code: 'be', name: 'Беларуская', iso: 'be-BY' },
    { code: 'de', name: 'Deutsch', iso: 'de-DE' }
  ] as const

  function setLocale(locale: LocaleCode): void {
    currentLocale.value = locale
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }

  function getLocaleName(code: LocaleCode): string {
    const locale = availableLocales.find(l => l.code === code)
    return locale?.name || code
  }

  function isRtl(locale: LocaleCode): boolean {
    return ['ar', 'fa', 'he'].includes(locale)
  }

  return {
    currentLocale,
    availableLocales,
    setLocale,
    getLocaleName,
    isRtl
  }
})