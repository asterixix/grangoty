<template>
  <div class="max-w-2xl">
    <h1 class="text-lg font-bold text-black mb-2">{{ $t('submit.title') }}</h1>
    <p class="text-xs text-hn-gray mb-4">{{ $t('submit.description') }}</p>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Title -->
      <div>
        <label for="title" class="block text-xs font-medium text-hn-gray-dark mb-1">
          {{ $t('submit.grantTitle') }} *
        </label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          class="w-full border border-hn-gray/40 px-2 py-1.5 text-sm focus:outline-none focus:border-hn-orange"
          :placeholder="$t('submit.grantTitlePlaceholder')"
        />
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="block text-xs font-medium text-hn-gray-dark mb-1">
          {{ $t('grants.description') }} *
        </label>
        <textarea
          id="description"
          v-model="form.description"
          required
          rows="4"
          class="w-full border border-hn-gray/40 px-2 py-1.5 text-sm focus:outline-none focus:border-hn-orange"
          :placeholder="$t('submit.descriptionPlaceholder')"
        ></textarea>
      </div>

      <!-- Category & Region -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="category" class="block text-xs font-medium text-hn-gray-dark mb-1">
            {{ $t('submit.category') }}
          </label>
          <select
            id="category"
            v-model="form.category"
            class="w-full border border-hn-gray/40 px-2 py-1.5 text-sm focus:outline-none focus:border-hn-orange"
          >
            <option value="">{{ $t('submit.selectCategory') }}</option>
            <option value="general">General</option>
            <option value="government">Government</option>
            <option value="regional">Regional</option>
            <option value="local">Local</option>
            <option value="european">European</option>
            <option value="environment">Environment</option>
            <option value="social">Social</option>
            <option value="education">Education</option>
          </select>
        </div>
        <div>
          <label for="region" class="block text-xs font-medium text-hn-gray-dark mb-1">
            {{ $t('submit.region') }}
          </label>
          <input
            id="region"
            v-model="form.region"
            type="text"
            class="w-full border border-hn-gray/40 px-2 py-1.5 text-sm focus:outline-none focus:border-hn-orange"
            :placeholder="$t('submit.regionPlaceholder')"
          />
        </div>
      </div>

      <!-- Amount & Currency -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="amount" class="block text-xs font-medium text-hn-gray-dark mb-1">
            {{ $t('submit.amount') }}
          </label>
          <input
            id="amount"
            v-model="form.amount"
            type="number"
            min="0"
            class="w-full border border-hn-gray/40 px-2 py-1.5 text-sm focus:outline-none focus:border-hn-orange"
            :placeholder="$t('submit.amountPlaceholder')"
          />
        </div>
        <div>
          <label for="currency" class="block text-xs font-medium text-hn-gray-dark mb-1">
            {{ $t('submit.currency') }}
          </label>
          <select
            id="currency"
            v-model="form.currency"
            class="w-full border border-hn-gray/40 px-2 py-1.5 text-sm focus:outline-none focus:border-hn-orange"
          >
            <option value="PLN">PLN</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <!-- Deadline -->
      <div>
        <label for="deadline" class="block text-xs font-medium text-hn-gray-dark mb-1">
          {{ $t('submit.deadline') }}
        </label>
        <input
          id="deadline"
          v-model="form.deadline"
          type="date"
          class="w-full border border-hn-gray/40 px-2 py-1.5 text-sm focus:outline-none focus:border-hn-orange"
        />
      </div>

      <!-- Website -->
      <div>
        <label for="website" class="block text-xs font-medium text-hn-gray-dark mb-1">
          {{ $t('submit.website') }}
        </label>
        <input
          id="website"
          v-model="form.website"
          type="url"
          class="w-full border border-hn-gray/40 px-2 py-1.5 text-sm focus:outline-none focus:border-hn-orange"
          :placeholder="$t('submit.websitePlaceholder')"
        />
      </div>

      <!-- Email -->
      <div>
        <label for="email" class="block text-xs font-medium text-hn-gray-dark mb-1">
          {{ $t('submit.email') }}
        </label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="w-full border border-hn-gray/40 px-2 py-1.5 text-sm focus:outline-none focus:border-hn-orange"
          :placeholder="$t('submit.emailPlaceholder')"
        />
      </div>

      <!-- Submit -->
      <div class="flex gap-2 pt-2">
        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-4 py-2 bg-hn-orange text-white text-xs font-medium hover:bg-hn-orange-dark disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-hn-orange focus:ring-offset-2"
        >
          {{ isSubmitting ? $t('common.submitting') : $t('common.submit') }}
        </button>
        <NuxtLink
          :to="localePath('/')"
          class="px-4 py-2 border border-hn-gray text-xs text-hn-gray-dark hover:border-hn-orange hover:text-hn-orange"
        >
          {{ $t('common.cancel') }}
        </NuxtLink>
      </div>

      <!-- Message -->
      <p v-if="message" :class="['text-xs mt-2', isSuccess ? 'text-green-600' : 'text-red-600']">
        {{ message }}
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const form = reactive({
  title: '',
  description: '',
  category: '',
  region: '',
  amount: '',
  currency: 'PLN',
  deadline: '',
  website: '',
  email: ''
})

const isSubmitting = ref(false)
const message = ref('')
const isSuccess = ref(false)

async function handleSubmit() {
  isSubmitting.value = true
  message.value = ''

  try {
    // In production, this would send data to the API
    const submission = {
      ...form,
      amount: form.amount ? parseFloat(form.amount) : undefined
    }

    console.log('Grant submission:', submission)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    message.value = 'Thank you! Your submission has been received and will be reviewed.'
    isSuccess.value = true

    // Reset form
    Object.assign(form, {
      title: '',
      description: '',
      category: '',
      region: '',
      amount: '',
      currency: 'PLN',
      deadline: '',
      website: '',
      email: ''
    })
  } catch (error) {
    console.error('Submission error:', error)
    message.value = 'An error occurred. Please try again.'
    isSuccess.value = false
  } finally {
    isSubmitting.value = false
  }
}

useHead({
  title: `${t('submit.title')} - GRANgoTY`
})
</script>
