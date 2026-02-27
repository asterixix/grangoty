<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Skip Link -->
    <SkipLink />

    <!-- Header -->
    <Header />

    <!-- Main Content -->
    <main id="main-content" class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-xl shadow-sm border border-slate-200">
        <div class="px-6 py-8">
          <h1 class="text-3xl font-bold text-slate-900 mb-2">
            {{ $t('submit.title') }}
          </h1>
          <p class="text-slate-600 mb-8">
            {{ $t('submit.description') }}
          </p>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Title -->
            <div>
              <label for="title" class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('submit.grantTitle') }} <span class="text-red-600">*</span>
              </label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :placeholder="$t('submit.grantTitlePlaceholder')"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('submit.description') }} <span class="text-red-600">*</span>
              </label>
              <textarea
                id="description"
                v-model="form.description"
                rows="4"
                required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :placeholder="$t('submit.descriptionPlaceholder')"
              ></textarea>
            </div>

            <!-- Category -->
            <div>
              <label for="category" class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('submit.category') }} <span class="text-red-600">*</span>
              </label>
              <select
                id="category"
                v-model="form.category"
                required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">{{ $t('submit.selectCategory') }}</option>
                <option value="general">General</option>
                <option value="environment">Environment</option>
                <option value="social">Social</option>
                <option value="education">Education</option>
                <option value="health">Health</option>
                <option value="culture">Culture</option>
                <option value="youth">Youth</option>
                <option value="sports">Sports</option>
                <option value="international">International</option>
              </select>
            </div>

            <!-- Region -->
            <div>
              <label for="region" class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('submit.region') }} <span class="text-red-600">*</span>
              </label>
              <input
                id="region"
                v-model="form.region"
                type="text"
                required
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :placeholder="$t('submit.regionPlaceholder')"
              />
            </div>

            <!-- Amount -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="amount" class="block text-sm font-medium text-slate-700 mb-1">
                  {{ $t('submit.amount') }}
                </label>
                <input
                  id="amount"
                  v-model="form.amount"
                  type="number"
                  min="0"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  :placeholder="$t('submit.amountPlaceholder')"
                />
              </div>
              <div>
                <label for="currency" class="block text-sm font-medium text-slate-700 mb-1">
                  {{ $t('submit.currency') }}
                </label>
                <select
                  id="currency"
                  v-model="form.currency"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              <label for="deadline" class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('submit.deadline') }}
              </label>
              <input
                id="deadline"
                v-model="form.deadline"
                type="date"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <!-- Website -->
            <div>
              <label for="website" class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('submit.website') }}
              </label>
              <input
                id="website"
                v-model="form.website"
                type="url"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :placeholder="$t('submit.websitePlaceholder')"
              />
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-slate-700 mb-1">
                {{ $t('submit.email') }}
              </label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                :placeholder="$t('submit.emailPlaceholder')"
              />
            </div>

            <!-- Submit Button -->
            <div class="flex items-center justify-end space-x-4 pt-4">
              <NuxtLink
                to="/"
                class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                {{ $t('common.cancel') }}
              </NuxtLink>
              <button
                type="submit"
                :disabled="isSubmitting"
                class="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isSubmitting">
                  {{ $t('common.submitting') }}
                </span>
                <span v-else>
                  {{ $t('common.submit') }}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

async function handleSubmit() {
  isSubmitting.value = true

  try {
    // In production, this would send data to the API
    const submission = {
      ...form,
      amount: form.amount ? parseFloat(form.amount) : undefined
    }

    console.log('Grant submission:', submission)

    // Show success message
    alert('Thank you for your submission! We will review it and add it to our database.')

    // Redirect to home
    router.push('/')
  } catch (error) {
    console.error('Submission error:', error)
    alert('An error occurred while submitting. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}
</script>