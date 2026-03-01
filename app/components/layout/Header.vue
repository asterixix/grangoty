<template>
  <header class="header sticky top-0 z-40 bg-white dark:bg-neutral-900 shadow-sm dark:shadow-none transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 sm:h-18">
        <!-- Logo -->
        <div class="flex items-center">
          <Logo />
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-1 sm:space-x-2">
          <UButton
            to="/"
            color="neutral"
            :variant="currentRoute.name === 'index' ? 'soft' : 'ghost'"
            size="sm"
          >
            {{ t('nav.home') }}
          </UButton>
          
          <UButton
            to="https://github.com/asterixix/grangoty/issues"
            target="_blank"
            color="neutral"
            variant="ghost"
            size="sm"
            trailing-icon="i-lucide-external-link"
          >
            {{ t('nav.reportIssue') }}
          </UButton>
          
          <!-- Theme toggle -->
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
            @click="toggleTheme"
          />

          <!-- Language selector -->
          <UDropdownMenu
            :items="languageItems"
            :ui="{ content: 'w-48' }"
          >
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              trailing-icon="i-lucide-chevron-down"
            >
              {{ getLocaleName(currentLocale) }}
            </UButton>
          </UDropdownMenu>
        </div>

        <!-- Mobile menu button -->
        <div class="flex items-center md:hidden space-x-2">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
            @click="toggleTheme"
          />

          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            :icon="isMobileMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
            :aria-expanded="isMobileMenuOpen"
            :aria-label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
            @click="toggleMobileMenu"
          />
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div
      v-if="isMobileMenuOpen"
      class="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 animate-fade-in"
    >
      <div class="px-2 pt-2 pb-3 space-y-1">
        <UButton
          to="/"
          color="neutral"
          :variant="currentRoute.name === 'index' ? 'soft' : 'ghost'"
          block
          class="justify-start"
        >
          {{ t('nav.home') }}
        </UButton>
        
        <UButton
          to="https://github.com/asterixix/grangoty/issues"
          target="_blank"
          color="neutral"
          variant="ghost"
          block
          class="justify-start"
          trailing-icon="i-lucide-external-link"
        >
          {{ t('nav.reportIssue') }}
        </UButton>

        <div class="px-3 py-2">
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {{ t('nav.language') }}
          </label>
          <div class="space-y-1">
            <UButton
              v-for="locale in availableLocales"
              :key="locale.code"
              color="neutral"
              :variant="currentLocale === locale.code ? 'soft' : 'ghost'"
              block
              class="justify-start"
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
import { useRoute } from 'vue-router'
import { useUiStore } from '~/stores/ui'
import { useLocaleStore } from '~/stores/locale'

const route = useRoute()
const uiStore = useUiStore()
const localeStore = useLocaleStore()

const { isMobileMenuOpen, toggleMobileMenu } = uiStore
const { currentLocale, availableLocales, setLocale, getLocaleName } = localeStore
const currentRoute = computed(() => route)

// Theme management
const isDark = ref(false)

// Language dropdown items
const languageItems = computed(() => [
  availableLocales.value.map(locale => ({
    label: locale.name,
    click: () => setLocale(locale.code)
  }))
])

function toggleTheme(): void {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// Initialize theme from system preference
onMounted(() => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    isDark.value = true
    document.documentElement.setAttribute('data-theme', 'dark')
  }
})
</script>

<style scoped>
@reference "tailwindcss";

.header {
  @apply transition-colors duration-200;
}
</style>
