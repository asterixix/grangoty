<template>
  <div class="grant-list">
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-12"
    >
      <div class="animate-spin rounded-full h-12 w-12 border-b-2" style="border-color: var(--color-strong-cyan-400);"></div>
    </div>

    <div
      v-else-if="grants.length === 0"
      class="text-center py-12"
    >
      <UiIcon name="info" size="lg" class="mx-auto h-12 w-12 mb-4" style="color: var(--color-dark-teal-700);" />
      <h3 class="text-lg font-medium" style="color: var(--color-dark-teal-500);">{{ $t('grants.noResults') }}</h3>
      <p class="mt-1" style="color: var(--color-dark-teal-700);">{{ $t('grants.noResultsDescription') }}</p>
      <button
        @click="clearFilters"
        class="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md transition-colors"
        style="background-color: var(--color-dark-teal-500); color: var(--color-mint-cream-500);"
      >
        {{ $t('filters.clearAll') }}
      </button>
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <GrantsGrantCard
        v-for="grant in grants"
        :key="grant.id"
        :grant="grant"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center">
      <nav
        class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
        aria-label="Pagination"
      >
        <button
          :disabled="page === 1"
          @click="$emit('change-page', page - 1)"
          class="relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium transition-colors"
          :style="page === 1
            ? 'border-color: var(--color-strong-cyan-800); color: var(--color-strong-cyan-700); background-color: var(--color-mint-cream-500); cursor: not-allowed;'
            : 'border-color: var(--color-strong-cyan-700); color: var(--color-dark-teal-600); background-color: var(--color-mint-cream-500);'"
        >
          <UiIcon name="chevron-left" size="sm" />
        </button>

        <span
          v-for="pageNum in totalPages <= 5 ? Array.from({ length: totalPages }, (_, i) => i + 1) : getPageNumbers()"
          :key="pageNum"
          @click="$emit('change-page', pageNum)"
          class="relative inline-flex items-center px-4 py-2 border text-sm font-medium cursor-pointer transition-colors"
          :style="page === pageNum
            ? 'z-index: 10; background-color: var(--color-strong-cyan-900); border-color: var(--color-strong-cyan-500); color: var(--color-dark-teal-500);'
            : 'border-color: var(--color-strong-cyan-800); color: var(--color-dark-teal-700); background-color: var(--color-mint-cream-500);'"
        >
          {{ pageNum }}
        </span>

        <button
          :disabled="page === totalPages"
          @click="$emit('change-page', page + 1)"
          class="relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium transition-colors"
          :style="page === totalPages
            ? 'border-color: var(--color-strong-cyan-800); color: var(--color-strong-cyan-700); background-color: var(--color-mint-cream-500); cursor: not-allowed;'
            : 'border-color: var(--color-strong-cyan-700); color: var(--color-dark-teal-600); background-color: var(--color-mint-cream-500);'"
        >
          <UiIcon name="chevron-right" size="sm" />
        </button>
      </nav>
    </div>

    <!-- Results count -->
    <div v-if="!isLoading && grants.length > 0" class="mt-4 text-sm" style="color: var(--color-dark-teal-700);">
      {{ $t('grants.resultsCount', { count: total, page, pageSize }) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Grant } from '~/types'

const props = defineProps<{
  grants: Grant[]
  isLoading: boolean
  page: number
  pageSize: number
  totalPages: number
  total: number
}>()

const emit = defineEmits<{
  (e: 'change-page', page: number): void
  (e: 'clear-filters'): void
}>()

const clearFilters = () => {
  emit('clear-filters')
}

const getPageNumbers = () => {
  const { page, totalPages } = props
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)

  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  if (start > 1) {
    numbers.unshift(1)
    if (start > 2) numbers.splice(1, 0, '...')
  }

  if (end < totalPages) {
    numbers.push(totalPages)
    if (end < totalPages - 1) numbers.splice(numbers.length - 1, 0, '...')
  }

  return numbers
}
</script>