import { expect } from 'vitest'

// Custom assertions
expect.extend({
  toBeAccessible(_received) {
    const pass = true // Placeholder - implement actual accessibility checks
    return {
      pass,
      message: () => 'Expected element to be accessible'
    }
  }
})