<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Grant } from '~/types'
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts'

const { t } = useI18n({ useScope: 'global' })
const route = useRoute()
const router = useRouter()

const pageSize = 30
const savedGrants = ref<string[]>([])
const currentIndex = ref(0)
const showMobileFilters = ref(false)

const activeFilterCount = computed(() => {
  let count = 0
  if (searchQuery.value) count++
  if (selectedCategory.value) count++
  if (selectedRegion.value) count++
  if (selectedStatus.value) count++
  return count
})

const currentPage = computed({
  get: () => parseInt(route.query.page as string) || 1,
  set: (val) => router.push({ query: { ...route.query, page: val === 1 ? undefined : val } })
})
const searchQuery = computed({
  get: () => route.query.q as string || '',
  set: (val) => router.push({ query: { ...route.query, q: val || undefined, page: undefined } })
})
const selectedCategory = computed({
  get: () => route.query.category as string || '',
  set: (val) => router.push({ query: { ...route.query, category: val || undefined, page: undefined } })
})
const selectedRegion = computed({
  get: () => route.query.region as string || '',
  set: (val) => router.push({ query: { ...route.query, region: val || undefined, page: undefined } })
})
const selectedStatus = computed({
  get: () => route.query.status as string || '',
  set: (val) => router.push({ query: { ...route.query, status: val || undefined, page: undefined } })
})
const activeFilter = computed({
  get: () => route.query.activeFilter as string || '',
  set: (val) => router.push({ query: { ...route.query, activeFilter: val || undefined, page: undefined } })
})
const sortBy = computed({
  get: () => route.query.sort as string || 'deadline',
  set: (val) => router.push({ query: { ...route.query, sort: val === 'deadline' ? undefined : val, page: undefined } })
})

const { data: metaResponse } = await useAsyncData(
  'grants-metadata',
  () => $fetch<{ categories: string[]; regions: string[]; totalCount: number }>('/api/grants/metadata'),
  { default: () => ({ categories: [], regions: [], totalCount: 0 }) }
)

const categoryOptions = computed(() =>
  metaResponse.value.categories.map(cat => ({ label: cat, value: cat }))
)

const regionOptions = computed(() =>
  metaResponse.value.regions.map(reg => ({ label: reg, value: reg }))
)

const statusOptions = computed(() => [
  { label: t('status.open'), value: 'open' },
  { label: t('status.closing_soon'), value: 'closing_soon' },
  { label: t('status.closed'), value: 'closed' }
])

const apiQuery = computed(() => ({
  page: currentPage.value,
  pageSize,
  ...(searchQuery.value ? { q: searchQuery.value } : {}),
  ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
  ...(selectedRegion.value ? { region: selectedRegion.value } : {}),
  ...(selectedStatus.value ? { status: selectedStatus.value } : {}),
  ...(activeFilter.value ? { activeFilter: activeFilter.value } : {})
}))

const { data: apiResponse, pending: isLoading, refresh } = await useAsyncData(
  'grants-paginated',
  () => $fetch<{ data: Grant[]; meta: { total: number; totalPages: number } }>('/api/grants', {
    query: apiQuery.value
  }),
  { 
    default: () => ({ data: [] as Grant[], meta: { total: 0, totalPages: 0 } }),
    watch: [apiQuery]
  }
)

const paginatedGrants = computed(() => apiResponse.value?.data ?? [])
const filteredTotal = computed(() => apiResponse.value?.meta?.total ?? 0)
const totalPages = computed(() => apiResponse.value?.meta?.totalPages ?? 1)
const totalInDatabase = computed(() => metaResponse.value?.totalCount ?? 0)

useKeyboardShortcuts(paginatedGrants, currentIndex, (event: string, rank: number) => {
  if (event === 'save') handleSave(rank)
})

const hasFilters = computed(() =>
  !!(searchQuery.value || selectedCategory.value || selectedRegion.value || selectedStatus.value || activeFilter.value)
)

function clearFilters(): void {
  router.push({ query: {} })
}

function goToPage(page: number): void {
  currentPage.value = page
}

function handleSave(rank: number): void {
  const localIndex = rank - 1 - (currentPage.value - 1) * pageSize
  const grant = paginatedGrants.value[localIndex]
  if (!grant) return
  const pos = savedGrants.value.indexOf(grant.id)
  if (pos > -1) {
    savedGrants.value.splice(pos, 1)
  } else {
    savedGrants.value.push(grant.id)
  }
}

useHead({
  title: 'GRANgoTY - ' + t('home.heroTitle'),
  meta: [{ name: 'description', content: t('home.heroDescription') }]
})
</script>

<template>
  <div class="grants-page">
    <main id="main-content" role="main">
      <div class="mb-4 pb-2" style="border-bottom: 1px solid var(--color-strong-cyan-800);">
        <h1 class="text-xl sm:text-2xl font-bold" style="color: var(--color-dark-teal-500);">
          {{ t('home.openGrants') }}
        </h1>
        <p class="text-sm mt-1" style="color: var(--color-dark-teal-600);">
          {{ t('grants.resultsCount', { count: filteredTotal, total: totalInDatabase, page: currentPage, totalPages }) }}
        </p>
      </div>

      <div class="mb-4">
        <GrantsFilterBar
          v-model="activeFilter"
          :filters="[
            { value: '', label: t('filters.all') },
            { value: 'krajowe', label: t('filters.national') },
            { value: 'regionalne', label: t('filters.regional') },
            { value: 'ue', label: t('filters.ue') },
            { value: 'terminujace', label: t('filters.ending') }
          ]"
        />
      </div>

      <div class="mb-4">
        <button
          class="sm:hidden mb-2 px-3 py-1.5 text-sm font-medium rounded-lg border w-full flex justify-between items-center"
          style="background-color: var(--color-mint-cream-700); border-color: var(--color-strong-cyan-700); color: var(--color-dark-teal-600);"
          @click="showMobileFilters = !showMobileFilters"
        >
          <span>{{ t('filters.title') }} <span v-if="activeFilterCount > 0">({{ activeFilterCount }})</span></span>
          <UIcon :name="showMobileFilters ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"></UIcon>
        </button>
        <div :class="['flex flex-wrap items-center gap-2 text-sm', showMobileFilters ? 'block' : 'hidden sm:flex']">
          <UInput
            id="search"
            v-model="searchQuery"
            type="search"
            :placeholder="t('filters.searchPlaceholder')"
            size="sm"
            class="w-full sm:w-64"
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
              ></UButton>
            </template>
          </UInput>

          <UiFilterDropdown
            v-model="selectedCategory"
            :placeholder="t('filters.category')"
            :options="categoryOptions"
          ></UiFilterDropdown>

          <UiFilterDropdown
            v-model="selectedRegion"
            :placeholder="t('filters.region')"
            :options="regionOptions"
          ></UiFilterDropdown>

          <UiFilterDropdown
            v-model="selectedStatus"
            :placeholder="t('filters.status')"
            :options="statusOptions"
          ></UiFilterDropdown>

          <UiFilterDropdown
            v-model="sortBy"
            :placeholder="t('filters.sort')"
            :options="[
              { label: t('filters.sortDeadline'), value: 'deadline' },
              { label: t('filters.sortAdded'), value: 'added' }
            ]"
          ></UiFilterDropdown>

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
      </div>

      <div v-if="isLoading" class="space-y-2" role="status" aria-live="polite">
        <div v-for="i in 5" :key="i" class="animate-pulse h-20 rounded-lg" style="background-color: var(--color-strong-cyan-900);"></div>
      </div>

      <ol v-else-if="paginatedGrants.length > 0" class="space-y-1" role="list" aria-live="polite">
        <li
          v-for="(grant, index) in paginatedGrants"
          :key="grant.id"
          class="hn-list-item"
          :style="currentIndex === index ? 'outline: 2px solid var(--color-strong-cyan-500); border-radius: 0.5rem;' : ''"
        >
          <GrantsGrantCard
            :grant="grant"
            :rank="(currentPage - 1) * pageSize + index + 1"
            :is-saved="savedGrants.includes(grant.id)"
            @save="handleSave"
          ></GrantsGrantCard>
        </li>
      </ol>

      <div v-else class="py-12 text-center" role="status">
        <UIcon name="i-lucide-search" class="w-16 h-16 mx-auto mb-4" style="color: var(--color-dark-teal-700);"></UIcon>
        <h3 class="text-lg font-medium" style="color: var(--color-dark-teal-500);">{{ t('grants.noResults') }}</h3>
        <p class="mt-2 text-sm" style="color: var(--color-dark-teal-600);">{{ t('grants.noResultsDescription') }}</p>
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

      <nav v-if="totalPages > 1" class="mt-6 pt-4" style="border-top: 1px solid var(--color-strong-cyan-800);" aria-label="Pagination">
        <div class="flex justify-center items-center gap-2 text-sm">
          <NuxtLink
            v-if="currentPage > 1"
            :to="{ query: { ...route.query, page: currentPage > 2 ? currentPage - 1 : undefined } }"
            class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors duration-150"
            style="border-color: var(--color-dark-teal-700); color: var(--color-dark-teal-500);"
          >
            ‹ {{ t('common.previous') }}
          </NuxtLink>
          <span v-else class="px-3 py-1.5 rounded-lg border text-sm font-medium opacity-40 cursor-not-allowed" style="border-color: var(--color-dark-teal-700); color: var(--color-dark-teal-500);">
            ‹ {{ t('common.previous') }}
          </span>

          <span class="px-3 py-1.5 rounded-lg text-sm font-medium" style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500);">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <NuxtLink
            v-if="currentPage < totalPages"
            :to="{ query: { ...route.query, page: currentPage + 1 } }"
            class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors duration-150"
            style="border-color: var(--color-dark-teal-700); color: var(--color-dark-teal-500);"
          >
            {{ t('common.next') }} ›
          </NuxtLink>
          <span v-else class="px-3 py-1.5 rounded-lg border text-sm font-medium opacity-40 cursor-not-allowed" style="border-color: var(--color-dark-teal-700); color: var(--color-dark-teal-500);">
            {{ t('common.next') }} ›
          </span>
        </div>
      </nav>
    </main>
  </div>
</template>

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
