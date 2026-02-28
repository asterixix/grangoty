<template>
  <div v-if="hasError" class="error-boundary p-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
    <div class="flex items-start gap-4">
      <div class="flex-shrink-0 text-red-500 dark:text-red-400">
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-red-800 dark:text-red-200">
          {{ $t('errors.boundaryTitle') || 'Something went wrong' }}
        </h3>
        <p class="mt-2 text-sm text-red-600 dark:text-red-300">
          {{ $t('errors.boundaryMessage') || 'An error occurred while rendering this component.' }}
        </p>
        <div v-if="import.meta.dev && error" class="mt-3 p-3 bg-red-100 dark:bg-red-900/40 rounded text-xs font-mono text-red-800 dark:text-red-200 overflow-x-auto">
          {{ error.message }}
        </div>
        <div class="mt-4 flex gap-3">
          <button
            @click="resetError"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            {{ $t('common.retry') || 'Try Again' }}
          </button>
          <button
            v-if="showDetails"
            @click="showDetails = false"
            class="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors text-sm"
          >
            {{ $t('common.hideDetails') || 'Hide Details' }}
          </button>
          <button
            v-else-if="import.meta.dev"
            @click="showDetails = true"
            class="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors text-sm"
          >
            {{ $t('common.showDetails') || 'Show Details' }}
          </button>
        </div>
        <div v-if="showDetails && import.meta.dev" class="mt-4 p-3 bg-red-100 dark:bg-red-900/40 rounded overflow-x-auto">
          <pre class="text-xs text-red-800 dark:text-red-200">{{ errorStack }}</pre>
        </div>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const error = ref<Error | null>(null)
const showDetails = ref(false)

const errorStack = computed(() => {
  if (!error.value) return ''
  return error.value.stack || ''
})

onErrorCaptured((err) => {
  error.value = err
  hasError.value = true
  
  console.error('[ErrorBoundary] Caught error:', err)
  
  return false
})

function resetError() {
  hasError.value = false
  error.value = null
  showDetails.value = false
}
</script>
