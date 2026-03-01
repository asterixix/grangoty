<template>
  <div class="filter-panel card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold" style="color: var(--color-dark-teal-500);">{{ $t('filters.title') }}</h3>
      <button
        v-if="hasActiveFilters"
        @click="clearAll"
        class="text-sm transition-colors"
        style="color: var(--color-strong-cyan-400);"
      >
        {{ $t('filters.clearAll') }}
      </button>
    </div>

    <div class="space-y-4">
      <!-- Search -->
      <div>
        <label for="search" class="block text-sm font-medium mb-1" style="color: var(--color-dark-teal-600);">
          {{ $t('filters.search') }}
        </label>
        <div class="relative">
          <input
            id="search"
            v-model="search"
            type="text"
            :placeholder="$t('filters.searchPlaceholder')"
            class="w-full pl-10 pr-4 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
            style="border-color: var(--color-strong-cyan-700); color: var(--color-dark-teal-500); background-color: var(--color-mint-cream-500);"
          />
          <Icon
            name="search"
            size="sm"
            class="absolute left-3 top-1/2 -translate-y-1/2"
            style="color: var(--color-dark-teal-700);"
          />
        </div>
      </div>

      <!-- Category -->
      <div>
        <label class="block text-sm font-medium mb-2" style="color: var(--color-dark-teal-600);">
          {{ $t('filters.category') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="category in categories"
            :key="category"
            @click="toggleCategory(category)"
            class="px-3 py-1.5 rounded-full text-sm transition-colors border"
            :style="filters.category === category
              ? 'background-color: var(--color-dark-teal-500); color: var(--color-mint-cream-500); border-color: var(--color-dark-teal-500);'
              : 'background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500); border-color: var(--color-strong-cyan-700);'"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Region -->
      <div>
        <label class="block text-sm font-medium mb-2" style="color: var(--color-dark-teal-600);">
          {{ $t('filters.region') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="region in regions"
            :key="region"
            @click="toggleRegion(region)"
            class="px-3 py-1.5 rounded-full text-sm transition-colors border"
            :style="filters.region === region
              ? 'background-color: var(--color-dark-teal-500); color: var(--color-mint-cream-500); border-color: var(--color-dark-teal-500);'
              : 'background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500); border-color: var(--color-strong-cyan-700);'"
          >
            {{ region }}
          </button>
        </div>
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium mb-2" style="color: var(--color-dark-teal-600);">
          {{ $t('filters.status') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="status in ['open', 'closing_soon', 'closed', 'archived']"
            :key="status"
            @click="toggleStatus(status)"
            class="px-3 py-1.5 rounded-full text-sm transition-colors border"
            :style="filters.status === status
              ? 'background-color: var(--color-dark-teal-500); color: var(--color-mint-cream-500); border-color: var(--color-dark-teal-500);'
              : 'background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500); border-color: var(--color-strong-cyan-700);'"
          >
            {{ $t(`status.${status}`) }}
          </button>
        </div>
      </div>

      <!-- Amount range -->
      <div>
        <label class="block text-sm font-medium mb-2" style="color: var(--color-dark-teal-600);">
          {{ $t('filters.amount') }}
        </label>
        <div class="flex gap-2">
          <input
            v-model.number="amountMin"
            type="number"
            :placeholder="$t('filters.min')"
            class="flex-1 px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
            style="border-color: var(--color-strong-cyan-700); color: var(--color-dark-teal-500); background-color: var(--color-mint-cream-500);"
          />
          <span class="flex items-center text-sm" style="color: var(--color-dark-teal-700);">-</span>
          <input
            v-model.number="amountMax"
            type="number"
            :placeholder="$t('filters.max')"
            class="flex-1 px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2"
            style="border-color: var(--color-strong-cyan-700); color: var(--color-dark-teal-500); background-color: var(--color-mint-cream-500);"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilters } from '~/composables/useFilters'

const props = defineProps<{
  categories: string[]
  regions: string[]
}>()

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'update:category', value: string | null): void
  (e: 'update:region', value: string | null): void
  (e: 'update:status', value: string | null): void
  (e: 'update:amountMin', value: number | undefined): void
  (e: 'update:amountMax', value: number | undefined): void
  (e: 'clear'): void
}>()

const {
  filters,
  hasActiveFilters,
  clearAll,
  toggleCategory,
  toggleRegion,
  toggleStatus
} = useFilters()

// Local refs for two-way binding
const search = computed({
  get: () => filters.search,
  set: (value) => emit('update:search', value)
})

const amountMin = computed({
  get: () => filters.amount.min,
  set: (value) => emit('update:amountMin', value)
})

const amountMax = computed({
  get: () => filters.amount.max,
  set: (value) => emit('update:amountMax', value)
})
</script>