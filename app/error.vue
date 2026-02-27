<template>
  <NuxtLayout name="default">
    <section
      class="error-page flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      role="main"
      aria-labelledby="error-title"
    >
      <!-- Error illustration based on status code -->
      <div class="error-icon mb-6" aria-hidden="true">
        <div class="flex flex-col items-center justify-center">
          <div class="relative mb-4">
            <!-- Main error icon -->
            <svg 
              viewBox="0 0 100 100" 
              xmlns="http://www.w3.org/2000/svg"
              class="w-24 h-24 text-slate-400"
              aria-hidden="true"
            >
              <!-- Error circle -->
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" stroke-width="5"/>
              <!-- X mark -->
              <line x1="30" y1="30" x2="70" y2="70" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
              <line x1="70" y1="30" x2="30" y2="70" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
            </svg>
            
            <!-- Status code overlay -->
            <div 
              v-if="error.statusCode"
              class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold"
            >
              {{ error.statusCode }}
            </div>
          </div>
        </div>
      </div>

      <!-- Error title -->
      <h1 id="error-title" class="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
        {{ errorMessage }}
      </h1>

      <!-- Error code label -->
      <p class="text-slate-500 dark:text-slate-400 mb-8">
        {{ $t('errors.codeLabel', { code: error.statusCode }) }}
      </p>

      <!-- Action buttons -->
      <div class="error-actions flex flex-col sm:flex-row gap-3">
        <button
          class="px-6 py-3 bg-hn-orange text-white font-medium rounded-lg hover:bg-hn-orange-dark transition-colors focus:outline-none focus:ring-2 focus:ring-hn-orange focus:ring-offset-2"
          @click="handleGoHome"
        >
          {{ $t('errors.backHome') }}
        </button>
        <button
          class="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          @click="handleRetry"
        >
          {{ $t('errors.retry') }}
        </button>
      </div>

      <!-- Additional help text for specific errors -->
      <p
        v-if="error.statusCode === 404"
        class="mt-8 text-sm text-slate-500 dark:text-slate-400"
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

// Determine the appropriate error message based on status code
const errorMessage = computed(() => {
  const statusCode = props.error.statusCode

  if (statusCode === 404) {
    return t('errors.notFound')
  }

  if (statusCode === 503) {
    return t('errors.serviceUnavailable')
  }

  if (statusCode >= 500) {
    return t('errors.serviceUnavailable')
  }

  if (statusCode === 403 || statusCode === 401) {
    return t('notifications.auth.forbidden')
  }

  return t('errors.unexpected')
})

// Clear error and navigate to home
function handleGoHome() {
  clearError({ redirect: localePath('/') })
}

// Clear error and retry (stay on same page)
function handleRetry() {
  clearError()
}

// Set appropriate meta tags for error pages
useHead({
  title: `${errorMessage.value} | GRANgoTY`,
  meta: [
    { name: 'robots', content: 'noindex' }
  ]
})
</script>

<style scoped>
.error-page {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>