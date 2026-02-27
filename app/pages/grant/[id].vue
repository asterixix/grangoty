<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="py-8 text-center text-hn-gray">
      Loading...
    </div>

    <!-- Not Found State -->
    <div v-else-if="!grant" class="py-8 text-center">
      <h1 class="text-lg text-hn-gray">{{ $t('grants.notFound') }}</h1>
      <p class="text-xs text-hn-gray-dark mt-1">{{ $t('grants.notFoundDescription') }}</p>
      <NuxtLink :to="localePath('/')" class="text-hn-orange hover:underline text-sm mt-2 inline-block">
        {{ $t('grants.backToFeed') }}
      </NuxtLink>
    </div>

    <!-- Grant Detail -->
    <article v-else class="max-w-3xl">
      <!-- Back Link -->
      <nav class="mb-3" aria-label="Breadcrumb">
        <NuxtLink :to="localePath('/')" class="text-xs text-hn-gray hover:underline">
          ‹ {{ $t('grants.backToFeed') }}
        </NuxtLink>
      </nav>

      <!-- Title -->
      <h1 class="text-lg font-bold text-black mb-2 leading-snug">
        {{ grant.title }}
      </h1>

      <!-- Meta Info -->
      <div class="text-xs text-hn-gray mb-4 flex flex-wrap gap-x-3 gap-y-1">
        <span>{{ grant.source }}</span>
        <span>|</span>
        <span>{{ grant.region }}</span>
        <span>|</span>
        <span class="text-hn-orange">{{ $t(`status.${grant.status}`) }}</span>
        <span v-if="grant.scrapedAt">|</span>
        <span v-if="grant.scrapedAt">{{ $t('grants.lastVerified', { date: formatDate(grant.scrapedAt) }) }}</span>
      </div>

      <!-- Key Details Table -->
      <div class="bg-white border border-hn-gray/30 mb-4">
        <dl class="divide-y divide-hn-gray/20">
          <div v-if="grant.amount" class="grid grid-cols-3 gap-2 px-3 py-2">
            <dt class="text-xs font-medium text-hn-gray-dark">{{ $t('grants.amount') }}</dt>
            <dd class="col-span-2 text-sm">{{ formatAmount(grant.amount) }}</dd>
          </div>
          <div v-if="grant.deadline" class="grid grid-cols-3 gap-2 px-3 py-2">
            <dt class="text-xs font-medium text-hn-gray-dark">{{ $t('grants.deadline') }}</dt>
            <dd class="col-span-2 text-sm">{{ formatDate(grant.deadline) }}</dd>
          </div>
          <div class="grid grid-cols-3 gap-2 px-3 py-2">
            <dt class="text-xs font-medium text-hn-gray-dark">{{ $t('grants.category') }}</dt>
            <dd class="col-span-2 text-sm">{{ grant.category }}</dd>
          </div>
          <div class="grid grid-cols-3 gap-2 px-3 py-2">
            <dt class="text-xs font-medium text-hn-gray-dark">{{ $t('grants.region') }}</dt>
            <dd class="col-span-2 text-sm">{{ grant.region }}</dd>
          </div>
          <div v-if="grant.website" class="grid grid-cols-3 gap-2 px-3 py-2">
            <dt class="text-xs font-medium text-hn-gray-dark">{{ $t('common.visitSource') }}</dt>
            <dd class="col-span-2 text-sm">
              <a 
                :href="grant.website" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-hn-orange hover:underline break-all"
              >
                {{ grant.website }}
              </a>
            </dd>
          </div>
        </dl>
      </div>

      <!-- Description -->
      <div class="mb-4">
        <h2 class="text-xs font-medium text-hn-gray-dark mb-1">{{ $t('grants.description') }}</h2>
        <p class="text-sm text-black leading-relaxed whitespace-pre-line">
          {{ grant.description || 'No description available.' }}
        </p>
      </div>

      <!-- Eligibility -->
      <div v-if="grant.eligibility?.length" class="mb-4">
        <h2 class="text-xs font-medium text-hn-gray-dark mb-1">{{ $t('grants.eligibility') }}</h2>
        <ul class="text-sm text-black list-disc list-inside space-y-0.5">
          <li v-for="(item, index) in grant.eligibility" :key="index">{{ item }}</li>
        </ul>
      </div>

      <!-- Tags -->
      <div v-if="grant.tags?.length" class="mb-4">
        <h2 class="text-xs font-medium text-hn-gray-dark mb-1">{{ $t('grants.tags') }}</h2>
        <div class="flex flex-wrap gap-1">
          <span 
            v-for="tag in grant.tags" 
            :key="tag"
            class="text-xs bg-hn-gray/20 text-hn-gray-dark px-1.5 py-0.5"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Contact -->
      <div v-if="grant.contact" class="mb-4 border-t border-hn-gray/30 pt-3">
        <h2 class="text-xs font-medium text-hn-gray-dark mb-2">{{ $t('grants.contact') }}</h2>
        <div class="text-sm space-y-1">
          <p v-if="grant.contact.email">
            <span class="text-hn-gray">{{ $t('grants.email') }}:</span>
            <a :href="`mailto:${grant.contact.email}`" class="text-hn-orange hover:underline ml-1">
              {{ grant.contact.email }}
            </a>
          </p>
          <p v-if="grant.contact.phone">
            <span class="text-hn-gray">{{ $t('grants.phone') }}:</span>
            <a :href="`tel:${grant.contact.phone}`" class="text-hn-orange hover:underline ml-1">
              {{ grant.contact.phone }}
            </a>
          </p>
          <p v-if="grant.contact.address">
            <span class="text-hn-gray">{{ $t('grants.address') }}:</span>
            <span class="ml-1">{{ grant.contact.address }}</span>
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-2 pt-3 border-t border-hn-gray/30">
        <a
          v-if="grant.website"
          :href="grant.website"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 px-3 py-1.5 bg-hn-orange text-white text-xs font-medium hover:bg-hn-orange-dark focus:outline-none focus:ring-2 focus:ring-hn-orange focus:ring-offset-2"
        >
          {{ $t('grants.visitWebsite') }} ↗
        </a>
        <NuxtLink
          :to="localePath('/')"
          class="inline-flex items-center gap-1 px-3 py-1.5 border border-hn-gray text-xs text-hn-gray-dark hover:border-hn-orange hover:text-hn-orange"
        >
          ‹ {{ $t('grants.backToFeed') }}
        </NuxtLink>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { Grant } from '~/app/types'

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const grant = ref<Grant | null>(null)
const isLoading = ref(true)

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
    return date.toLocaleDateString('pl-PL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  } catch {
    return dateStr
  }
}

const fetchGrant = async () => {
  isLoading.value = true
  try {
    const id = route.params.id as string
    const response = await $fetch(`/api/grants/${id}`)
    grant.value = response
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

// SEO
useHead(() => ({
  title: grant.value ? `${grant.value.title} - GRANgoTY` : 'GRANgoTY',
  meta: [
    { 
      name: 'description', 
      content: grant.value?.description?.slice(0, 160) || t('home.heroDescription')
    }
  ]
}))
</script>
