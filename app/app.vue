<template>
  <NuxtErrorBoundary @error="handleError">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </NuxtErrorBoundary>

  <ClientOnly>
    <UiNotificationCenter />
  </ClientOnly>
</template>

<script setup lang="ts">
function handleError(error: Error) {
  console.error('[App Error]', error)
}
</script>
