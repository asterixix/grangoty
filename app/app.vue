<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <!-- Global notification center -->
  <NotificationCenter />

  <!-- Debug panel (dev only) -->
  <LazyDevDebugPanel v-if="showDebugPanel" />
</template>

<script setup lang="ts">
const showDebugPanel = computed(() => import.meta.dev)
</script>
