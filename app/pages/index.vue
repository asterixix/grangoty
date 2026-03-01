<template>
  <div class="grants-page">
    <main id="main-content" role="main">
      <div
        class="mb-4 pb-2"
        style="border-bottom: 1px solid var(--color-strong-cyan-800);"
      >
        <h1 class="text-xl sm:text-2xl font-bold" style="color: var(--color-dark-teal-500);">
          {{ t('home.openGrants') }}
        </h1>
        <p class="text-sm mt-1" style="color: var(--color-dark-teal-600);">
          {{ t('grants.resultsCount', { count: filteredGrants.length, total: totalInDatabase, page: currentPage, totalPages }) }}
        </p>
      </div>

      <div class="mb-4">
        <GrantsFilterBar
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

      <div class="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <UInput
          id="search"
          v-model="searchQuery"
          type="search"
          :placeholder="t('filters.searchPlaceholder')"
          size="sm"
          class="w-full sm:w-64"
          :ui="{ icon: { trailing: { pointer: '' } } }"
        >
          <template #trailing>
            <UButton
              v-if="searchQuery"
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-x"
              class="pointer-events-auto"
              @click="searchQuery = ''"
            />
          </template>
        </UInput>

        <UiFilterDropdown
          v-model="selectedCategory"
          :placeholder="t('filters.category')"
          :options="categoryOptions"
        />

        <UiFilterDropdown
          v-model="selectedRegion"
          :placeholder="t('filters.region')"
          :options="regionOptions"
        />

        <UiFilterDropdown
          v-model="selectedStatus"
          :placeholder="t('filters.status')"
          :options="statusOptions"
        />

        <UButton
          v-if="hasFilters"
          variant="ghost"
          size="sm"
          style="color: var(--color-grapefruit-pink-500);"
          @click="clearFilters"
        >
          {{ t('filters.clearAll') }}
        </UButton>
      </div>

      <div
        v-if="isLoading"
        class="space-y-2"
        role="status"
        aria-live="polite"
      >
        <div
          v-for="i in 5"
          :key="i"
          class="animate-pulse h-20 rounded-lg"
          style="background-color: var(--color-strong-cyan-900);"
        />
      </div>

      <ol
        v-else-if="paginatedGrants.length > 0"
        class="space-y-1"
        role="list"
        aria-live="polite"
      >
        <li
          v-for="(grant, index) in paginatedGrants"
          :key="grant.id"
          class="hn-list-item"
          :style="currentIndex === index
            ? 'outline: 2px solid var(--color-strong-cyan-500); border-radius: 0.5rem;'
            : ''"
        >
          <GrantsGrantCard
            :grant="grant"
            :rank="(currentPage - 1) * pageSize + index + 1"
            :is-saved="savedGrants.includes(grant.id)"
            @save="handleSave"
          />
        </li>
      </ol>

      <div
        v-else
        class="py-12 text-center"
        role="status"
      >
        <UIcon name="i-lucide-search" class="w-16 h-16 mx-auto mb-4" style="color: var(--color-dark-teal-700);" />
        <h3 class="text-lg font-medium" style="color: var(--color-dark-teal-500);">
          {{ t('grants.noResults') }}
        </h3>
        <p class="mt-2 text-sm" style="color: var(--color-dark-teal-600);">
          {{ t('grants.noResultsDescription') }}
        </p>
        <button
          class="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
          style="background-color: var(--color-strong-cyan-500); color: white;"
          @mouseenter="(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-strong-cyan-400)'"
          @mouseleave="(e) => (e.target as HTMLElement).style.backgroundColor = 'var(--color-strong-cyan-500)'"
          @click="clearFilters"
        >
          {{ t('filters.clearAll') }}
        </button>
      </div>

      <nav
        v-if="totalPages > 1"
        class="mt-6 pt-4"
        style="border-top: 1px solid var(--color-strong-cyan-800);"
        aria-label="Pagination"
      >
        <div class="flex justify-center items-center gap-2 text-sm">
          <button
            class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors duration-150 disabled:opacity-40"
            :disabled="currentPage === 1"
            style="border-color: var(--color-dark-teal-700); color: var(--color-dark-teal-500);"
            @click="goToPage(currentPage - 1)"
          >
            ‹ {{ t('common.previous') }}
          </button>

          <span
            class="px-3 py-1.5 rounded-lg text-sm font-medium"
            style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500);"
          >
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors duration-150 disabled:opacity-40"
            :disabled="currentPage === totalPages"
            style="border-color: var(--color-dark-teal-700); color: var(--color-dark-teal-500);"
            @click="goToPage(currentPage + 1)"
          >
            {{ t('common.next') }} ›
          </button>
        </div>
      </nav>
    </main>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Grant } from '~/types'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'

const { t } = useI18n()

const currentPage = ref(1)
const pageSize = 30
const savedGrants = ref<string[]>([])
const activeFilter = ref('')
const currentIndex = ref(0)

const searchQuery = ref('')
const selectedCategory = ref('')
const selectedRegion = ref('')
const selectedStatus = ref('')

const { data: apiResponse, pending: isLoading } = await useAsyncData(
  'grants',
  () => $fetch<{ data: Grant[]; meta: { total: number } }>('/api/grants', {
    query: { pageSize: 1000 }
  }),
  { default: () => ({ data: [] as Grant[], meta: { total: 0 } }) }
)

const grants = computed(() => apiResponse.value?.data ?? [])
const totalInDatabase = computed(() => apiResponse.value?.meta?.total ?? grants.value.length)

useKeyboardShortcuts(grants, currentIndex, (event: string, rank: number) => {
  if (event === 'save') handleSave(rank)
})

const categories = computed(() => {
  const cats = new Set(grants.value.map(g => g.category).filter(Boolean))
  return Array.from(cats).sort()
})

const regions = computed(() => {
  const regs = new Set(grants.value.map(g => g.region).filter(Boolean))
  return Array.from(regs).sort()
})

const categoryOptions = computed(() =>
  categories.value.map(cat => ({ label: cat, value: cat }))
)

const regionOptions = computed(() =>
  regions.value.map(reg => ({ label: reg, value: reg }))
)

const statusOptions = computed(() => [
  { label: t('status.open'), value: 'open' },
  { label: t('status.closing_soon'), value: 'closing_soon' },
  { label: t('status.closed'), value: 'closed' }
])

const hasFilters = computed(() =>
  !!(searchQuery.value || selectedCategory.value || selectedRegion.value || selectedStatus.value || activeFilter.value)
)

const filteredGrants = computed(() => {
  let result = grants.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(g =>
      g.title.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query) ||
      g.tags?.some(tag => tag.toLowerCase().includes(query))
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
    } else {
      result = result.filter(g => g.region.toLowerCase().includes(activeFilter.value.toLowerCase()))
    }
  }

  return [...result].sort((a, b) => {
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })
})

const totalGrants = computed(() => filteredGrants.value.length)
const totalPages = computed(() => Math.ceil(totalGrants.value / pageSize))

const paginatedGrants = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredGrants.value.slice(start, start + pageSize)
})

function clearFilters(): void {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedRegion.value = ''
  selectedStatus.value = ''
  activeFilter.value = ''
  currentPage.value = 1
}

function goToPage(page: number): void {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

function handleSave(rank: number): void {
  const index = rank - 1 - (currentPage.value - 1) * pageSize
  const grant = paginatedGrants.value[index]
  if (!grant) return
  const pos = savedGrants.value.indexOf(grant.id)
  if (pos > -1) {
    savedGrants.value.splice(pos, 1)
  } else {
    savedGrants.value.push(grant.id)
  }
}

watch([searchQuery, selectedCategory, selectedRegion, selectedStatus, activeFilter], () => {
  currentPage.value = 1
})

useHead({
  title: 'GRANgoTY - ' + t('home.heroTitle'),
  meta: [{ name: 'description', content: t('home.heroDescription') }]
})
</script>

<style scoped>
@reference "tailwindcss";

.hn-list-item {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-strong-cyan-900);
  transition: background-color 0.15s;
}

.hn-list-item:hover {
  background-color: var(--color-strong-cyan-900);
}
</style>

