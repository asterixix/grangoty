<template>
  <nav
    role="navigation"
    aria-label="Filtry konkursów"
    class="filter-bar"
  >
    <div class="filter-scroll-container">
      <div class="filter-scroll-content">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="filter-btn"
          :class="activeFilter === filter.value ? 'filter-btn--active' : 'filter-btn--idle'"
          @click="selectFilter(filter.value)"
        >
          {{ filter.label }}
        </button>
      </div>
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
  const next = activeFilter.value === value ? null : value
  emit('update:modelValue', next)
}
</script>

<style scoped>
@reference "tailwindcss";

.filter-bar {
  @apply w-full overflow-x-auto py-2;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.filter-bar::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.filter-scroll-container {
  @apply relative;
}

.filter-scroll-content {
  @apply flex items-center gap-2 min-w-max px-2;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
  border: 1px solid transparent;
}

.filter-btn--active {
  background-color: var(--color-dark-teal-500);
  color: var(--color-mint-cream-500);
  border-color: var(--color-dark-teal-400);
}

.filter-btn--idle {
  background-color: var(--color-strong-cyan-900);
  color: var(--color-dark-teal-500);
  border-color: var(--color-strong-cyan-700);
}

.filter-btn--idle:hover {
  background-color: var(--color-strong-cyan-800);
  border-color: var(--color-strong-cyan-500);
}

.scroll-hint {
  @apply absolute right-0 top-0 bottom-0 w-8 pointer-events-none;
  background: linear-gradient(to left, var(--color-mint-cream-500), transparent);
}
</style>
