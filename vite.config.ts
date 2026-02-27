import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,vue}', 'server/**/*.{ts,vue}'],
      exclude: ['**/*.d.ts', '**/*.{test,spec}.{ts,tsx}', '**/node_modules/**']
    },
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '~/app': path.resolve(__dirname, './app'),
      '~/server': path.resolve(__dirname, './server'),
      '~/tests': path.resolve(__dirname, './tests')
    }
  }
})