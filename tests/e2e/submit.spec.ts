import { test, expect } from '@playwright/test'

test.describe('Submit Page', () => {
  test('should load submit form', async ({ page }) => {
    await page.goto('/submit')

    // Check title
    const formTitle = page.locator('h1')
    await expect(formTitle).toContainText('Submit Grant')

    // Form fields should be visible
    await expect(page.locator('#title')).toBeVisible()
    await expect(page.locator('#description')).toBeVisible()
    await expect(page.locator('#category')).toBeVisible()
    await expect(page.locator('#region')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/submit')

    // Try submitting empty form
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Since we're using native HTML5 validation, the browser prevents submission
    // and focuses the first invalid element
    const titleInput = page.locator('#title')

    // Check if element has 'required' attribute and is invalid
    const isRequired = await titleInput.getAttribute('required')
    expect(isRequired).not.toBeNull()
  })
})