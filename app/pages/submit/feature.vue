<template>
  <div class="max-w-2xl">
    <h1 class="text-lg font-bold text-black mb-2">{{ $t('submit.requestFeature') || 'Request a Feature' }}</h1>
    <p class="text-xs text-hn-gray mb-4">
      {{ $t('submit.featureDescription') || 'Have an idea to improve GRANgoTY? We\'d love to hear it!' }}
    </p>

    <div class="space-y-4">
      <p class="text-sm">
        {{ $t('submit.featureGithubDescription') || 'Please open a feature request on GitHub to share your ideas with us.' }}
      </p>
      
      <div class="flex gap-2 pt-2">
        <a
          href="https://github.com/asterixix/grangoty/issues/new?template=feature_request.md&title=Feature+Request:+%5BShort+Description%5D"
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2 bg-hn-orange text-white text-xs font-medium hover:bg-hn-orange-dark focus:outline-none focus:ring-2 focus:ring-hn-orange focus:ring-offset-2 inline-flex items-center gap-2"
        >
          <span>{{ $t('submit.submitFeature') || 'Submit Feature Request' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <NuxtLink
          :to="localePath('/submit')"
          class="px-4 py-2 border border-hn-gray text-xs text-hn-gray-dark hover:border-hn-orange hover:text-hn-orange"
        >
          {{ $t('submit.backToSubmit') || 'Back to Submit' }}
        </NuxtLink>
      </div>

      <div class="mt-6 p-4 bg-neutral-100 rounded-lg">
        <h3 class="text-sm font-medium mb-2">{{ $t('submit.popularFeatures') || 'Popular feature ideas:' }}</h3>
        <ul class="text-xs text-hn-gray-dark list-disc list-inside space-y-1">
          <li>{{ $t('submit.featureNotifications') || 'Email notifications for new grants' }}</li>
          <li>{{ $t('submit.featureSaved') || 'Save/bookmark favorite grants' }}</li>
          <li>{{ $t('submit.featureAlerts') || 'Deadline alerts' }}</li>
          <li>{{ $t('submit.featureAdvancedFilters') || 'Advanced filtering options' }}</li>
          <li>{{ $t('submit.featureExport') || 'Export grants to CSV/PDF' }}</li>
          <li>{{ $t('submit.featureApi') || 'Public API access' }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: `${t('submit.requestFeature') || 'Request Feature'} - GRANgoTY`
})
</script>
