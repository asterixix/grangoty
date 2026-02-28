<template>
  <div class="skip-link" id="skip-link">
    <a href="#main-content">{{ t('skipLink') }}</a>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>

<style scoped>
@reference "tailwindcss";

.skip-link {
  @apply absolute -translate-y-full focus:translate-y-0 focus:z-50 focus:top-4 focus:left-4 px-4 py-2 bg-primary-500 text-white rounded-lg shadow-lg transition-all duration-200;
}

.skip-link a {
  @apply no-underline text-white font-medium;
}
</style>