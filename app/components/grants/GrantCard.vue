<template>
  <article
    role="article"
    :aria-busy="isLoading"
    class="grant-card hn-list-item flex flex-col sm:flex-row gap-3 sm:gap-4 group"
  >
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

    <template v-else-if="error">
      <div class="flex-1">
        <UAlert
          color="error"
          variant="soft"
          icon="i-lucide-alert-circle"
          :title="t('notifications.grants.loadError')"
        >
          <template #actions>
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              @click="emit('retry')"
            >
              {{ t('errors.retry') }}
            </UButton>
          </template>
        </UAlert>
      </div>
    </template>

    <template v-else>
      <UButton
        :aria-label="`${t('a11y.saveGrant')}: ${grant.title}`"
        :aria-pressed="isSaved"
        color="neutral"
        variant="ghost"
        size="sm"
        :icon="isSaved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
        class="flex-shrink-0 mt-1"
        :style="isSaved
          ? 'color: var(--color-strong-cyan-500);'
          : 'color: var(--color-dark-teal-700);'"
        @click="handleSave"
      />

      <div class="grant-body flex-1 min-w-0">
        <span class="mr-2 font-mono text-sm" style="color: var(--color-dark-teal-700);">{{ rank }}.</span>

        <a
          :href="grant.website"
          target="_blank"
          rel="noopener noreferrer"
          class="grant-title font-medium hover:underline transition-colors duration-150"
          @mouseenter="(e) => (e.target as HTMLElement).style.color = 'var(--color-strong-cyan-400)'"
          @mouseleave="(e) => (e.target as HTMLElement).style.color = ''"
        >
          {{ grant.title }} ↗
        </a>

        <div class="grant-meta flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1">
          <span v-if="grant.amount" class="font-semibold" style="color: var(--color-strong-cyan-400);">
            {{ formatAmount(grant.amount) }}
          </span>

          <span v-if="grant.source" style="color: var(--color-dark-teal-600);">
            {{ grant.source }}
          </span>

          <NuxtLink
            :to="localePath(`/grant/${grant.id}`)"
            class="hover:underline font-medium"
            style="color: var(--color-strong-cyan-700);"
          >
            {{ t('common.showDetails') }}
          </NuxtLink>

          <span v-if="grant.region" style="color: var(--color-dark-teal-600);">
            {{ grant.region }}
          </span>

          <span v-if="grant.scrapedAt" style="color: var(--color-dark-teal-700);">
            {{ scrapedAtText }}
          </span>
        </div>

        <p
          v-if="grant.description"
          class="text-sm mt-1 line-clamp-2"
          style="color: var(--color-dark-teal-600);"
        >
          {{ truncateText(grant.description, 200) }}
        </p>

        <div v-if="grant.tags?.length" class="flex flex-wrap gap-1 mt-2">
          <span
            v-for="tag in grant.tags.slice(0, 5)"
            :key="tag"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500); border: 1px solid var(--color-strong-cyan-700);"
          >
            {{ tag }}
          </span>
        </div>

        <div v-if="grant.deadline" class="mt-2">
          <GrantsDeadlineCountdown :deadline="grant.deadline" />
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

const { t } = useI18n({ useScope: 'global' })
const localePath = useLocalePath()

const scrapedAtText = computed(() => {
  if (!props.grant.scrapedAt) return ''
  const date = new Date(props.grant.scrapedAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return t('grants.scrapedToday')
  if (diffDays === 1) return t('grants.scrapedDayAgo')
  if (diffDays < 7) return t('grants.scrapedDaysAgo', { n: diffDays })
  if (diffDays < 30) return t('grants.scrapedWeeksAgo', { n: Math.floor(diffDays / 7) })
  return t('grants.scrapedMonthsAgo', { n: Math.floor(diffDays / 30) })
})

function formatAmount(amount: NonNullable<Grant['amount']>): string {
  if (amount.min !== undefined && amount.max !== undefined) {
    return `${amount.min.toLocaleString()} – ${amount.max.toLocaleString()} ${amount.currency}`
  }
  if (amount.min !== undefined) {
    return `${amount.min.toLocaleString()} ${amount.currency}`
  }
  if (amount.max !== undefined) {
    return `${amount.max.toLocaleString()} ${amount.currency}`
  }
  return amount.currency
}

function handleSave(): void {
  emit('save', props.rank ?? 0)
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}
</script>

<style scoped>
@reference "tailwindcss";

.grant-card {
  @apply transition-colors duration-200;
}

.grant-title {
  color: var(--color-dark-teal-500);
}

.grant-title:visited {
  color: var(--color-dark-teal-600);
}
</style>
