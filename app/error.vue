<template>
  <NuxtLayout name="default">
    <section
      class="error-page flex flex-col items-center justify-center min-h-[60vh] text-center px-4 py-12"
      role="main"
      aria-labelledby="error-title"
    >
      <UiErrorIllustration :code="statusCode" aria-hidden="true" />

      <h1
        id="error-title"
        class="text-2xl md:text-3xl font-semibold mt-6 mb-3"
        style="color: var(--color-dark-teal-500);"
      >
        {{ headline }}
      </h1>

      <p
        class="max-w-md text-base mb-2"
        style="color: var(--color-dark-teal-600);"
      >
        {{ description }}
      </p>

      <p
        class="text-xs mb-8 font-mono"
        style="color: var(--color-dark-teal-700);"
      >
        {{ $t('errors.codeLabel', { code: statusCode }) }}
      </p>

      <div class="flex flex-col sm:flex-row gap-3">
        <button
          class="px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          style="background-color: var(--color-dark-teal-500); color: var(--color-mint-cream-500);"
          @mouseenter="(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-dark-teal-400)'"
          @mouseleave="(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-dark-teal-500)'"
          @click="handleGoHome"
        >
          {{ $t('errors.backHome') }}
        </button>

        <button
          v-if="isRetryable"
          class="px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500);"
          @mouseenter="(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-strong-cyan-800)'"
          @mouseleave="(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-strong-cyan-900)'"
          @click="handleRetry"
        >
          {{ $t('errors.retry') }}
        </button>

        <a
          v-if="isServerError"
          href="https://github.com/ngo-grants-aggregator/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          class="px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center gap-2"
          style="border: 1px solid var(--color-grapefruit-pink-400); color: var(--color-grapefruit-pink-500);"
          @mouseenter="(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-grapefruit-pink-100)'"
          @mouseleave="(e) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
        >
          <UIcon name="i-lucide-bug" class="w-4 h-4" />
          {{ $t('errors.reportBug') || 'Report Bug' }}
        </a>
      </div>

      <div
        v-if="errorDetail"
        class="mt-10 max-w-lg text-left"
      >
        <details class="rounded-lg overflow-hidden" style="border: 1px solid var(--color-strong-cyan-800);">
          <summary
            class="px-4 py-2 text-xs font-medium cursor-pointer select-none"
            style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-600);"
          >
            {{ $t('errors.technicalDetails') || 'Technical details' }}
          </summary>
          <pre
            class="px-4 py-3 text-xs overflow-auto max-h-40"
            style="background-color: var(--color-mint-cream-500); color: var(--color-dark-teal-700);"
          >{{ errorDetail }}</pre>
        </details>
      </div>
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

const statusCode = computed(() => props.error.statusCode ?? 0)

const isServerError = computed(() => statusCode.value >= 500)
const isRetryable = computed(() => statusCode.value !== 404 && statusCode.value !== 403 && statusCode.value !== 401)

const headline = computed(() => {
  const code = statusCode.value
  if (code === 404) return t('errors.notFound')
  if (code === 401 || code === 403) return t('notifications.auth.forbidden')
  if (code === 503) return t('errors.serviceUnavailable')
  if (code >= 500) return t('errors.serviceUnavailable')
  return t('errors.unexpected')
})

const description = computed(() => {
  const code = statusCode.value
  if (code === 404) return t('grants.notFoundDescription')
  if (code === 401) return t('errors.unauthorizedDescription') || 'You need to log in to access this resource.'
  if (code === 403) return t('errors.forbiddenDescription') || 'You don\'t have permission to access this resource.'
  if (code === 503) return t('errors.serviceUnavailableDescription') || 'The service is temporarily down. Please try again in a few moments.'
  if (code >= 500) return t('errors.serverErrorDescription') || 'Something went wrong on our end. We\'ve been notified and are working on a fix.'
  return t('errors.unexpectedDescription') || 'An unexpected error occurred. Please try refreshing the page.'
})

const errorDetail = computed(() => {
  if (!isServerError.value) return null
  return props.error.message || props.error.statusMessage || null
})

function handleGoHome(): void {
  clearError({ redirect: localePath('/') })
}

function handleRetry(): void {
  clearError()
}

useHead({
  title: `${headline.value} | GRANgoTY`,
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
