<template>
  <NuxtLayout name="default">
    <section
      class="error-page flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      role="main"
      aria-labelledby="error-title"
    >
      <div class="error-icon mb-6" aria-hidden="true">
        <div class="relative mb-4">
          <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            class="w-24 h-24"
            style="color: var(--color-dark-teal-700);"
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="5"/>
            <line x1="30" y1="30" x2="70" y2="70" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
            <line x1="70" y1="30" x2="30" y2="70" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          </svg>

          <div
            v-if="error.statusCode"
            class="absolute -top-2 -right-2 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold"
            style="background-color: var(--color-grapefruit-pink-500); color: white;"
          >
            {{ error.statusCode }}
          </div>
        </div>
      </div>

      <h1
        id="error-title"
        class="text-2xl md:text-3xl font-semibold mb-3"
        style="color: var(--color-dark-teal-500);"
      >
        {{ errorMessage }}
      </h1>

      <p class="mb-8" style="color: var(--color-dark-teal-600);">
        {{ $t('errors.codeLabel', { code: error.statusCode }) }}
      </p>

      <div class="error-actions flex flex-col sm:flex-row gap-3">
        <button
          class="px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          style="background-color: var(--color-dark-teal-500); color: var(--color-mint-cream-500);"
          @click="handleGoHome"
        >
          {{ $t('errors.backHome') }}
        </button>
        <button
          class="px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500);"
          @click="handleRetry"
        >
          {{ $t('errors.retry') }}
        </button>
      </div>

      <p
        v-if="error.statusCode === 404"
        class="mt-8 text-sm"
        style="color: var(--color-dark-teal-600);"
      >
        {{ $t('grants.notFoundDescription') }}
      </p>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const errorMessage = computed(() => {
  const code = props.error.statusCode
  if (code === 404) return t('errors.notFound')
  if (code === 503) return t('errors.serviceUnavailable')
  if (code >= 500) return t('errors.serviceUnavailable')
  if (code === 403 || code === 401) return t('notifications.auth.forbidden')
  return t('errors.unexpected')
})

function handleGoHome(): void {
  clearError({ redirect: localePath('/') })
}

function handleRetry(): void {
  clearError()
}

useHead({
  title: `${errorMessage.value} | GRANgoTY`,
  meta: [{ name: 'robots', content: 'noindex' }]
})
</script>

<style scoped>
.error-page {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
