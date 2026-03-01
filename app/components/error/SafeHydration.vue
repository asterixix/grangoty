<template>
  <ClientOnly>
    <template #fallback>
      <div class="safe-hydration-fallback">
        <slot name="fallback">
          <div class="animate-pulse p-4">
            <div class="h-4 rounded w-3/4 mb-2" style="background-color: var(--color-strong-cyan-900);"></div>
            <div class="h-4 rounded w-1/2" style="background-color: var(--color-strong-cyan-900);"></div>
          </div>
        </slot>
      </div>
    </template>
    <slot />
  </ClientOnly>
</template>

<script setup lang="ts">
</script>
