<template>
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <NuxtLink to="/" class="flex items-center">
            <div class="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
              <Icon name="filter" size="md" class="text-white" />
            </div>
            <span class="text-xl font-bold text-slate-900">
              {{ $t('nav.title') }}
            </span>
          </NuxtLink>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center space-x-4">
          <NuxtLink
            to="/"
            class="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50"
          >
            {{ $t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            to="/submit"
            class="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50"
          >
            {{ $t('nav.submit') }}
          </NuxtLink>
          <div class="relative group">
            <button class="flex items-center text-slate-700 hover:text-primary-600 px-3 py-2">
              <span class="mr-1">{{ getLocaleName(currentLocale) }}</span>
              <Icon name="chevron-down" size="sm" class="text-slate-400" />
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
              <button
                v-for="locale in availableLocales"
                :key="locale.code"
                @click="setLocale(locale.code)"
                class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 w-full text-left"
              >
                {{ locale.name }}
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile menu button -->
        <div class="flex items-center md:hidden">
          <button
            @click="toggleMobileMenu"
            class="inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:text-primary-600 hover:bg-slate-50 focus:outline-none"
          >
            <Icon
              v-if="!isMobileMenuOpen"
              name="menu"
              size="md"
            />
            <Icon
              v-else
              name="close"
              size="md"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div
      v-if="isMobileMenuOpen"
      class="md:hidden bg-white border-t border-slate-200"
    >
      <div class="px-2 pt-2 pb-3 space-y-1">
        <NuxtLink
          to="/"
          class="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50"
        >
          {{ $t('nav.home') }}
        </NuxtLink>
        <NuxtLink
          to="/submit"
          class="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-primary-600 hover:bg-slate-50"
        >
          {{ $t('nav.submit') }}
        </NuxtLink>
        <div class="px-3 py-2">
          <label class="block text-sm font-medium text-slate-700 mb-2">
            {{ $t('nav.language') }}
          </label>
          <div class="space-y-1">
            <button
              v-for="locale in availableLocales"
              :key="locale.code"
              @click="setLocale(locale.code)"
              :class="[
                'block w-full text-left px-3 py-2 rounded-md text-base font-medium',
                currentLocale === locale.code
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-700 hover:bg-slate-50'
              ]"
            >
              {{ locale.name }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useUiStore } from '~/app/stores/ui'
import { useLocaleStore } from '~/app/stores/locale'

const uiStore = useUiStore()
const localeStore = useLocaleStore()

const { isMobileMenuOpen, toggleMobileMenu } = uiStore
const { currentLocale, availableLocales, setLocale, getLocaleName } = localeStore
</script>