<template>
  <div class="grant-card card">
    <div class="flex items-start justify-between mb-4">
      <Badge :variant="statusBadgeVariant">
        {{ $t(`status.${grant.status}`) }}
      </Badge>
      <a
        :href="grant.website"
        target="_blank"
        rel="noopener noreferrer"
        class="text-slate-400 hover:text-primary-600 transition-colors"
        :aria-label="$t('common.visitSource')"
      >
        <Icon name="external-link" size="sm" />
      </a>
    </div>

    <h3 class="text-xl font-semibold mb-2">
      <NuxtLink
        :to="`/grant/${grant.id}`"
        class="text-slate-900 hover:text-primary-600 transition-colors"
      >
        {{ grant.title }}
      </NuxtLink>
    </h3>

    <p class="text-slate-600 mb-4 line-clamp-2">
      {{ grant.description }}
    </p>

    <div class="space-y-2 text-sm text-slate-600">
      <div v-if="grant.amount" class="flex items-center">
        <Icon name="currency" size="sm" class="mr-2 text-slate-400" />
        <span>{{ formatAmount(grant.amount) }}</span>
      </div>
      <div v-if="grant.deadline" class="flex items-center">
        <Icon name="calendar" size="sm" class="mr-2 text-slate-400" />
        <span>{{ formatDate(grant.deadline) }}</span>
      </div>
      <div v-if="grant.category" class="flex items-center">
        <Icon name="tag" size="sm" class="mr-2 text-slate-400" />
        <span>{{ grant.category }}</span>
      </div>
      <div v-if="grant.region" class="flex items-center">
        <Icon name="map" size="sm" class="mr-2 text-slate-400" />
        <span>{{ grant.region }}</span>
      </div>
    </div>

    <div v-if="grant.tags && grant.tags.length > 0" class="mt-4 flex flex-wrap gap-2">
      <span
        v-for="tag in grant.tags.slice(0, 3)"
        :key="tag"
        class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600"
      >
        {{ tag }}
      </span>
      <span
        v-if="grant.tags.length > 3"
        class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600"
      >
        +{{ grant.tags.length - 3 }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Grant } from '~/app/types'

const props = defineProps<{
  grant: Grant
}>()

const statusBadgeVariant = computed(() => {
  switch (props.grant.status) {
    case 'open':
      return 'success'
    case 'closing_soon':
      return 'warning'
    case 'closed':
    case 'archived':
      return 'neutral'
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
</script>