<template>
  <article
    role="article"
    :aria-busy="isLoading"
    class="grant-card hn-list-item flex flex-col sm:flex-row gap-3 sm:gap-4 group"
  >
    <!-- Loading skeleton state -->
    <template v-if="isLoading">
      <div class="flex-shrink-0 mt-1">
        <div class="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
      </div>
      <div class="grant-body flex-1 min-w-0 animate-pulse space-y-2">
        <!-- Title skeleton -->
        <div class="h-5 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
        <!-- Badges skeleton -->
        <div class="flex gap-2">
          <div class="h-5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
          <div class="h-5 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
        </div>
        <!-- Meta skeleton -->
        <div class="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
      </div>
    </template>

    <!-- Error state -->
    <template v-else-if="error">
      <div class="flex-1">
        <InlineError
          :message="$t('notifications.grants.loadError')"
          :on-retry="emit('retry')"
        />
      </div>
    </template>

    <!-- Normal content -->
    <template v-else>
    <!-- Upvote / Save button (civic engagement, not popularity contest) -->
    <button
      :aria-label="`${t('a11y.saveGrant')}: ${grant.title}`"
      class="upvote flex-shrink-0 mt-1 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded transition-colors"
      :class="[
        isSaved
          ? 'text-primary-500'
          : 'text-neutral-400 hover:text-primary-500 dark:text-neutral-600 dark:hover:text-primary-400'
      ]"
      @click="handleSave"
    >
      <UIcon
        name="i-lucide-bookmark"
        class="w-5 h-5"
        :class="{ 'fill-current': isSaved }"
      />
    </button>

    </template>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseISO, differenceInDays, formatDistanceToNow } from 'date-fns'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()

// Deadline urgency computed
const daysRemaining = computed(() => {
  if (!props.grant.deadline) return null
  try {
    const deadline = parseISO(props.grant.deadline)
    const now = new Date()
    const days = differenceInDays(deadline, now)
    return days
  } catch {
    return null
  }
})

const urgency = computed(() => {
  if (daysRemaining.value === null) {
    return { label: t('deadline.normal'), class: 'text-neutral-500', icon: 'i-lucide-calendar' }
  }
  if (daysRemaining.value <= 7) {
    return { label: t('deadline.hot'), class: 'text-error', icon: 'i-lucide-flame' }
  }
  if (daysRemaining.value <= 21) {
    return { label: t('deadline.warm'), class: 'text-warning', icon: 'i-lucide-clock' }
  }
  return { label: t('deadline.normal'), class: 'text-success', icon: 'i-lucide-calendar' }
})

const timeAgo = computed(() => {
  if (!props.grant.scrapedAt) return ''
  try {
    return formatDistanceToNow(parseISO(props.grant.scrapedAt), { addSuffix: true })
  } catch {
    return ''
  }
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

function formatSource(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '')
    return hostname.length > 25 ? hostname.slice(0, 25) + '...' : hostname
  } catch {
    return url.slice(0, 25)
  }
}

function handleSave(): void {
  emit('save', props.rank ?? 0)
}
</script>

<style scoped>
.grant-card {
  @apply transition-colors duration-200;
}

.upvote:focus-visible {
  @apply outline-none ring-2 ring-primary-500 ring-offset-2;
}

.grant-meta a {
  @apply text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400;
}
</style>