<template>
  <header
    class="sticky top-0 z-40 shadow-sm transition-colors duration-200"
    style="background-color: var(--color-dark-teal-500); border-bottom: 2px solid var(--color-dark-teal-400);"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 sm:h-18">
        <div class="flex items-center">
          <LayoutLogo />
        </div>

        <div class="hidden md:flex items-center space-x-1 sm:space-x-2">
          <UButton
            to="/"
            size="sm"
            :variant="currentRoute.name === 'index' ? 'soft' : 'ghost'"
            :style="currentRoute.name === 'index'
              ? 'background-color: var(--color-dark-teal-400); color: var(--color-mint-cream-500);'
              : 'color: var(--color-strong-cyan-800);'"
          >
            {{ t('nav.home') }}
          </UButton>

          <UButton
            to="https://github.com/asterixix/grangoty/issues"
            target="_blank"
            size="sm"
            variant="ghost"
            trailing-icon="i-lucide-external-link"
            style="color: var(--color-strong-cyan-800);"
          >
            {{ t('nav.reportIssue') }}
          </UButton>

          <UButton
            size="sm"
            variant="ghost"
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
            style="color: var(--color-strong-cyan-800);"
            @click="toggleTheme"
          />

          <UDropdownMenu
            :items="languageItems"
            :ui="{ content: 'w-48' }"
          >
            <UButton
              size="sm"
              variant="ghost"
              trailing-icon="i-lucide-chevron-down"
              style="color: var(--color-strong-cyan-800);"
            >
              {{ getLocaleName(currentLocale) }}
            </UButton>
          </UDropdownMenu>
        </div>

        <div class="flex items-center md:hidden space-x-2">
          <UButton
            size="sm"
            variant="ghost"
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
            style="color: var(--color-strong-cyan-800);"
            @click="toggleTheme"
          />

          <UButton
            size="sm"
            variant="ghost"
            :icon="isMobileMenuOpen.value ? 'i-lucide-x' : 'i-lucide-menu'"
            :aria-expanded="isMobileMenuOpen.value"
            :aria-label="isMobileMenuOpen.value ? 'Close menu' : 'Open menu'"
            style="color: var(--color-strong-cyan-800);"
            @click="toggleMobileMenu"
          />
        </div>
      </div>
    </div>

    <div
      v-if="isMobileMenuOpen.value"
      class="md:hidden animate-fade-in"
      style="background-color: var(--color-dark-teal-400); border-top: 1px solid var(--color-dark-teal-300);"
    >
      <div class="px-2 pt-2 pb-3 space-y-1">
        <UButton
          to="/"
          :variant="currentRoute.name === 'index' ? 'soft' : 'ghost'"
          block
          class="justify-start"
          style="color: var(--color-mint-cream-500);"
        >
          {{ t('nav.home') }}
        </UButton>

        <UButton
          to="https://github.com/asterixix/grangoty/issues"
          target="_blank"
          variant="ghost"
          block
          class="justify-start"
          trailing-icon="i-lucide-external-link"
          style="color: var(--color-strong-cyan-800);"
        >
          {{ t('nav.reportIssue') }}
        </UButton>

        <div class="px-3 py-2">
          <label class="block text-sm font-medium mb-2" style="color: var(--color-strong-cyan-800);">
            {{ t('nav.language') }}
          </label>
          <div class="space-y-1">
            <UButton
              v-for="locale in availableLocales"
              :key="locale.code"
              :variant="currentLocale === locale.code ? 'soft' : 'ghost'"
              block
              class="justify-start"
              style="color: var(--color-mint-cream-500);"
              @click="setLocale(locale.code)"
            >
              {{ locale.name }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useUiStore } from '~/stores/ui'
import { useLocaleStore } from '~/stores/locale'

const route = useRoute()
const uiStore = useUiStore()
const localeStore = useLocaleStore()
const { t } = useI18n({ useScope: 'global' })

// Reactive store state via storeToRefs — plain destructure breaks reactivity
const { isMobileMenuOpen } = storeToRefs(uiStore)
const { toggleMobileMenu } = uiStore

const { currentLocale, availableLocales, setLocale, getLocaleName } = localeStore
const currentRoute = computed(() => route)

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const languageItems = computed(() =>
  availableLocales.map(locale => ({
    label: locale.name,
    onSelect: () => setLocale(locale.code)
  }))
)

function toggleTheme(): void {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>
