<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Skip Link -->
    <SkipLink />

    <!-- Header -->
    <Header />

    <!-- Main Content -->
    <main id="main-content" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="!grant" class="text-center py-12">
        <h2 class="text-2xl font-bold text-slate-900">{{ $t('grants.notFound') }}</h2>
        <p class="mt-2 text-slate-600">{{ $t('grants.notFoundDescription') }}</p>
        <NuxtLink
          to="/"
          class="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          {{ $t('grants.backToFeed') }}
        </NuxtLink>
      </div>

      <div v-else class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-primary-600 to-accent-500 px-6 py-8 text-white">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <Badge variant="neutral" class="bg-white/20 text-white">
                {{ grant.source }}
              </Badge>
              <Badge :variant="statusBadgeVariant" class="bg-white text-primary-700">
                {{ $t(`status.${grant.status}`) }}
              </Badge>
            </div>
            <div class="text-right">
              <p class="text-sm opacity-90">{{ formatDate(grant.scrapedAt) }}</p>
              <p class="text-sm opacity-75">
                {{ $t('grants.lastVerified', { date: grant.lastVerifiedAt ? formatDate(grant.lastVerifiedAt) : 'N/A' }) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="px-6 py-8">
          <h1 class="text-3xl font-bold text-slate-900 mb-4">
            {{ grant.title }}
          </h1>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-medium text-slate-500 mb-1">{{ $t('grants.description') }}</h3>
                <p class="text-slate-700 leading-relaxed">{{ grant.description }}</p>
              </div>

              <div v-if="grant.amount" class="bg-slate-50 rounded-lg p-4">
                <h3 class="text-sm font-medium text-slate-500 mb-2">{{ $t('grants.amount') }}</h3>
                <p class="text-lg font-semibold text-slate-900">{{ formatAmount(grant.amount) }}</p>
              </div>

              <div v-if="grant.deadline" class="bg-slate-50 rounded-lg p-4">
                <h3 class="text-sm font-medium text-slate-500 mb-2">{{ $t('grants.deadline') }}</h3>
                <p class="text-lg font-semibold text-slate-900">{{ formatDate(grant.deadline) }}</p>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <h3 class="text-sm font-medium text-slate-500 mb-2">{{ $t('grants.category') }}</h3>
                <Badge>{{ grant.category }}</Badge>
              </div>

              <div>
                <h3 class="text-sm font-medium text-slate-500 mb-2">{{ $t('grants.region') }}</h3>
                <p class="text-slate-700">{{ grant.region }}</p>
              </div>

              <div v-if="grant.eligibility && grant.eligibility.length > 0">
                <h3 class="text-sm font-medium text-slate-500 mb-2">{{ $t('grants.eligibility') }}</h3>
                <ul class="list-disc list-inside text-slate-700 space-y-1">
                  <li v-for="item in grant.eligibility" :key="item">{{ item }}</li>
                </ul>
              </div>

              <div v-if="grant.tags && grant.tags.length > 0">
                <h3 class="text-sm font-medium text-slate-500 mb-2">{{ $t('grants.tags') }}</h3>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="tag in grant.tags"
                    :key="tag"
                    variant="neutral"
                    class="bg-slate-100 text-slate-700"
                  >
                    {{ tag }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-200 pt-6">
            <h3 class="text-sm font-medium text-slate-500 mb-4">{{ $t('grants.contact') }}</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div v-if="grant.contact?.email">
                <p class="text-sm text-slate-500">{{ $t('grants.email') }}</p>
                <a
                  :href="`mailto:${grant.contact.email}`"
                  class="text-primary-600 hover:underline"
                >
                  {{ grant.contact.email }}
                </a>
              </div>
              <div v-if="grant.contact?.phone">
                <p class="text-sm text-slate-500">{{ $t('grants.phone') }}</p>
                <a
                  :href="`tel:${grant.contact.phone}`"
                  class="text-primary-600 hover:underline"
                >
                  {{ grant.contact.phone }}
                </a>
              </div>
              <div v-if="grant.contact?.address">
                <p class="text-sm text-slate-500">{{ $t('grants.address') }}</p>
                <p class="text-slate-700">{{ grant.contact.address }}</p>
              </div>
            </div>
          </div>

          <div class="mt-8 flex items-center justify-between">
            <NuxtLink
              to="/"
              class="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
            >
              {{ $t('grants.backToFeed') }}
            </NuxtLink>
            <a
              v-if="grant.website"
              :href="grant.website"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <Icon name="external-link" size="sm" class="mr-2" />
              {{ $t('grants.visitWebsite') }}
            </a>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGrants } from '~/app/composables/useGrants'

const route = useRoute()
const router = useRouter()

const { fetchGrantById, selectedGrant } = useGrants()

const grant = computed(() => selectedGrant.value)

const statusBadgeVariant = computed(() => {
  if (!grant.value) return 'neutral'
  switch (grant.value.status) {
    case 'open':
      return 'success'
    case 'closing_soon':
      return 'warning'
    default:
      return 'neutral'
  }
})

function formatAmount(amount?: { min?: number; max?: number; currency: string }) {
  if (!amount) return 'N/A'

  const { min, max, currency } = amount
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  })

  if (min === max) {
    return formatter.format(min)
  }

  if (min !== undefined && max !== undefined) {
    return `${formatter.format(min)} - ${formatter.format(max)}`
  }

  if (min !== undefined) {
    return `${formatter.format(min)}+`
  }

  if (max !== undefined) {
    return `Up to ${formatter.format(max)}`
  }

  return 'N/A'
}

function formatDate(dateString?: string) {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

onMounted(() => {
  const id = route.params.id as string
  if (id) {
    fetchGrantById(id)
  }
})
</script>