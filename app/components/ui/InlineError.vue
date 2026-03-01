<template>
  <div
    class="inline-error flex items-center gap-3 p-4 rounded-lg border"
    role="alert"
    style="background-color: var(--color-grapefruit-pink-900); border-color: var(--color-grapefruit-pink-700);"
  >
    <!-- Error icon -->
    <div class="flex-shrink-0" aria-hidden="true" style="color: var(--color-grapefruit-pink-500);">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <!-- Message -->
    <p class="flex-1 text-sm" style="color: var(--color-dark-teal-500);">
      {{ message }}
    </p>

    <!-- Retry button -->
    <button
      v-if="onRetry"
      class="flex-shrink-0 px-3 py-1 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
      style="color: var(--color-dark-teal-500); background-color: var(--color-grapefruit-pink-800); border: 1px solid var(--color-grapefruit-pink-600);"
      @click="onRetry"
    >
      {{ $t('common.retry') }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  onRetry?: () => void
}>()
</script>
