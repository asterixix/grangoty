<template>
  <article
    role="article"
    :aria-busy="isLoading"
    class="grant-card hn-list-item flex flex-col sm:flex-row gap-3 sm:gap-4 group"
  >
    <!-- Loading skeleton state -->
    <template v-if="isLoading">
      <div class="flex-shrink-0 mt-1">
        <USkeleton class="w-5 h-5 rounded" />
      </div>
      <div class="grant-body flex-1 min-w-0 space-y-2">
        <USkeleton class="h-5 w-3/4" />
        <div class="flex gap-2">
          <USkeleton class="h-5 w-16 rounded-full" />
          <USkeleton class="h-5 w-20 rounded-full" />
        </div>
        <USkeleton class="h-4 w-1/2" />
      </div>
    </template>

    <!-- Error state -->
    <template v-else-if="error">
      <div class="flex-1">
        <UAlert
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="$t('notifications.grants.loadError')"
        >
          <template #actions>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              @click="emit('retry')"
            >
              {{ $t('errors.retry') }}
            </UButton>
          </template>
        </UAlert>
      </div>
    </template>

    <!-- Normal content -->
    <template v-else>
      <UButton
        :aria-label="`${$t('a11y.saveGrant')}: ${grant.title}`"
        :aria-pressed="isSaved"
        color="neutral"
        variant="ghost"
        size="sm"
        :icon="isSaved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
        class="flex-shrink-0 mt-1"
        @click="handleSave"
      />

      <div class="grant-body flex-1 min-w-0">
        <span class="text-hn-gray mr-2 font-mono text-sm">{{ rank }}.</span>
        
        <UButton
          :to="grant.website"
          target="_blank"
          color="neutral"
          variant="link"
          class="font-medium text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 p-0"
          trailing-icon="i-lucide-external-link"
        >
          {{ grant.title }}
        </UButton>

        <div class="grant-meta flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1">
          <span v-if="grant.amount" class="font-medium text-success">
            {{ formatAmount(grant.amount) }}
          </span>
          
          <span v-if="grant.source" class="text-neutral-500 dark:text-neutral-400">
            {{ grant.source }}
          </span>
          
          <span v-if="grant.region" class="text-neutral-500 dark:text-neutral-400">
            {{ grant.region }}
          </span>

          <span v-if="grant.scrapedAt" class="text-neutral-400 dark:text-neutral-500">
            {{ scrapedAtText }}
          </span>
        </div>

        <p v-if="grant.description" class="text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2">
          {{ truncateText(grant.description, 200) }}
        </p>

        <div v-if="grant.tags?.length" class="flex flex-wrap gap-1 mt-2">
          <UBadge
            v-for="tag in grant.tags.slice(0, 5)"
            :key="tag"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ tag }}
          </UBadge>
        </div>

        <div v-if="grant.deadline" class="mt-2">
          <ClientOnly>
            <DeadlineCountdown :deadline="grant.deadline" />
            <template #fallback>
              <USkeleton class="h-4 w-24" />
            </template>
          </ClientOnly>
        </div>
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Grant } from '~/types'

const props = withDefaults(defineProps<{
  grant: Grant
  rank?: number
  isSaved?: boolean
  isLoading?: boolean
  error?: Error | null
}>(), {
  rank: 0,
  isSaved: false,
  isLoading: false,
  error: null,
})

const emit = defineEmits<{
  (e: 'save', rank: number): void
  (e: 'retry'): void
}>()

const scrapedAtText = computed(() => {
  if (!props.grant.scrapedAt) return ''
  const date = new Date(props.grant.scrapedAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
})

function formatAmount(amount: NonNullable<Grant['amount']>): string {
  if (amount.min !== undefined && amount.max !== undefined) {
    return `${amount.min.toLocaleString()} - ${amount.max.toLocaleString()} ${amount.currency}`
  }
  if (amount.min !== undefined) {
    return `${amount.min.toLocaleString()} ${amount.currency}`
  }
  return amount.currency
}

function handleSave(): void {
  emit('save', props.rank ?? 0)
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
</script>

<style scoped>
@reference "tailwindcss";

.grant-card {
  @apply transition-colors duration-200;
}

.grant-meta a {
  @apply text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400;
}
</style>
