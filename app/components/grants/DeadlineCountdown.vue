<template>
  <div class="deadline-countdown inline-flex items-center" :class="urgencyClass">
    <UIcon :name="deadlineIcon" class="w-4 h-4 mr-1.5" />
    <span class="font-medium">{{ deadlineText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useState } from '#app'

function parseDate(dateString: string): Date {
  return new Date(dateString)
}

function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((dateLeft.getTime() - dateRight.getTime()) / msPerDay)
}

const props = defineProps<{
  deadline: string
}>()

const { t } = useI18n({ useScope: 'global' })

// Sync server time with client to avoid hydration mismatch
const now = useState('current-time', () => new Date())

const daysRemaining = computed(() => {
  try {
    const deadline = parseDate(props.deadline)
    return differenceInDays(deadline, now.value)
  } catch {
    return null
  }
})

const urgencyClass = computed(() => {
  if (daysRemaining.value === null) return 'deadline--neutral'
  if (daysRemaining.value <= 7) return 'deadline--hot'
  if (daysRemaining.value <= 21) return 'deadline--warm'
  return 'deadline--normal'
})

const deadlineIcon = computed(() => {
  if (daysRemaining.value === null) return 'i-lucide-calendar'
  if (daysRemaining.value <= 7) return 'i-lucide-flame'
  if (daysRemaining.value <= 21) return 'i-lucide-clock'
  return 'i-lucide-calendar'
})

const deadlineText = computed(() => {
  if (daysRemaining.value === null) return t('deadline.noDeadline')
  if (daysRemaining.value < 0) return t('deadline.ended')
  if (daysRemaining.value === 0) return t('deadline.today')
  if (daysRemaining.value === 1) return t('deadline.oneDayLeft')
  return t('deadline.daysLeft', { n: daysRemaining.value })
})
</script>

<style scoped>
.deadline-countdown {
  font-size: 0.8125rem;
}

.deadline--hot {
  color: var(--color-grapefruit-pink-500);
}

.deadline--warm {
  color: var(--color-royal-gold-300);
}

.deadline--normal {
  color: var(--color-strong-cyan-400);
}

.deadline--neutral {
  color: var(--color-dark-teal-700);
}
</style>
