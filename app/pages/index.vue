<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Skip Link -->
    <SkipLink />

    <!-- Header -->
    <Header />

    <!-- Main Content -->
    <main id="main-content" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          {{ $t('home.heroTitle') }}
        </h1>
        <p class="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
          {{ $t('home.heroDescription') }}
        </p>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div class="text-3xl font-bold text-primary-600">{{ statusCounts.open }}</div>
            <div class="text-sm text-slate-600 mt-1">{{ $t('home.openGrants') }}</div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div class="text-3xl font-bold text-primary-600">{{ statusCounts.closing_soon }}</div>
            <div class="text-sm text-slate-600 mt-1">{{ $t('home.closingSoon') }}</div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div class="text-3xl font-bold text-primary-600">{{ statusCounts.total }}</div>
            <div class="text-sm text-slate-600 mt-1">{{ $t('home.totalGrants') }}</div>
          </div>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div class="text-3xl font-bold text-primary-600">{{ regions.length }}</div>
            <div class="text-sm text-slate-600 mt-1">{{ $t('home.regions') }}</div>
          </div>
        </div>
      </div>

      <!-- Content Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar -->
        <div class="lg:col-span-1">
          <FilterPanel
            v-model:search="search"
            v-model:category="category"
            v-model:region="region"
            v-model:status="status"
            v-model:amountMin="amountMin"
            v-model:amountMax="amountMax"
            :categories="categories"
            :regions="regions"
            @clear="clearFilters"
          />
        </div>

        <!-- Main Feed -->
        <div class="lg:col-span-3">
          <GrantList
            :grants="paginatedGrants"
            :isLoading="isLoading"
            :page="pagination.page"
            :pageSize="pagination.pageSize"
            :totalPages="totalPages"
            :total="pagination.total"
            @change-page="fetchGrants"
            @clear-filters="clearFilters"
          />
        </div>
      </div>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useGrants } from '~/app/composables/useGrants'
import { useFilters } from '~/app/composables/useFilters'

const {
  grants,
  isLoading,
  error,
  filters,
  pagination,
  filteredGrants,
  totalPages,
  categories,
  regions,
  statusCounts,
  fetchGrants,
  clearFilters
} = useGrants()

const {
  updateSearch,
  updateCategory,
  updateRegion,
  updateStatus
} = useFilters()

// Computed for filter bindings
const search = computed({
  get: () => filters.search,
  set: (value) => updateSearch(value)
})

const category = computed({
  get: () => filters.category,
  set: (value) => updateCategory(value)
})

const region = computed({
  get: () => filters.region,
  set: (value) => updateRegion(value)
})

const status = computed({
  get: () => filters.status,
  set: (value) => updateStatus(value)
})

const amountMin = computed({
  get: () => filters.amount.min,
  set: (value) => filters.amount.min = value
})

const amountMax = computed({
  get: () => filters.amount.max,
  set: (value) => filters.amount.max = value
})

const paginatedGrants = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredGrants.value.slice(start, start + pagination.pageSize)
})

onMounted(() => {
  fetchGrants()
})
</script>