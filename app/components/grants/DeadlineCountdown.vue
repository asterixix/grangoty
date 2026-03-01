<template>
  <div class="deadline-countdown inline-flex items-center" :class="urgencyClass">
    <UIcon :name="deadlineIcon" class="w-4 h-4 mr-1.5" />
    <span class="font-medium">{{ deadlineText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { parseISO, differenceInDays } from 'date-fns'

const props = defineProps<{
  deadline: string
}>()

const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

const daysRemaining = computed(() => {
  try {
    const deadline = parseISO(props.deadline)
    const now = mounted.value ? new Date() : new Date('2026-02-28')
    return differenceInDays(deadline, now)
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
