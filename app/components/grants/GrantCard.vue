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

      <!-- Grant content -->
      <div class="grant-body flex-1 min-w-0">
        <!-- Rank number (HN-style) -->
        <span class="text-hn-gray mr-2 font-mono text-sm">{{ rank }}.</span>
        
        <!-- Title -->
        <a
          :href="grant.website"
          target="_blank"
          rel="noopener noreferrer"
          class="font-medium text-neutral-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          {{ grant.title }}
          <UIcon name="i-lucide-external-link" class="w-3 h-3 ml-1 inline" />
        </a>

        <!-- Meta row: Amount + Source -->
        <div class="grant-meta flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1">
          <!-- Amount -->
          <span v-if="grant.amount" class="font-medium text-success">
            {{ formatAmount(grant.amount) }}
          </span>
          
          <!-- Source -->
          <span v-if="grant.source" class="text-neutral-500 dark:text-neutral-400">
            {{ grant.source }}
          </span>
          
          <!-- Region -->
          <span v-if="grant.region" class="text-neutral-500 dark:text-neutral-400">
            {{ grant.region }}
          </span>

          <!-- Time ago -->
          <span v-if="timeAgo" class="text-neutral-400 dark:text-neutral-500">
            {{ timeAgo }}
          </span>
        </div>

        <!-- Description (truncated) -->
        <p v-if="grant.description" class="text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2">
          {{ truncate(grant.description, 200) }}
        </p>

        <!-- Tags -->
        <div v-if="grant.tags?.length" class="flex flex-wrap gap-1 mt-2">
          <span
            v-for="tag in grant.tags.slice(0, 5)"
            :key="tag"
            class="inline-block px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded"
          >
            {{ tag }}
          </span>
        </div>

        <!-- Deadline countdown -->
        <div v-if="grant.deadline" class="mt-2">
          <DeadlineCountdown :deadline="grant.deadline" />
        </div>
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
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

const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

const daysRemaining = computed(() => {
  if (!props.grant.deadline) return null
  try {
    const deadline = parseISO(props.grant.deadline)
    const now = mounted.value ? new Date() : new Date('2026-02-28')
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

function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + suffix
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