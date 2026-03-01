<template>
  <nav
    role="navigation"
    aria-label="Filtry konkursów"
    class="filter-bar"
  >
    <div class="filter-scroll-container">
      <UButtonGroup class="filter-scroll-content">
        <UButton
          v-for="filter in filters"
          :key="filter.value"
          :color="activeFilter === filter.value ? 'primary' : 'neutral'"
          :variant="activeFilter === filter.value ? 'solid' : 'soft'"
          size="sm"
          class="filter-btn"
          @click="selectFilter(filter.value)"
        >
          {{ filter.label }}
        </UButton>
      </UButtonGroup>
      <!-- Scroll hint for mobile -->
      <div class="scroll-hint" aria-hidden="true"></div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface FilterOption {
  value: string
  label: string
}

const props = defineProps<{
  filters: FilterOption[]
  modelValue: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const activeFilter = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function selectFilter(value: string | null): void {
  if (activeFilter.value === value) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', value)
  }
}
</script>

<style scoped>
@reference "tailwindcss";

.filter-bar {
  @apply w-full overflow-x-auto scrollbar-hide py-2;
  -webkit-overflow-scrolling: touch;
}

.filter-scroll-container {
  @apply relative;
}

.filter-scroll-content {
  @apply flex items-center gap-2 min-w-max px-2;
}

.scroll-hint {
  @apply absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-50 to-transparent dark:from-neutral-900 pointer-events-none;
}
</style>
