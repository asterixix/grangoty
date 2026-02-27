<template>
  <div
    :class="toastClasses"
    role="alert"
    :aria-live="notification.level === 'error' ? 'assertive' : 'polite'"
  >
    <!-- Icon based on level -->
    <div :class="iconWrapperClasses" aria-hidden="true">
      <svg
        v-if="notification.level === 'success'"
        class="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clip-rule="evenodd"
        />
      </svg>
      <svg
        v-else-if="notification.level === 'error'"
        class="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clip-rule="evenodd"
        />
      </svg>
      <svg
        v-else-if="notification.level === 'warning'"
        class="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
      </svg>
      <svg
        v-else
        class="w-5 h-5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        />
      </svg>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-slate-900 dark:text-slate-100">
        {{ $t(notification.titleKey, notification.params) }}
      </p>
      <p
        v-if="notification.messageKey"
        class="mt-1 text-sm text-slate-600 dark:text-slate-400"
      >
        {{ $t(notification.messageKey, notification.params) }}
      </p>

      <!-- Action button -->
      <button
        v-if="notification.action"
        class="mt-2 text-sm font-medium underline hover:no-underline"
        :class="actionTextClass"
        @click="handleAction"
      >
        {{ $t(notification.action.labelKey) }}
      </button>
    </div>

    <!-- Dismiss button -->
    <button
      class="flex-shrink-0 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      :aria-label="$t('notifications.dismiss')"
      @click="$emit('dismiss')"
    >
      <svg class="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Notification } from '~/types/notifications'

const props = defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const toastClasses = computed(() => {
  const base = [
    'flex items-start gap-3 p-4 rounded-lg shadow-lg',
    'bg-white dark:bg-slate-800',
    'border-l-4',
    'transition-all duration-200',
  ]

  const levelClasses: Record<string, string> = {
    success: 'border-green-500',
    error: 'border-red-500',
    warning: 'border-amber-500',
    info: 'border-blue-500',
  }

  return [...base, levelClasses[props.notification.level] || levelClasses.info]
})

const iconWrapperClasses = computed(() => {
  const base = ['flex-shrink-0 p-1 rounded-full']

  const levelClasses: Record<string, string> = {
    success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    error: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  }

  return [...base, levelClasses[props.notification.level] || levelClasses.info]
})

const actionTextClass = computed(() => {
  const levelClasses: Record<string, string> = {
    success: 'text-green-700 dark:text-green-400',
    error: 'text-red-700 dark:text-red-400',
    warning: 'text-amber-700 dark:text-amber-400',
    info: 'text-blue-700 dark:text-blue-400',
  }

  return levelClasses[props.notification.level] || levelClasses.info
})

function handleAction() {
  props.notification.action?.handler()
  emit('dismiss')
}
</script>
