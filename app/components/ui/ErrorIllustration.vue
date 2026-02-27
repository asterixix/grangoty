<template>
  <div class="error-illustration">
    <!-- 404 - Not Found -->
    <svg
      v-if="code === 404"
      class="w-32 h-32 text-slate-300 dark:text-slate-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>

    <!-- 503 - Service Unavailable -->
    <svg
      v-else-if="code === 503"
      class="w-32 h-32 text-slate-300 dark:text-slate-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
      />
    </svg>

    <!-- 403/401 - Forbidden/Unauthorized -->
    <svg
      v-else-if="code === 403 || code === 401"
      class="w-32 h-32 text-slate-300 dark:text-slate-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>

    <!-- 500 - Server Error -->
    <svg
      v-else-if="code >= 500"
      class="w-32 h-32 text-slate-300 dark:text-slate-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>

    <!-- 400 - Bad Request -->
    <svg
      v-else-if="code >= 400 && code < 500"
      class="w-32 h-32 text-slate-300 dark:text-slate-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>

    <!-- Default - Generic Error -->
    <svg
      v-else
      class="w-32 h-32 text-slate-300 dark:text-slate-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>

    <!-- Status code display -->
    <div class="mt-4 text-6xl font-bold text-slate-200 dark:text-slate-700">
      {{ code }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  code: number
}>()
</script>

<style scoped>
.error-illustration {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
