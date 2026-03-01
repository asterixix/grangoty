<template>
  <!-- Teleport to body to escape stacking contexts -->
  <Teleport to="body">
    <ClientOnly>
      <!-- aria-live CRITICAL: screen readers announce new toasts -->
      <div
        role="region"
        :aria-label="t('a11y.notifications')"
        aria-live="polite"
        aria-atomic="false"
        class="notification-stack"
      >
        <TransitionGroup name="toast" tag="div" class="flex flex-col-reverse gap-2">
          <UiNotificationToast
            v-for="n in notifications.queue.value"
            :key="n.id"
            :notification="n"
            @dismiss="notifications.dismiss(n.id)"
          />
        </TransitionGroup>
      </div>
    </ClientOnly>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
const notifications = useNotifications()
</script>

<style scoped>
.notification-stack {
  position: fixed;
  bottom: 1rem; /* mobile: bottom */
  left: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  gap: 0.5rem;
  pointer-events: none;
}

.notification-stack > div {
  pointer-events: auto;
}

@media (min-width: 768px) {
  .notification-stack {
    top: 5rem; /* desktop: top-right below header */
    bottom: auto;
    left: auto;
    right: 1.5rem;
    width: 22rem;
  }
}

/* Animate in/out */
.toast-enter-active {
  animation: slideUp 200ms ease-out;
}

.toast-leave-active {
  animation: fadeOut 150ms ease-in;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(1rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
