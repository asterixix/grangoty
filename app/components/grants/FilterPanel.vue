<template>
  <div class="filter-panel card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">{{ $t('filters.title') }}</h3>
      <button
        v-if="hasActiveFilters"
        @click="clearAll"
        class="text-sm text-primary-600 hover:text-primary-700"
      >
        {{ $t('filters.clearAll') }}
      </button>
    </div>

    <div class="space-y-4">
      <!-- Search -->
      <div>
        <label for="search" class="block text-sm font-medium text-slate-700 mb-1">
          {{ $t('filters.search') }}
        </label>
        <div class="relative">
          <input
            id="search"
            v-model="search"
            type="text"
            :placeholder="$t('filters.searchPlaceholder')"
            class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <Icon
            name="search"
            size="sm"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      <!-- Category -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          {{ $t('filters.category') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="category in categories"
            :key="category"
            @click="toggleCategory(category)"
            :class="[
              'px-3 py-1.5 rounded-full text-sm transition-colors',
              filters.category === category
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Region -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          {{ $t('filters.region') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="region in regions"
            :key="region"
            @click="toggleRegion(region)"
            :class="[
              'px-3 py-1.5 rounded-full text-sm transition-colors',
              filters.region === region
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            {{ region }}
          </button>
        </div>
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          {{ $t('filters.status') }}
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="status in ['open', 'closing_soon', 'closed', 'archived']"
            :key="status"
            @click="toggleStatus(status)"
            :class="[
              'px-3 py-1.5 rounded-full text-sm transition-colors',
              filters.status === status
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            ]"
          >
            {{ $t(`status.${status}`) }}
          </button>
        </div>
      </div>

      <!-- Amount range -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          {{ $t('filters.amount') }}
        </label>
        <div class="flex gap-2">
          <input
            v-model.number="amountMin"
            type="number"
            :placeholder="$t('filters.min')"
            class="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <span class="flex items-center text-slate-500">-</span>
          <input
            v-model.number="amountMax"
            type="number"
            :placeholder="$t('filters.max')"
            class="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFilters } from '~/app/composables/useFilters'

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