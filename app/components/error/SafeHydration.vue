<template>
  <ClientOnly>
    <template #fallback>
      <div class="safe-hydration-fallback">
        <slot name="fallback">
          <div class="animate-pulse p-4">
            <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
          </div>
        </slot>
      </div>
    </template>
    <slot />
  </ClientOnly>
</template>

<script setup lang="ts">
</script>
