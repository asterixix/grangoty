<template>
  <NuxtErrorBoundary @error="handleError">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </NuxtErrorBoundary>

  <ClientOnly>
    <NotificationCenter />
  </ClientOnly>

  <LazyDevDebugPanel v-if="showDebugPanel" />
</template>

<script setup lang="ts">
const showDebugPanel = computed(() => import.meta.dev)

function handleError(error: Error) {
  console.error('[App Error]', error)
}
</script>
