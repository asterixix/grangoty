<template>
  <button
    :class="[
      'btn',
      `btn-${variant}`,
      sizeClass,
      roundedClass,
      disabled ? 'opacity-50 cursor-not-allowed' : '',
      class
    ]"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot v-if="$slots.default" />
    <Icon v-else-if="icon" :name="icon" class="w-5 h-5" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
  icon?: string
  disabled?: boolean
  class?: string
}>()

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm'
    case 'lg':
      return 'px-6 py-3 text-lg'
    default:
      return 'px-4 py-2'
  }
})

const roundedClass = computed(() => {
  switch (props.rounded) {
    case 'none':
      return 'rounded-none'
    case 'sm':
      return 'rounded-sm'
    case 'lg':
      return 'rounded-lg'
    case 'full':
      return 'rounded-full'
    default:
      return 'rounded'
  }
})
</script>