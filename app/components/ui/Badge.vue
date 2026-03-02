<template>
  <span :class="[sizeClass, roundedClass, props.class]" :style="colorStyle">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  color?: 'primary' | 'cyan' | 'neutral' | 'danger' | 'warning' | 'success'
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
    case 'xs': return 'inline-flex items-center font-medium px-1.5 py-0.5 text-xs'
    case 'sm': return 'inline-flex items-center font-medium px-2 py-1 text-xs'
    case 'md': return 'inline-flex items-center font-medium px-2.5 py-1 text-sm'
    case 'lg': return 'inline-flex items-center font-medium px-3 py-1.5 text-sm'
    default:   return 'inline-flex items-center font-medium px-2 py-1 text-xs'
  }
})

const roundedClass = 'rounded-full'

const colorStyle = computed(() => {
  const styles: Record<string, Record<string, string>> = {
    primary: {
      solid:   'background-color: var(--color-dark-teal-500); color: var(--color-mint-cream-500);',
      soft:    'background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500);',
      outline: 'background-color: transparent; color: var(--color-dark-teal-500); border: 1px solid var(--color-dark-teal-700);',
    },
    cyan: {
      solid:   'background-color: var(--color-strong-cyan-500); color: white;',
      soft:    'background-color: var(--color-strong-cyan-900); color: var(--color-strong-cyan-300);',
      outline: 'background-color: transparent; color: var(--color-strong-cyan-400); border: 1px solid var(--color-strong-cyan-600);',
    },
    neutral: {
      solid:   'background-color: var(--color-dark-teal-600); color: white;',
      soft:    'background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-600);',
      outline: 'background-color: transparent; color: var(--color-dark-teal-600); border: 1px solid var(--color-dark-teal-800);',
    },
    success: {
      solid:   'background-color: var(--color-strong-cyan-500); color: white;',
      soft:    'background-color: var(--color-strong-cyan-900); color: var(--color-strong-cyan-300); border: 1px solid var(--color-strong-cyan-700);',
      outline: 'background-color: transparent; color: var(--color-strong-cyan-400); border: 1px solid var(--color-strong-cyan-600);',
    },
    warning: {
      solid:   'background-color: var(--color-royal-gold-400); color: var(--color-royal-gold-100);',
      soft:    'background-color: var(--color-royal-gold-900); color: var(--color-royal-gold-200); border: 1px solid var(--color-royal-gold-500);',
      outline: 'background-color: transparent; color: var(--color-royal-gold-300); border: 1px solid var(--color-royal-gold-400);',
    },
    danger: {
      solid:   'background-color: var(--color-grapefruit-pink-500); color: white;',
      soft:    'background-color: var(--color-grapefruit-pink-900); color: var(--color-grapefruit-pink-400); border: 1px solid var(--color-grapefruit-pink-700);',
      outline: 'background-color: transparent; color: var(--color-grapefruit-pink-500); border: 1px solid var(--color-grapefruit-pink-600);',
    },
  }

  return styles[props.color]?.[props.variant] ?? styles.primary!.solid
})
</script>
