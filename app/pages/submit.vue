<template>
  <div class="max-w-2xl">
    <h1 class="text-lg font-bold text-black mb-2">{{ $t('submit.title') }}</h1>
    <p class="text-xs text-hn-gray mb-4">{{ $t('submit.description') }}</p>

    <div class="space-y-4">
      <p class="text-sm">
        {{ $t('submit.githubDescription') || 'We use GitHub to track grant submissions. Please open an issue with the grant details.' }}
      </p>
      
      <div class="flex gap-2 pt-2">
        <a
          href="https://github.com/asterixix/grangoty/issues/new?template=grant_submission.md&title=Grant+Submission:+%5BTitle%5D"
          target="_blank"
          rel="noopener noreferrer"
          class="px-4 py-2 bg-hn-orange text-white text-xs font-medium hover:bg-hn-orange-dark focus:outline-none focus:ring-2 focus:ring-hn-orange focus:ring-offset-2 inline-flex items-center gap-2"
        >
          <span>{{ $t('submit.submitViaGithub') || 'Submit Grant on GitHub' }}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
        <NuxtLink
          :to="localePath('/submit/feature')"
          class="px-4 py-2 border border-hn-gray text-xs text-hn-gray-dark hover:border-hn-orange hover:text-hn-orange"
        >
          {{ $t('submit.requestFeature') || 'Request Feature' }}
        </NuxtLink>
      </div>

      <div class="mt-6 p-4 bg-neutral-100 rounded-lg">
        <h3 class="text-sm font-medium mb-2">{{ $t('submit.whatToInclude') || 'What to include:' }}</h3>
        <ul class="text-xs text-hn-gray-dark list-disc list-inside space-y-1">
          <li>{{ $t('submit.includeTitle') || 'Grant title' }}</li>
          <li>{{ $t('submit.includeDescription') || 'Brief description' }}</li>
          <li>{{ $t('submit.includeDeadline') || 'Application deadline' }}</li>
          <li>{{ $t('submit.includeWebsite') || 'Link to official website' }}</li>
          <li>{{ $t('submit.includeAmount') || 'Grant amount (if available)' }}</li>
          <li>{{ $t('submit.includeRegion') || 'Eligible region/country' }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

useHead({
  title: `${t('submit.title')} - GRANgoTY`
})
</script>
