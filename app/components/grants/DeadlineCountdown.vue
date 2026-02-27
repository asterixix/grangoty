<template>
  <div
    class="deadline-countdown inline-flex items-center"
    :class="deadlineClass"
  >
    <UIcon :name="deadlineIcon" class="w-4 h-4 mr-1.5" />
    <span class="font-medium">
      {{ deadlineText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { parseISO, differenceInDays } from 'date-fns'

const props = defineProps<{
  deadline: string
}>()

// Deadline urgency computed
const daysRemaining = computed(() => {
  try {
    const deadline = parseISO(props.deadline)
    const now = new Date()
    return differenceInDays(deadline, now)
  } catch {
    return null
  }
})

const deadlineClass = computed(() => {
  if (daysRemaining.value === null) return 'text-neutral-500'
  if (daysRemaining.value <= 7) return 'text-error'
  if (daysRemaining.value <= 21) return 'text-warning'
  return 'text-success'
})

const deadlineIcon = computed(() => {
  if (daysRemaining.value === null) return 'i-lucide-calendar'
  if (daysRemaining.value <= 7) return 'i-lucide-flame'
  if (daysRemaining.value <= 21) return 'i-lucide-clock'
  return 'i-lucide-calendar'
})

const deadlineText = computed(() => {
  if (daysRemaining.value === null) return 'No deadline'
  if (daysRemaining.value < 0) return 'Ended'
  if (daysRemaining.value === 0) return 'Today'
  if (daysRemaining.value === 1) return '1 day left'
  return `${daysRemaining.value} days left`
})
</script>

<style scoped>
.deadline-countdown {
  @apply inline-flex items-center text-sm;
}
</style>