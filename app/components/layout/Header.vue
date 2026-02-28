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
          <NuxtLink
            to="/"
            :class="[
              'px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
              currentRoute.name === 'index'
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-primary-400 dark:hover:bg-neutral-800'
            ]"
          >
            {{ t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            to="/submit"
            :class="[
              'px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
              currentRoute.name === 'submit'
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-primary-400 dark:hover:bg-neutral-800'
            ]"
          >
            {{ t('nav.submit') }}
          </NuxtLink>
          
          <!-- Theme toggle -->
          <button
            @click="toggleTheme"
            class="p-2 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-neutral-800 transition-colors duration-200"
            :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
          >
            <UIcon
              v-if="isDark"
              name="i-lucide-sun"
              class="w-5 h-5"
            />
            <UIcon
              v-else
              name="i-lucide-moon"
              class="w-5 h-5"
            />
          </button>

          <!-- Language selector -->
          <div class="relative group">
            <button
              class="flex items-center px-3 py-2 rounded-md text-sm font-medium text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-primary-400 dark:hover:bg-neutral-800 transition-colors duration-200"
              :aria-label="t('nav.language')"
            >
              <span class="mr-1">{{ getLocaleName(currentLocale) }}</span>
              <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-neutral-400" />
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg py-1 hidden group-hover:block animate-fade-in">
              <button
                v-for="locale in availableLocales"
                :key="locale.code"
                @click="setLocale(locale.code)"
                class="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 w-full text-left transition-colors duration-200"
              >
                {{ locale.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="flex items-center md:hidden space-x-2">
          <button
            @click="toggleTheme"
            class="p-2 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-neutral-800 transition-colors duration-200"
            :aria-label="`Switch to ${isDark ? 'light' : 'dark'} mode`"
          >
            <UIcon
              v-if="isDark"
              name="i-lucide-sun"
              class="w-5 h-5"
            />
            <UIcon
              v-else
              name="i-lucide-moon"
              class="w-5 h-5"
            />
          </button>

          <button
            @click="toggleMobileMenu"
            class="inline-flex items-center justify-center p-2 rounded-md text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-primary-400 dark:hover:bg-neutral-800 focus:outline-none transition-colors duration-200"
            :aria-expanded="isMobileMenuOpen"
            :aria-label="isMobileMenuOpen ? 'Close menu' : 'Open menu'"
          >
            <UIcon
              v-if="!isMobileMenuOpen"
              name="i-lucide-menu"
              class="w-6 h-6"
            />
            <UIcon
              v-else
              name="i-lucide-x"
              class="w-6 h-6"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div
      v-if="isMobileMenuOpen"
      class="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 animate-fade-in"
    >
      <div class="px-2 pt-2 pb-3 space-y-1">
        <NuxtLink
          to="/"
          :class="[
            'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200',
            currentRoute.name === 'index'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-primary-400 dark:hover:bg-neutral-800'
          ]"
        >
          {{ t('nav.home') }}
        </NuxtLink>
        <NuxtLink
          to="/submit"
          :class="[
            'block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200',
            currentRoute.name === 'submit'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
              : 'text-neutral-700 hover:text-primary-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:text-primary-400 dark:hover:bg-neutral-800'
          ]"
        >
          {{ t('nav.submit') }}
        </NuxtLink>

        <div class="px-3 py-2">
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {{ t('nav.language') }}
          </label>
          <div class="space-y-1">
            <button
              v-for="locale in availableLocales"
              :key="locale.code"
              @click="setLocale(locale.code)"
              :class="[
                'block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200',
                currentLocale === locale.code
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
              ]"
            >
              {{ locale.name }}
            </button>
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