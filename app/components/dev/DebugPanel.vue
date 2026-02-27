<template>
  <Teleport to="body">
    <aside
      v-if="isDev"
      class="debug-panel fixed bottom-4 left-4 z-[9998] max-w-md"
      aria-label="Debug Panel (Dev Only)"
    >
      <details class="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700">
        <summary class="px-4 py-3 cursor-pointer font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <span>🐛</span>
          <span>Debug Panel</span>
          <span class="text-xs text-slate-400 ml-auto">Dev Only</span>
        </summary>

        <div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <!-- Pinia State -->
          <section>
            <h3 class="font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Pinia State
            </h3>
            <details class="text-xs">
              <summary class="cursor-pointer text-slate-500 dark:text-slate-400">Grants Store</summary>
              <pre class="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded overflow-x-auto text-slate-700 dark:text-slate-300">{{ JSON.stringify(grantsStore.$state, null, 2) }}</pre>
            </details>
            <details class="text-xs mt-2">
              <summary class="cursor-pointer text-slate-500 dark:text-slate-400">Filters Store</summary>
              <pre class="mt-2 p-2 bg-slate-100 dark:bg-slate-900 rounded overflow-x-auto text-slate-700 dark:text-slate-300">{{ JSON.stringify(filtersStore.$state, null, 2) }}</pre>
            </details>
          </section>

          <!-- Active Notifications -->
          <section>
            <h3 class="font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Active Notifications ({{ queue.length }})
            </h3>
            <pre class="text-xs p-2 bg-slate-100 dark:bg-slate-900 rounded overflow-x-auto max-h-40 text-slate-700 dark:text-slate-300">{{ JSON.stringify(queue, null, 2) }}</pre>
          </section>

          <!-- Network Status -->
          <section>
            <h3 class="font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Network Status
            </h3>
            <div class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-full"
                :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
              />
              <span class="text-sm text-slate-600 dark:text-slate-400">
                {{ isOnline ? 'Online' : 'Offline' }}
              </span>
            </div>
          </section>

          <!-- Actions -->
          <section>
            <h3 class="font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Actions
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                class="px-3 py-2 text-xs font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                @click="grantsStore.fetchGrants()"
              >
                Force Refetch
              </button>
              <button
                class="px-3 py-2 text-xs font-medium bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                @click="errorSimulator.networkOffline()"
              >
                Simulate Offline
              </button>
              <button
                class="px-3 py-2 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                @click="errorSimulator.networkOnline()"
              >
                Simulate Online
              </button>
              <button
                class="px-3 py-2 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                @click="errorSimulator.scraperDown('niw')"
              >
                Scraper Down
              </button>
              <button
                class="px-3 py-2 text-xs font-medium bg-rose-100 text-rose-700 rounded hover:bg-rose-200 transition-colors"
                @click="errorSimulator.allToastTypes()"
              >
                All Toast Types
              </button>
              <button
                class="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                @click="errorSimulator.quota()"
              >
                Test Queue Cap
              </button>
              <button
                class="px-3 py-2 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                @click="throwTestError()"
              >
                Throw Error
              </button>
              <button
                class="px-3 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
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

// Only renders when NUXT_DEBUG=true or dev mode
const isDev = import.meta.dev

const grantsStore = useGrantsStore()
const filtersStore = useFiltersStore()
const notifications = useNotifications()
const { queue } = storeToRefs(notifications as any)
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
