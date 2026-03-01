<template>
  <footer style="background-color: var(--color-dark-teal-500); color: var(--color-strong-cyan-900);">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="col-span-1 md:col-span-1">
          <div class="flex items-center mb-4">
            <Logo />
          </div>
          <p class="text-sm mb-4" style="color: var(--color-strong-cyan-800);">
            {{ t('footer.description') }}
          </p>
          <div class="flex space-x-4">
            <UButton
              to="#"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-simple-icons-facebook"
              aria-label="Facebook"
              class="transition-colors"
              style="color: var(--color-strong-cyan-400);"
            />
            <UButton
              to="#"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-simple-icons-x"
              aria-label="Twitter"
              class="transition-colors"
              style="color: var(--color-strong-cyan-400);"
            />
            <UButton
              to="https://github.com/asterixix/grangoty"
              target="_blank"
              color="neutral"
              variant="ghost"
              size="sm"
              icon="i-simple-icons-github"
              aria-label="GitHub"
              class="transition-colors"
              style="color: var(--color-strong-cyan-400);"
            />
          </div>
        </div>

        <!-- Links -->
        <div>
          <h3 class="text-sm font-semibold tracking-wider uppercase mb-4" style="color: var(--color-mint-cream-500);">
            {{ t('footer.resources') }}
          </h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink to="/" class="text-sm transition-colors duration-200" style="color: var(--color-strong-cyan-400);">
                {{ t('footer.grantSearch') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/api/rss" external class="text-sm transition-colors duration-200" style="color: var(--color-strong-cyan-400);">
                RSS Feed
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="#" class="text-sm transition-colors duration-200" style="color: var(--color-strong-cyan-400);">
                {{ t('footer.api') }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h3 class="text-sm font-semibold tracking-wider uppercase mb-4" style="color: var(--color-mint-cream-500);">
            {{ t('footer.company') }}
          </h3>
          <ul class="space-y-3">
            <li>
              <NuxtLink to="https://github.com/asterixix/grangoty" target="_blank" class="text-sm transition-colors duration-200" style="color: var(--color-strong-cyan-400);">
                {{ t('footer.about') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="https://github.com/asterixix/grangoty/issues/new?template=bug_report.md" target="_blank" class="text-sm transition-colors duration-200" style="color: var(--color-strong-cyan-400);">
                {{ t('footer.reportBug') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="https://github.com/asterixix/grangoty/issues/new?template=feature_request.md" target="_blank" class="text-sm transition-colors duration-200" style="color: var(--color-strong-cyan-400);">
                {{ t('footer.featureRequest') }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Newsletter -->
        <div>
          <h3 class="text-sm font-semibold tracking-wider uppercase mb-4" style="color: var(--color-mint-cream-500);">
            {{ t('footer.newsletter') }}
          </h3>
          <p class="text-sm mb-4" style="color: var(--color-strong-cyan-800);">
            {{ t('footer.newsletterDescription') }}
          </p>
          <form class="flex flex-col space-y-2" @submit.prevent="subscribe">
            <UInput
              v-model="email"
              type="email"
              :placeholder="t('footer.emailPlaceholder')"
              size="sm"
              class="w-full"
            />
            <UButton
              type="submit"
              color="primary"
              size="sm"
              block
            >
              {{ t('footer.subscribe') }}
            </UButton>
          </form>
        </div>
      </div>

      <div class="mt-12 pt-8 border-t" style="border-color: var(--color-dark-teal-400);">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <p class="text-sm" style="color: var(--color-strong-cyan-800);">
            © {{ new Date().getFullYear() }} {{ t('nav.title') }}. {{ t('footer.allRights') }}
          </p>
          <p class="text-sm mt-2 md:mt-0" style="color: var(--color-strong-cyan-800);">
            {{ t('footer.madeWithLove') }}
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { t } = useI18n()

const email = ref('')

function subscribe(event: Event): void {
  event.preventDefault()
  // Handle subscription logic here
  console.log('Subscribed with:', email.value)
  email.value = ''
}
</script>
