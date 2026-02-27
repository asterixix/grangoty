<template>
  <div>
    <!-- Page Title -->
    <div class="mb-3 pb-2 border-b border-hn-gray/30">
      <h1 class="text-lg font-bold text-black">{{ $t('home.openGrants') }}</h1>
      <p class="text-xs text-hn-gray-dark mt-1">
        {{ $t('grants.resultsCount', { count: grants.length, total: totalGrants, page: currentPage, totalPages }) }}
      </p>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap items-center gap-2 text-xs">
      <label for="search" class="sr-only">{{ $t('filters.search') }}</label>
      <input
        id="search"
        v-model="searchQuery"
        type="search"
        :placeholder="$t('filters.searchPlaceholder')"
        class="border border-hn-gray/40 px-2 py-1 w-full sm:w-64 focus:outline-none focus:border-hn-orange"
      />
      
      <select
        v-model="selectedCategory"
        class="border border-hn-gray/40 px-2 py-1 focus:outline-none focus:border-hn-orange"
        :aria-label="$t('filters.category')"
      >
        <option value="">{{ $t('filters.category') }}</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>

      <select
        v-model="selectedRegion"
        class="border border-hn-gray/40 px-2 py-1 focus:outline-none focus:border-hn-orange"
        :aria-label="$t('filters.region')"
      >
        <option value="">{{ $t('filters.region') }}</option>
        <option v-for="reg in regions" :key="reg" :value="reg">{{ reg }}</option>
      </select>

      <select
        v-model="selectedStatus"
        class="border border-hn-gray/40 px-2 py-1 focus:outline-none focus:border-hn-orange"
        :aria-label="$t('filters.status')"
      >
        <option value="">{{ $t('filters.status') }}</option>
        <option value="open">{{ $t('status.open') }}</option>
        <option value="closing_soon">{{ $t('status.closing_soon') }}</option>
        <option value="closed">{{ $t('status.closed') }}</option>
      </select>

      <button
        v-if="hasFilters"
        @click="clearFilters"
        class="text-hn-orange hover:underline"
      >
        {{ $t('filters.clearAll') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="py-8 text-center text-hn-gray" role="status" aria-live="polite">
      <span>Loading...</span>
    </div>

    <!-- Grant List -->
    <ol v-else-if="filteredGrants.length > 0" class="space-y-1" role="list">
      <li
        v-for="(grant, index) in paginatedGrants"
        :key="grant.id"
        class="py-1"
      >
        <article class="flex items-start gap-2">
          <span class="text-hn-gray text-xs w-6 text-right flex-shrink-0" aria-hidden="true">
            {{ (currentPage - 1) * pageSize + index + 1 }}.
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-baseline gap-x-1">
              <NuxtLink
                :to="localePath(`/grant/${grant.id}`)"
                class="text-black hover:underline visited:text-hn-gray text-sm break-words"
              >
                {{ grant.title }}
              </NuxtLink>
              <span v-if="grant.website" class="text-xs text-hn-gray truncate max-w-xs">
                ({{ formatSource(grant.website) }})
              </span>
            </div>
            <div class="text-xs text-hn-gray mt-0.5 flex flex-wrap gap-x-2">
              <span v-if="grant.amount" class="inline-flex items-center gap-1">
                💰 {{ formatAmount(grant.amount) }}
              </span>
              <span v-if="grant.deadline" class="inline-flex items-center gap-1">
                📅 {{ formatDate(grant.deadline) }}
              </span>
              <span>{{ grant.region }}</span>
              <span class="text-hn-orange">{{ $t(`status.${grant.status}`) }}</span>
            </div>
          </div>
        </article>
      </li>
    </ol>

    <!-- Empty State -->
    <div v-else class="py-8 text-center" role="status">
      <p class="text-hn-gray">{{ $t('grants.noResults') }}</p>
      <p class="text-xs text-hn-gray-dark mt-1">{{ $t('grants.noResultsDescription') }}</p>
    </div>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" class="mt-4 pt-2 border-t border-hn-gray/30" aria-label="Pagination">
      <div class="flex justify-center items-center gap-2 text-xs">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-2 py-1 border border-hn-gray/40 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hn-orange hover:text-white hover:border-hn-orange"
          :aria-label="'Previous page'"
        >
          ‹ prev
        </button>
        
        <span class="px-2">
          {{ currentPage }} / {{ totalPages }}
        </span>
        
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-2 py-1 border border-hn-gray/40 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-hn-orange hover:text-white hover:border-hn-orange"
          :aria-label="'Next page'"
        >
          next ›
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import type { Grant } from '~/app/types'

const { t } = useI18n()
const localePath = useLocalePath()

// State
const grants = ref<Grant[]>([])
const isLoading = ref(true)
const currentPage = ref(1)
const pageSize = 30

// Filters
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedRegion = ref('')
const selectedStatus = ref('')

// Computed
const categories = computed(() => {
  const cats = new Set(grants.value.map(g => g.category).filter(Boolean))
  return Array.from(cats).sort()
})

const regions = computed(() => {
  const regs = new Set(grants.value.map(g => g.region).filter(Boolean))
  return Array.from(regs).sort()
})

const hasFilters = computed(() => {
  return searchQuery.value || selectedCategory.value || selectedRegion.value || selectedStatus.value
})

const filteredGrants = computed(() => {
  let result = grants.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(g => 
      g.title.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query) ||
      g.tags?.some(t => t.toLowerCase().includes(query))
    )
  }

  if (selectedCategory.value) {
    result = result.filter(g => g.category === selectedCategory.value)
  }

  if (selectedRegion.value) {
    result = result.filter(g => g.region === selectedRegion.value)
  }

  if (selectedStatus.value) {
    result = result.filter(g => g.status === selectedStatus.value)
  }

  // Sort by deadline (closing soon first)
  result = [...result].sort((a, b) => {
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  return result
})

const totalGrants = computed(() => filteredGrants.value.length)
const totalPages = computed(() => Math.ceil(totalGrants.value / pageSize))

const paginatedGrants = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredGrants.value.slice(start, start + pageSize)
})

// Methods
const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedRegion.value = ''
  selectedStatus.value = ''
  currentPage.value = 1
}

const goToPage = (page: number) => {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

const formatSource = (url: string) => {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    return hostname.length > 30 ? hostname.slice(0, 30) + '...' : hostname
  } catch {
    return url.slice(0, 30)
  }
}

const formatAmount = (amount: NonNullable<Grant['amount']>) => {
  if (amount.min && amount.max) {
    return `${amount.min.toLocaleString()} - ${amount.max.toLocaleString()} ${amount.currency}`
  }
  if (amount.min) {
    return `${amount.min.toLocaleString()} ${amount.currency}`
  }
  return amount.currency
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// Fetch grants
const fetchGrants = async () => {
  isLoading.value = true
  try {
    const response = await $fetch('/api/grants')
    grants.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch grants:', error)
    grants.value = []
  } finally {
    isLoading.value = false
  }
}

// Reset page when filters change
watch([searchQuery, selectedCategory, selectedRegion, selectedStatus], () => {
  currentPage.value = 1
})

// Fetch on mount
onMounted(() => {
  fetchGrants()
})

// SEO
useHead({
  title: 'GRANgoTY - ' + t('home.heroTitle'),
  meta: [
    { name: 'description', content: t('home.heroDescription') }
  ]
})
</script>
