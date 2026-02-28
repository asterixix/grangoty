<template>
  <nav
    role="navigation"
    aria-label="Filtry konkursów"
    class="filter-bar"
  >
    <div class="filter-scroll-container">
      <div class="filter-scroll-content">
        <!-- Filter buttons - keyboard navigable -->
        <button
          v-for="filter in filters"
          :key="filter.value"
          :aria-pressed="activeFilter === filter.value"
          :class="[
            'filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
            activeFilter === filter.value
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
          ]"
          @click="selectFilter(filter.value)"
          @keydown.enter="selectFilter(filter.value)"
          @keydown.space="selectFilter(filter.value)"
        >
          {{ filter.label }}
        </button>
      </div>
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

.filter-btn {
  @apply focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2;
}

.scroll-hint {
  @apply absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-50 to-transparent dark:from-neutral-900 pointer-events-none;
}
</style>