<template>
  <div>
    <div
      v-if="isLoading"
      class="py-8 text-center"
      style="color: var(--color-dark-teal-600);"
    >
      Loading…
    </div>

    <div v-else-if="!grant" class="py-8 text-center">
      <h1 class="text-lg" style="color: var(--color-dark-teal-600);">{{ $t('grants.notFound') }}</h1>
      <p class="text-xs mt-1" style="color: var(--color-dark-teal-700);">{{ $t('grants.notFoundDescription') }}</p>
      <NuxtLink
        :to="localePath('/')"
        class="text-sm mt-2 inline-block hover:underline"
        style="color: var(--color-strong-cyan-400);"
      >
        {{ $t('grants.backToFeed') }}
      </NuxtLink>
    </div>

    <article v-else class="max-w-3xl">
      <nav class="mb-3" aria-label="Breadcrumb">
        <NuxtLink
          :to="localePath('/')"
          class="text-xs hover:underline"
          style="color: var(--color-dark-teal-600);"
        >
          ‹ {{ $t('grants.backToFeed') }}
        </NuxtLink>
      </nav>

      <h1 class="text-lg font-bold mb-2 leading-snug" style="color: var(--color-dark-teal-500);">
        {{ grant.title }}
      </h1>

      <div class="text-xs mb-4 flex flex-wrap gap-x-3 gap-y-1" style="color: var(--color-dark-teal-600);">
        <span>{{ grant.source }}</span>
        <span>|</span>
        <span>{{ grant.region }}</span>
        <span>|</span>
        <span style="color: var(--color-strong-cyan-400);">{{ $t(`status.${grant.status}`) }}</span>
        <template v-if="grant.scrapedAt">
          <span>|</span>
          <span>{{ $t('grants.lastVerified', { date: formatDate(grant.scrapedAt) }) }}</span>
        </template>
      </div>

      <div
        class="mb-4 rounded-lg overflow-hidden"
        style="border: 1px solid var(--color-strong-cyan-800);"
      >
        <dl>
          <div
            v-if="grant.amount"
            class="grid grid-cols-3 gap-2 px-3 py-2"
            style="border-bottom: 1px solid var(--color-strong-cyan-900);"
          >
            <dt class="text-xs font-medium" style="color: var(--color-dark-teal-600);">{{ $t('grants.amount') }}</dt>
            <dd class="col-span-2 text-sm font-semibold" style="color: var(--color-strong-cyan-400);">
              {{ formatAmount(grant.amount) }}
            </dd>
          </div>
          <div
            v-if="grant.deadline"
            class="grid grid-cols-3 gap-2 px-3 py-2"
            style="border-bottom: 1px solid var(--color-strong-cyan-900);"
          >
            <dt class="text-xs font-medium" style="color: var(--color-dark-teal-600);">{{ $t('grants.deadline') }}</dt>
            <dd class="col-span-2 text-sm" style="color: var(--color-dark-teal-500);">{{ formatDate(grant.deadline) }}</dd>
          </div>
          <div
            class="grid grid-cols-3 gap-2 px-3 py-2"
            style="border-bottom: 1px solid var(--color-strong-cyan-900);"
          >
            <dt class="text-xs font-medium" style="color: var(--color-dark-teal-600);">{{ $t('grants.category') }}</dt>
            <dd class="col-span-2 text-sm" style="color: var(--color-dark-teal-500);">{{ grant.category }}</dd>
          </div>
          <div
            class="grid grid-cols-3 gap-2 px-3 py-2"
            style="border-bottom: 1px solid var(--color-strong-cyan-900);"
          >
            <dt class="text-xs font-medium" style="color: var(--color-dark-teal-600);">{{ $t('grants.region') }}</dt>
            <dd class="col-span-2 text-sm" style="color: var(--color-dark-teal-500);">{{ grant.region }}</dd>
          </div>
          <div v-if="grant.website" class="grid grid-cols-3 gap-2 px-3 py-2">
            <dt class="text-xs font-medium" style="color: var(--color-dark-teal-600);">{{ $t('common.visitSource') }}</dt>
            <dd class="col-span-2 text-sm">
              <a
                :href="grant.website"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:underline break-all"
                style="color: var(--color-strong-cyan-400);"
              >
                {{ grant.website }}
              </a>
            </dd>
          </div>
        </dl>
      </div>

      <div class="mb-4">
        <h2 class="text-xs font-medium mb-1" style="color: var(--color-dark-teal-600);">{{ $t('grants.description') }}</h2>
        <p class="text-sm leading-relaxed whitespace-pre-line" style="color: var(--color-dark-teal-500);">
          {{ grant.description || 'No description available.' }}
        </p>
      </div>

      <div v-if="grant.eligibility?.length" class="mb-4">
        <h2 class="text-xs font-medium mb-1" style="color: var(--color-dark-teal-600);">{{ $t('grants.eligibility') }}</h2>
        <ul class="text-sm list-disc list-inside space-y-0.5" style="color: var(--color-dark-teal-500);">
          <li v-for="(item, index) in grant.eligibility" :key="index">{{ item }}</li>
        </ul>
      </div>

      <div v-if="grant.tags?.length" class="mb-4">
        <h2 class="text-xs font-medium mb-1" style="color: var(--color-dark-teal-600);">{{ $t('grants.tags') }}</h2>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="tag in grant.tags"
            :key="tag"
            class="text-xs px-1.5 py-0.5 rounded-full"
            style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500); border: 1px solid var(--color-strong-cyan-700);"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <div
        v-if="grant.contact"
        class="mb-4 pt-3"
        style="border-top: 1px solid var(--color-strong-cyan-800);"
      >
        <h2 class="text-xs font-medium mb-2" style="color: var(--color-dark-teal-600);">{{ $t('grants.contact') }}</h2>
        <div class="text-sm space-y-1">
          <p v-if="grant.contact.email">
            <span style="color: var(--color-dark-teal-600);">{{ $t('grants.email') }}:</span>
            <a
              :href="`mailto:${grant.contact.email}`"
              class="hover:underline ml-1"
              style="color: var(--color-strong-cyan-400);"
            >
              {{ grant.contact.email }}
            </a>
          </p>
          <p v-if="grant.contact.phone">
            <span style="color: var(--color-dark-teal-600);">{{ $t('grants.phone') }}:</span>
            <a
              :href="`tel:${grant.contact.phone}`"
              class="hover:underline ml-1"
              style="color: var(--color-strong-cyan-400);"
            >
              {{ grant.contact.phone }}
            </a>
          </p>
          <p v-if="grant.contact.address">
            <span style="color: var(--color-dark-teal-600);">{{ $t('grants.address') }}:</span>
            <span class="ml-1" style="color: var(--color-dark-teal-500);">{{ grant.contact.address }}</span>
          </p>
        </div>
      </div>

      <div
        class="flex flex-wrap gap-2 pt-3"
        style="border-top: 1px solid var(--color-strong-cyan-800);"
      >
        <a
          v-if="grant.website"
          :href="grant.website"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition-colors duration-150"
          style="background-color: var(--color-dark-teal-500); color: var(--color-mint-cream-500);"
        >
          {{ $t('grants.visitWebsite') }} ↗
        </a>
        <NuxtLink
          :to="localePath('/')"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border transition-colors duration-150"
          style="border-color: var(--color-dark-teal-700); color: var(--color-dark-teal-600);"
        >
          ‹ {{ $t('grants.backToFeed') }}
        </NuxtLink>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { Grant } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const grant = ref<Grant | null>(null)
const isLoading = ref(true)

function formatAmount(amount: NonNullable<Grant['amount']>): string {
  if (amount.min && amount.max) {
    return `${amount.min.toLocaleString()} – ${amount.max.toLocaleString()} ${amount.currency}`
  }
  if (amount.min) {
    return `${amount.min.toLocaleString()} ${amount.currency}`
  }
  return amount.currency
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

async function fetchGrant(): Promise<void> {
  isLoading.value = true
  try {
    const id = route.params.id as string
    const response = await $fetch(`/api/grants/${id}`)
    grant.value = response as Grant
  } catch (error) {
    console.error('Failed to fetch grant:', error)
    grant.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchGrant()
})

useHead(() => ({
  title: grant.value ? `${grant.value.title} - GRANgoTY` : 'GRANgoTY',
  meta: [{ name: 'description', content: grant.value?.description?.slice(0, 160) || t('home.heroDescription') }]
}))
</script>
