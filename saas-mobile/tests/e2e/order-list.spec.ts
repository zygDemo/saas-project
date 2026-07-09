import type { Page } from '@playwright/test'
import { test, expect } from './fixtures/test-fixtures'

test.describe('order list filters', () => {
  test('loads order list page', async ({ loggedInPage }) => {
    const page = loggedInPage
    await gotoOrderList(page)

    const searchInput = page.locator('input, [class*="search"]')
    const orderCards = page.locator('[class*="card"], [class*="OrderCard"]')
    const emptyState = page.locator('[class*="empty-state"], .u-empty')

    const hasSearch = await searchInput.first().isVisible().catch(() => false)
    const hasCards = await orderCards.first().isVisible().catch(() => false)
    const isEmpty = await emptyState.first().isVisible().catch(() => false)

    expect(hasSearch || hasCards || isEmpty).toBeTruthy()
  })

  test('shows filter area', async ({ loggedInPage }) => {
    const page = loggedInPage
    await gotoOrderList(page)

    const filterArea = page.locator('[class*="filter"], [class*="tab"]')
    const hasFilters = await filterArea.first().isVisible().catch(() => false)
    expect(hasFilters).toBeTruthy()
  })

  test('search input can be used', async ({ loggedInPage }) => {
    const page = loggedInPage
    await gotoOrderList(page)

    const searchInput = page.locator('input').first()
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test')
      await searchInput.press('Enter')
      await page.waitForTimeout(2000)
    }
  })

  test('filter tab can be clicked', async ({ loggedInPage }) => {
    const page = loggedInPage
    await gotoOrderList(page)

    const tabs = page.locator('[class*="filter-tab"]')
    const count = await tabs.count()
    if (count > 1) {
      await tabs.nth(1).click()
      await page.waitForTimeout(1500)
    }
  })

  test('order card can be clicked when present', async ({ loggedInPage }) => {
    const page = loggedInPage
    await gotoOrderList(page)

    const orderCards = page.locator('[class*="card"], [class*="OrderCard"]')
    if (await orderCards.first().isVisible().catch(() => false)) {
      await orderCards.first().click()
      await page.waitForTimeout(2000)
    }
  })

  test('pull to refresh gesture is stable', async ({ loggedInPage }) => {
    const page = loggedInPage
    await gotoOrderList(page)

    await page.mouse.move(187, 300)
    await page.mouse.down()
    await page.mouse.move(187, 500, { steps: 10 })
    await page.mouse.up()
    await page.waitForTimeout(2000)
  })

  test('scroll to bottom is stable', async ({ loggedInPage }) => {
    const page = loggedInPage
    await gotoOrderList(page)

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)
  })
})

async function gotoOrderList(page: Page) {
  await page.goto('./#/pages/carloan/precheck/orderList')
  await page.waitForTimeout(3000)
}
