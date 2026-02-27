import globals from 'eslint-plugin-vue/lib/configs/recommended.js'
import prettier from 'eslint-config-prettier'
import vuePlugin from 'eslint-plugin-vue'
import vueTsPlugin from '@typescript-eslint/eslint-plugin'
import vueTsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'node_modules',
      '.nuxt',
      '.output',
      'dist',
      'coverage',
      'playwright-report'
    ]
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueTsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    plugins: {
      vue: vuePlugin,
      '@typescript-eslint': vueTsPlugin
    },
    rules: {
      ...vuePlugin.configs.recommended.rules,
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: vueTsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': vueTsPlugin
    },
    rules: {
      ...vueTsPlugin.configs.recommended.rules,
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  prettier
]