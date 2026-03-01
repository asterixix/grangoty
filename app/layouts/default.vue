<template>
  <div class="min-h-screen" style="background-color: var(--color-mint-cream-500);">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:text-white"
      style="background-color: var(--color-dark-teal-500);"
    >
      {{ $t('skipLink') }}
    </a>

    <header class="app-header">
      <div class="max-w-5xl mx-auto px-3">
        <nav class="flex items-center justify-between py-1" role="navigation" aria-label="Main navigation">
          <div class="flex items-center gap-2">
            <NuxtLink
              :to="localePath('/')"
              class="font-bold text-white hover:underline text-sm"
              aria-label="GRANgoTY - Home"
              style="color: var(--color-mint-cream-500);"
            >
              <span class="text-lg">🅖</span> GRANgoTY
            </NuxtLink>
            <span class="text-xs hidden sm:inline" style="color: rgba(247,255,247,0.65);">
              | {{ $t('footer.description').split('.')[0] }}
            </span>
          </div>

          <div class="flex items-center gap-2 sm:gap-4">
            <div class="relative">
              <label for="lang-select" class="sr-only">{{ $t('nav.language') }}</label>
              <select
                id="lang-select"
                v-model="currentLocale"
                class="text-xs px-2 py-1 rounded border-0 cursor-pointer"
                style="background-color: var(--color-dark-teal-400); color: var(--color-mint-cream-500);"
                @change="switchLocale"
              >
                <option v-for="locale in locales" :key="locale.code" :value="locale.code">
                  {{ locale.code.toUpperCase() }}
                </option>
              </select>
            </div>

            <a
              href="https://github.com/asterixix/grangoty/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs hover:underline"
              style="color: var(--color-strong-cyan-800);"
            >
              {{ $t('nav.reportIssue') }}
            </a>
          </div>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main id="main-content" class="max-w-5xl mx-auto px-3 py-3" role="main">
      <slot />
    </main>

    <footer class="app-footer mt-8 py-4" role="contentinfo">
      <div class="max-w-5xl mx-auto px-3">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs" style="color: var(--color-dark-teal-600);">
          <div>
            <NuxtLink :to="localePath('/')" class="hover:underline" style="color: var(--color-dark-teal-500);">
              GRANgoTY
            </NuxtLink>
            <span class="mx-1">|</span>
            <span>{{ $t('footer.madeWithLove') }}</span>
          </div>
          <div class="flex gap-3">
            <a href="/api/rss" class="hover:underline" target="_blank" style="color: var(--color-strong-cyan-400);">RSS</a>
            <a
              href="https://github.com/asterixix/grangoty/issues/new?template=bug_report.md"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:underline"
              style="color: var(--color-strong-cyan-400);"
            >
              {{ $t('footer.reportBug') }}
            </a>
            <a
              href="https://github.com/asterixix/grangoty/issues/new?template=feature_request.md"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:underline"
              style="color: var(--color-strong-cyan-400);"
            >
              {{ $t('footer.featureRequest') }}
            </a>
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

function switchLocale(): void {
  setLocale(currentLocale.value)
}
</script>
