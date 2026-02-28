<template>
  <div class="min-h-screen bg-hn-beige">
    <!-- Skip Link for a11y -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-hn-orange focus:text-white focus:px-4 focus:py-2 focus:rounded"
    >
      {{ $t('skipLink') }}
    </a>

    <!-- Header -->
    <header class="bg-hn-orange border-b-2 border-hn-orange-dark">
      <div class="max-w-5xl mx-auto px-3">
        <nav class="flex items-center justify-between py-1" role="navigation" aria-label="Main navigation">
          <div class="flex items-center gap-2">
            <NuxtLink 
              :to="localePath('/')" 
              class="font-bold text-white hover:underline text-sm"
              aria-label="GRANgoTY - Home"
            >
              <span class="text-lg">🅖</span> GRANgoTY
            </NuxtLink>
            <span class="text-white/70 text-xs hidden sm:inline">| {{ $t('footer.description').split('.')[0] }}</span>
          </div>
          
          <div class="flex items-center gap-2 sm:gap-4">
            <!-- Language Switcher -->
            <div class="relative">
              <label for="lang-select" class="sr-only">{{ $t('nav.language') }}</label>
              <select
                id="lang-select"
                v-model="currentLocale"
                class="bg-white text-xs px-2 py-1 rounded border-0 cursor-pointer"
                @change="switchLocale"
              >
                <option v-for="locale in locales" :key="locale.code" :value="locale.code">
                  {{ locale.code.toUpperCase() }}
                </option>
              </select>
            </div>

            <!-- GitHub Issues Link -->
            <a
              href="https://github.com/asterixix/grangoty/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white text-xs hover:underline"
            >
              {{ $t('nav.reportIssue') }}
            </a>
          </div>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main id="main-content" class="max-w-5xl mx-auto px-3 py-3" role="main">
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer class="border-t border-hn-gray mt-8 py-4" role="contentinfo">
      <div class="max-w-5xl mx-auto px-3">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-hn-gray-dark">
          <div>
            <NuxtLink :to="localePath('/')" class="hover:underline">GRANgoTY</NuxtLink>
            <span class="mx-1">|</span>
            <span>{{ $t('footer.madeWithLove') }}</span>
          </div>
          <div class="flex gap-3">
            <a href="/api/rss" class="hover:underline" target="_blank">RSS</a>
            <a href="https://github.com/asterixix/grangoty/issues/new?template=bug_report.md" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ $t('footer.reportBug') }}</a>
            <a href="https://github.com/asterixix/grangoty/issues/new?template=feature_request.md" target="_blank" rel="noopener noreferrer" class="hover:underline">{{ $t('footer.featureRequest') }}</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue'
const { locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()

const currentLocale = ref(locale.value)

watch(locale, (newLocale) => {
  currentLocale.value = newLocale
})

const switchLocale = () => {
  setLocale(currentLocale.value)
}
</script>
