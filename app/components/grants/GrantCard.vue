<template>
  <article
    role="article"
    class="grant-card hn-list-item flex flex-col sm:flex-row gap-3 sm:gap-4 group"
  >
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

    <div class="grant-body flex-1 min-w-0">
      <!-- Title: external link with security attrs -->
      <h2 class="grant-title text-base sm:text-lg font-semibold mb-1">
        <a
          :href="grant.website"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          {{ grant.title }}
          <span class="sr-only">{{ t('a11y.opensNewTab') }}</span>
        </a>
      </h2>

      <!-- Badge row -->
      <div class="grant-badges flex flex-wrap items-center gap-2 mb-1.5">
        <!-- Deadline badge with urgency tiers -->
        <UBadge
          :class="urgency.class"
          variant="outline"
          role="listitem"
        >
          <UIcon :name="urgency.icon" class="w-3 h-3 mr-1" />
          {{ daysRemaining }} {{ t('deadline.days') }}
        </UBadge>

        <!-- Amount badge -->
        <UBadge
          v-if="grant.amount"
          variant="outline"
          class="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          role="listitem"
        >
          {{ formatAmount(grant.amount) }}
        </UBadge>
      </div>

      <!-- Metadata line — secondary info, muted -->
      <p class="grant-meta text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="truncate max-w-[150px] sm:max-w-none">{{ formatSource(grant.website) }}</span>
        <span class="hidden sm:inline text-neutral-300 dark:text-neutral-600">·</span>
        <span class="truncate max-w-[100px] sm:max-w-none">{{ grant.region }}</span>
        <span class="hidden sm:inline text-neutral-300 dark:text-neutral-600">·</span>
        <span class="truncate max-w-[80px] sm:max-w-none">{{ grant.category }}</span>
        <span class="hidden sm:inline text-neutral-300 dark:text-neutral-600">·</span>
        <time :datetime="grant.scrapedAt" class="whitespace-nowrap">
          {{ timeAgo }}
        </time>
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseISO, differenceInDays, formatDistanceToNow } from 'date-fns'
import { useI18n } from 'vue-i18n'
import type { Grant } from '~/types'

const props = defineProps<{
  grant: Grant
  rank?: number
  isSaved?: boolean
}>()

const emit = defineEmits<{
  (e: 'save', rank: number): void
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