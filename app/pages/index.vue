<template>
  <div class="grants-page">
    <!-- Skip link target -->
    <main id="main-content" role="main">
      <!-- Page Title -->
      <div class="mb-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <h1 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
          {{ t('home.openGrants') }}
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {{ t('grants.resultsCount', { count: filteredGrants.length, total: totalGrants, page: currentPage, totalPages }) }}
        </p>
      </div>

      <!-- Filter Bar -->
      <div class="mb-4">
        <FilterBar
          v-model="activeFilter"
          :filters="[
            { value: '', label: t('filters.all') || 'Wszystkie' },
            { value: 'krajowe', label: t('filters.national') || 'Krajowe' },
            { value: 'regionalne', label: t('filters.regional') || 'Regionalne' },
            { value: 'ue', label: 'UE' },
            { value: 'terminujace', label: t('filters.ending') || 'Terminujące' }
          ]"
        />
      </div>

      <!-- Search and Filters -->
      <div class="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <label for="search" class="sr-only">{{ t('filters.search') }}</label>
        <input
          id="search"
          v-model="searchQuery"
          type="search"
          :placeholder="t('filters.searchPlaceholder')"
          class="border border-neutral-300 dark:border-neutral-700 px-3 py-2 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white transition-colors duration-200"
        />

        <select
          v-model="selectedCategory"
          class="border border-neutral-300 dark:border-neutral-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white transition-colors duration-200"
          :aria-label="t('filters.category')"
        >
          <option value="">{{ t('filters.category') }}</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <select
          v-model="selectedRegion"
          class="border border-neutral-300 dark:border-neutral-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white transition-colors duration-200"
          :aria-label="t('filters.region')"
        >
          <option value="">{{ t('filters.region') }}</option>
          <option v-for="reg in regions" :key="reg" :value="reg">{{ reg }}</option>
        </select>

        <select
          v-model="selectedStatus"
          class="border border-neutral-300 dark:border-neutral-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800 dark:text-white transition-colors duration-200"
          :aria-label="t('filters.status')"
        >
          <option value="">{{ t('filters.status') }}</option>
          <option value="open">{{ t('status.open') }}</option>
          <option value="closing_soon">{{ t('status.closing_soon') }}</option>
          <option value="closed">{{ t('status.closed') }}</option>
        </select>

        <button
          v-if="hasFilters"
          @click="clearFilters"
          class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors duration-200"
        >
          {{ t('filters.clearAll') }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="py-8 text-center" role="status" aria-live="polite">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p class="mt-2 text-neutral-500 dark:text-neutral-400">{{ t('grants.loading') }}</p>
      </div>

      <!-- Grant List -->
      <ClientOnly>
        <template #fallback>
          <div class="space-y-2">
            <div v-for="i in 5" :key="i" class="animate-pulse">
              <div class="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-lg"></div>
            </div>
          </div>
        </template>
        <ol
          v-if="paginatedGrants.length > 0"
          class="space-y-1"
          role="list"
          aria-live="polite"
        >
          <li
            v-for="(grant, index) in paginatedGrants"
            :key="grant.id"
            class="hn-list-item"
            :class="{ 'ring-2 ring-primary-500 rounded-lg': currentIndex === index }"
          >
            <GrantCard
              :grant="grant"
              :rank="(currentPage - 1) * pageSize + index + 1"
              :is-saved="savedGrants.includes(grant.id)"
              @save="handleSave"
            />
          </li>
        </ol>

        <!-- Empty State -->
        <div v-else-if="!isLoading" class="py-12 text-center" role="status">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
            <UIcon name="i-lucide-search" class="w-8 h-8 text-neutral-400" />
          </div>
          <h3 class="text-lg font-medium text-neutral-900 dark:text-white">{{ t('grants.noResults') }}</h3>
          <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{{ t('grants.noResultsDescription') }}</p>
          <button
            @click="clearFilters"
            class="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
          >
            {{ t('filters.clearAll') }}
          </button>
        </div>
      </ClientOnly>

      <!-- Pagination -->
      <nav v-if="totalPages > 1" class="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800" aria-label="Pagination">
        <div class="flex justify-center items-center gap-2 text-sm">
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200"
            :aria-label="'Previous page'"
          >
            < prev
          </button>

          <span class="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200"
            :aria-label="'Next page'"
          >
            next >
          </button>
        </div>
      </nav>
    </main>

    <!-- Help Modal -->
    <div
      v-if="showHelp"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      @click.self="showHelp = false"
    >
      <div class="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-md w-full p-6 animate-slide-in-right">
        <div class="flex justify-between items-center mb-4">
          <h2 id="help-title" class="text-xl font-bold text-neutral-900 dark:text-white">
            {{ t('help.title') || 'Keyboard Shortcuts' }}
          </h2>
          <button
            @click="showHelp = false"
            class="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
          >
            <UIcon name="i-lucide-x" class="w-6 h-6" />
          </button>
        </div>
        <div class="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
          <div class="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
            <span>j / k</span>
            <span class="text-neutral-500">{{ t('help.navigate') || 'Navigate list' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
            <span>s</span>
            <span class="text-neutral-500">{{ t('help.save') || 'Save/Bookmark' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
            <span>o / Enter</span>
            <span class="text-neutral-500">{{ t('help.open') || 'Open URL' }}</span>
          </div>
          <div class="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-800">
            <span>/</span>
            <span class="text-neutral-500">{{ t('help.search') || 'Focus search' }}</span>
          </div>
          <div class="flex justify-between items-center py-2">
            <span>?</span>
            <span class="text-neutral-500">{{ t('help.help') || 'Toggle help' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import type { Grant } from '~/types'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'

const { t } = useI18n()
const localePath = useLocalePath()

// State
const grants = ref<Grant[]>([])
const isLoading = ref(true)
const currentPage = ref(1)
const pageSize = 30
const savedGrants = ref<string[]>([])
const activeFilter = ref('')
const currentIndex = ref(0)

// Filters
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedRegion = ref('')
const selectedStatus = ref('')

// Keyboard shortcuts
const { showHelp, toggleHelp } = useKeyboardShortcuts(grants, currentIndex, (event: string, rank: number) => {
  if (event === 'save') handleSave(rank)
})

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
  return searchQuery.value || selectedCategory.value || selectedRegion.value || selectedStatus.value || activeFilter.value
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

  if (activeFilter.value) {
    if (activeFilter.value === 'terminujace') {
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
      result = result.filter(g => g.deadline && new Date(g.deadline) <= sevenDaysFromNow)
    } else if (activeFilter.value) {
      result = result.filter(g => g.region.toLowerCase().includes(activeFilter.value.toLowerCase()))
    }
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
  activeFilter.value = ''
  currentPage.value = 1
}

const goToPage = (page: number) => {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

const handleSave = (rank: number) => {
  const grant = paginatedGrants.value[rank]
  if (grant) {
    const index = savedGrants.value.indexOf(grant.id)
    if (index > -1) {
      savedGrants.value.splice(index, 1)
    } else {
      savedGrants.value.push(grant.id)
    }
  }
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
  if (amount.min !== undefined && amount.max !== undefined) {
    return `${amount.min.toLocaleString()} - ${amount.max.toLocaleString()} ${amount.currency}`
  }
  if (amount.min !== undefined) {
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
watch([searchQuery, selectedCategory, selectedRegion, selectedStatus, activeFilter], () => {
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

<style scoped>
@reference "tailwindcss";

.hn-list-item {
  @apply py-2 border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200;
}
</style>