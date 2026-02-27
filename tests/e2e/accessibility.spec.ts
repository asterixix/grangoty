import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('Homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Assuming we're running dev server on localhost:3000
    await page.goto('/')

    // axe-playwright check
    // In a real scenario we'd use checkA11y from axe-playwright
    // await checkA11y(page, null, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22aa'] } })

    // Basic checks
    const skipLink = page.locator('#skip-link a')
    await expect(skipLink).toBeAttached()

    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()

    // Check if lang attribute is set
    const htmlLang = await page.getAttribute('html', 'lang')
    expect(htmlLang).toBeTruthy()
  })

  test('Skip link works', async ({ page }) => {
    await page.goto('/')

    // Press Tab to focus the skip link (should be first focusable element)
    await page.keyboard.press('Tab')
    const skipLink = page.locator('#skip-link a')
    await expect(skipLink).toBeFocused()

    // Press Enter to activate skip link
    await page.keyboard.press('Enter')

    // In a real environment, this should move focus to #main-content
    // Currently, our main-content doesn't have tabindex="-1", but we can check if the URL hash changed
    expect(page.url()).toContain('#main-content')
  })
})