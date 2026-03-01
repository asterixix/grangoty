<template>
  <span
    :class="[
      'inline-flex items-center font-medium transition-colors duration-200',
      sizeClass,
      colorClass,
      roundedClass,
      class
    ]"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  color?: 'primary' | 'neutral' | 'gray' | 'red' | 'green' | 'blue' | 'yellow'
  variant?: 'solid' | 'soft' | 'outline'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'solid',
  size: 'sm'
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'px-1.5 py-0.5 text-xs'
    case 'sm':
      return 'px-2 py-1 text-xs'
    case 'md':
      return 'px-2.5 py-1 text-sm'
    case 'lg':
      return 'px-3 py-1.5 text-sm'
    default:
      return 'px-2 py-1 text-xs'
  }
})

const colorClass = computed(() => {
  const colorMap = {
    primary: {
      solid: 'bg-blue-600 text-white',
      soft: 'bg-blue-50 text-blue-700',
      outline: 'border border-blue-300 bg-transparent text-blue-700'
    },
    neutral: {
      solid: 'bg-gray-600 text-white',
      soft: 'bg-gray-50 text-gray-700',
      outline: 'border border-gray-300 bg-transparent text-gray-700'
    },
    gray: {
      solid: 'bg-gray-500 text-white',
      soft: 'bg-gray-50 text-gray-700',
      outline: 'border border-gray-300 bg-transparent text-gray-700'
    },
    red: {
      solid: 'bg-red-600 text-white',
      soft: 'bg-red-50 text-red-700',
      outline: 'border border-red-300 bg-transparent text-red-700'
    },
    green: {
      solid: 'bg-green-600 text-white',
      soft: 'bg-green-50 text-green-700',
      outline: 'border border-green-300 bg-transparent text-green-700'
    },
    blue: {
      solid: 'bg-blue-600 text-white',
      soft: 'bg-blue-50 text-blue-700',
      outline: 'border border-blue-300 bg-transparent text-blue-700'
    },
    yellow: {
      solid: 'bg-yellow-600 text-white',
      soft: 'bg-yellow-50 text-yellow-700',
      outline: 'border border-yellow-300 bg-transparent text-yellow-700'
    }
  }

  return colorMap[props.color]?.[props.variant] || colorMap.primary.solid
})

const roundedClass = computed(() => 'rounded-full')
</script>