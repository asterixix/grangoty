<template>
  <div class="logo flex items-center">
    <NuxtLink to="/" class="flex items-center group" aria-label="GRANgoTY Home">
      <!-- Logo Icon -->
      <div class="logo-icon h-8 w-8 sm:h-10 sm:w-10 bg-primary-500 rounded-lg flex items-center justify-center mr-3 transition-transform group-hover:scale-105">
        <svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect width="32" height="32" rx="6" fill="#0F6E84"/>
          <path d="M16 8 L24 18 H8 Z" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="12" cy="23" r="2" fill="#E07B39"/>
          <circle cx="16" cy="23" r="2" fill="#E07B39"/>
          <circle cx="20" cy="23" r="2" fill="#E07B39"/>
        </svg>
      </div>
      <!-- Wordmark -->
      <div class="logo-wordmark">
        <span class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
          GRANgoTY
        </span>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
// Logo component for GRANgoTY brand identity
</script>

<style scoped>
.logo {
  @apply transition-colors duration-200;
}
</style>