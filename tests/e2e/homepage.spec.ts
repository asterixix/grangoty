import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load and display grants feed', async ({ page }) => {
    await page.goto('/')

    // Check title
    await expect(page).toHaveTitle(/NGO Grants Aggregator/i)

    // Wait for feed to load
    const grantFeed = page.locator('.grant-list')
    await expect(grantFeed).toBeVisible()

    // Check if at least one grant card is displayed
    const grantCards = page.locator('.grant-card')
    const count = await grantCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should allow filtering grants', async ({ page }) => {
    await page.goto('/')

    // Wait for grants to load
    await page.waitForSelector('.grant-card')

    // Find search input and type
    const searchInput = page.locator('input#search')
    await searchInput.fill('Mock Grant')

    // Wait for debounce/API request
    await page.waitForTimeout(500)

    // Ensure we still have results
    const grantCards = page.locator('.grant-card')
    const count = await grantCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate to grant details page', async ({ page }) => {
    await page.goto('/')

    // Wait for grants to load
    await page.waitForSelector('.grant-card')

    // Click the first grant title link
    const firstGrantLink = page.locator('.grant-card h3 a').first()
    await firstGrantLink.click()

    // Check if we navigated to a details page
    await expect(page).toHaveURL(/\/grant\/\d+/)

    // Wait for the grant details to render
    const grantTitle = page.locator('h1')
    await expect(grantTitle).toBeVisible()
  })

  test('should change language', async ({ page }) => {
    await page.goto('/')

    // Wait for load
    await page.waitForSelector('.grant-list')

    // Click language dropdown (desktop)
    // In our implementation, hover on group opens it
    const langDropdown = page.locator('.group button').first()
    await langDropdown.hover()

    // Select English ('en')
    const enOption = page.locator('.group-hover\\:block button').filter({ hasText: 'English' })
    await enOption.click()

    // Check if language changed (e.g. hero title updated)
    // Note: Since this is an E2E test, we're relying on the English translation being applied
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBe('en')

    const heroTitle = page.locator('h1')
    await expect(heroTitle).toContainText('Find grants')
  })
})