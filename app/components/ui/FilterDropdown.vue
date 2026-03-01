<template>
  <div ref="containerRef" class="filter-dropdown relative">
    <button
      type="button"
      class="filter-trigger flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border"
      :class="isOpen ? 'trigger-open' : 'trigger-closed'"
      :style="triggerStyle"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      @click="toggleOpen"
    >
      <span>{{ displayLabel }}</span>
      <span
        v-if="modelValue"
        class="inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
        style="background-color: var(--color-strong-cyan-500); color: white;"
      >
        1
      </span>
      <UIcon
        name="i-lucide-chevron-down"
        class="w-3.5 h-3.5 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''"
      />
    </button>

    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div
        v-if="isOpen"
        class="filter-menu absolute z-50 mt-1 min-w-40 max-h-60 overflow-y-auto rounded-lg shadow-lg"
        :style="`
          background-color: var(--color-dark-teal-200);
          border: 1px solid var(--color-strong-cyan-700);
          top: 100%;
          ${alignRight ? 'right: 0;' : 'left: 0;'}
        `"
        role="listbox"
        :aria-label="placeholder"
      >
        <button
          type="button"
          class="filter-option w-full text-left px-3 py-2 text-sm transition-colors duration-100"
          :class="!modelValue ? 'option-active' : 'option-inactive'"
          role="option"
          :aria-selected="!modelValue"
          @click="selectOption('')"
        >
          {{ placeholder }}
        </button>

        <div style="height: 1px; background-color: var(--color-strong-cyan-800);" />

        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="filter-option w-full text-left px-3 py-2 text-sm transition-colors duration-100"
          :class="modelValue === option.value ? 'option-active' : 'option-inactive'"
          role="option"
          :aria-selected="modelValue === option.value"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

interface DropdownOption {
  label: string
  value: string
}

const props = defineProps<{
  modelValue: string
  options: DropdownOption[]
  placeholder: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const alignRight = ref(false)

function handleOutsideClick(event: MouseEvent): void {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleOutsideClick)
  checkAlignment()
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideClick)
})

function checkAlignment(): void {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  alignRight.value = rect.right + 160 > window.innerWidth
}

const displayLabel = computed(() => {
  if (!props.modelValue) return props.placeholder
  const match = props.options.find(o => o.value === props.modelValue)
  return match?.label ?? props.placeholder
})

const triggerStyle = computed(() => {
  if (isOpen.value || props.modelValue) {
    return `
      background-color: var(--color-strong-cyan-900);
      border-color: var(--color-strong-cyan-500);
      color: var(--color-dark-teal-500);
    `
  }
  return `
    background-color: transparent;
    border-color: var(--color-dark-teal-700);
    color: var(--color-dark-teal-600);
  `
})

function toggleOpen(): void {
  checkAlignment()
  isOpen.value = !isOpen.value
}

function selectOption(value: string): void {
  emit('update:modelValue', value)
  isOpen.value = false
}
</script>

<style scoped>
@reference "tailwindcss";

.filter-option {
  cursor: pointer;
}

.option-active {
  background-color: var(--color-strong-cyan-900);
  color: var(--color-strong-cyan-400);
  font-weight: 600;
}

.option-inactive {
  color: var(--color-dark-teal-700);
}

.option-inactive:hover {
  background-color: var(--color-dark-teal-300);
  color: var(--color-dark-teal-900);
}
</style>
