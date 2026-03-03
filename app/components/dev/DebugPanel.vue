<template>
  <Teleport to="body">
    <aside
      v-if="isDev"
      class="debug-panel fixed bottom-4 left-4 z-[9998] max-w-md"
      aria-label="Debug Panel (Dev Only)"
    >
      <details
        class="rounded-lg shadow-xl border"
        style="background-color: var(--color-mint-cream-500); border-color: var(--color-strong-cyan-700);"
      >
        <summary
          class="px-4 py-3 cursor-pointer font-semibold flex items-center gap-2"
          style="color: var(--color-dark-teal-500);"
        >
          <span>🐛</span>
          <span>Debug Panel</span>
          <span class="text-xs ml-auto" style="color: var(--color-dark-teal-700);">Dev Only</span>
        </summary>

        <div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <!-- Pinia State -->
          <section>
            <h3 class="font-semibold mb-2" style="color: var(--color-dark-teal-600);">
              Pinia State
            </h3>
            <details class="text-xs">
              <summary class="cursor-pointer" style="color: var(--color-dark-teal-700);">Grants Store</summary>
              <pre
                class="mt-2 p-2 rounded overflow-x-auto"
                style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500);"
              >{{ JSON.stringify(grantsStore.$state, null, 2) }}</pre>
            </details>
            <details class="text-xs mt-2">
              <summary class="cursor-pointer" style="color: var(--color-dark-teal-700);">Filters Store</summary>
              <pre
                class="mt-2 p-2 rounded overflow-x-auto"
                style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500);"
              >{{ JSON.stringify(filtersStore.$state, null, 2) }}</pre>
            </details>
          </section>

          <!-- Active Notifications -->
          <section>
            <h3 class="font-semibold mb-2" style="color: var(--color-dark-teal-600);">
              Active Notifications ({{ queue.length }})
            </h3>
            <pre
              class="text-xs p-2 rounded overflow-x-auto max-h-40"
              style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500);"
            >{{ JSON.stringify(queue, null, 2) }}</pre>
          </section>

          <!-- Network Status -->
          <section>
            <h3 class="font-semibold mb-2" style="color: var(--color-dark-teal-600);">
              Network Status
            </h3>
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                :style="isOnline
                  ? 'background-color: var(--color-strong-cyan-400);'
                  : 'background-color: var(--color-grapefruit-pink-500);'"
              />
              <span class="text-sm" style="color: var(--color-dark-teal-600);">
                {{ isOnline ? 'Online' : 'Offline' }}
              </span>
            </div>
          </section>

          <!-- Actions -->
          <section>
            <h3 class="font-semibold mb-2" style="color: var(--color-dark-teal-600);">
              Actions
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                class="px-3 py-2 text-xs font-medium rounded transition-colors"
                style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500); border: 1px solid var(--color-strong-cyan-700);"
                @click="grantsStore.fetchGrants()"
              >
                Force Refetch
              </button>
              <button
                class="px-3 py-2 text-xs font-medium rounded transition-colors"
                style="background-color: var(--color-royal-gold-900); color: var(--color-dark-teal-500); border: 1px solid var(--color-royal-gold-700);"
                @click="errorSimulator.networkOffline()"
              >
                Simulate Offline
              </button>
              <button
                class="px-3 py-2 text-xs font-medium rounded transition-colors"
                style="background-color: var(--color-strong-cyan-900); color: var(--color-strong-cyan-400); border: 1px solid var(--color-strong-cyan-700);"
                @click="errorSimulator.networkOnline()"
              >
                Simulate Online
              </button>
              <button
                class="px-3 py-2 text-xs font-medium rounded transition-colors"
                style="background-color: var(--color-dark-teal-900); color: var(--color-strong-cyan-400); border: 1px solid var(--color-dark-teal-700);"
                @click="errorSimulator.scraperDown('niw')"
              >
                Scraper Down
              </button>
              <button
                class="px-3 py-2 text-xs font-medium rounded transition-colors"
                style="background-color: var(--color-grapefruit-pink-900); color: var(--color-grapefruit-pink-500); border: 1px solid var(--color-grapefruit-pink-700);"
                @click="errorSimulator.allToastTypes()"
              >
                All Toast Types
              </button>
              <button
                class="px-3 py-2 text-xs font-medium rounded transition-colors"
                style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500); border: 1px solid var(--color-strong-cyan-700);"
                @click="errorSimulator.quota()"
              >
                Test Queue Cap
              </button>
              <button
                class="px-3 py-2 text-xs font-medium rounded transition-colors"
                style="background-color: var(--color-grapefruit-pink-900); color: var(--color-grapefruit-pink-500); border: 1px solid var(--color-grapefruit-pink-700);"
                @click="throwTestError()"
              >
                Throw Error
              </button>
              <button
                class="px-3 py-2 text-xs font-medium rounded transition-colors"
                style="background-color: var(--color-strong-cyan-900); color: var(--color-dark-teal-500); border: 1px solid var(--color-strong-cyan-700);"
                @click="notifications.dismissAll()"
              >
                Clear All
              </button>
            </div>
          </section>
        </div>
      </details>
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useErrorSimulator } from '~/composables/dev/useErrorSimulator'

// Only renders when NUXT_DEBUG=true or dev mode
const isDev = import.meta.dev

const grantsStore = useGrantsStore()
const filtersStore = useFiltersStore()
const notifications = useNotifications()
const queue = notifications.queue
const { isOnline } = useNetworkStatus()
const errorSimulator = useErrorSimulator()

function throwTestError(): void {
  throw new Error('Test error for Sentry integration')
}
</script>

<style scoped>
.debug-panel {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
