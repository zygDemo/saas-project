import { test, expect } from './fixtures/test-fixtures'

test.describe('订单列表筛选测试', () => {
  test('订单列表页面加载', async ({ loggedInPage }) => {
    const page = loggedInPage

    // 通过 TabBar 点击"订单" tab
    const orderTab = page.locator('text="订单"').first()
    if (await orderTab.isVisible().catch(() => false)) {
      await orderTab.click()
      await page.waitForTimeout(3000)
    }

    // 验证订单列表内容
    const searchInput = page.locator('input[placeholder*="姓名"], input[placeholder*="搜索"], [class*="search"]')
    const orderCards = page.locator('[class*="order-card"], [class*="OrderCard"]')
    const emptyState = page.locator('text="暂无"')

    const hasSearch = await searchInput.first().isVisible().catch(() => false)
    const hasCards = await orderCards.first().isVisible().catch(() => false)
    const isEmpty = await emptyState.first().isVisible().catch(() => false)

    expect(hasSearch || hasCards || isEmpty).toBeTruthy()
  })

  test('筛选区域显示', async ({ loggedInPage }) => {
    const page = loggedInPage

    // 通过 TabBar 进入订单页
    const orderTab = page.locator('text="订单"').first()
    if (await orderTab.isVisible().catch(() => false)) {
      await orderTab.click()
      await page.waitForTimeout(3000)
    }

    // 检查筛选区域
    const filterArea = page.locator('[class*="filter"], [class*="tab"]')
    const hasFilters = await filterArea.first().isVisible().catch(() => false)
    expect(hasFilters).toBeTruthy()
  })

  test('搜索功能', async ({ loggedInPage }) => {
    const page = loggedInPage

    // 进入订单页
    const orderTab = page.locator('text="订单"').first()
    if (await orderTab.isVisible().catch(() => false)) {
      await orderTab.click()
      await page.waitForTimeout(3000)
    }

    // 尝试搜索
    const searchInput = page.locator('input[placeholder*="姓名"], input[placeholder*="搜索"]').first()
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('测试')
      await searchInput.press('Enter')
      await page.waitForTimeout(2000)
    }
  })

  test('筛选 tab 点击', async ({ loggedInPage }) => {
    const page = loggedInPage

    const orderTab = page.locator('text="订单"').first()
    if (await orderTab.isVisible().catch(() => false)) {
      await orderTab.click()
      await page.waitForTimeout(3000)
    }

    // 点击筛选 tab
    const tabs = page.locator('[class*="filter-tab"]')
    const count = await tabs.count()
    if (count > 1) {
      await tabs.nth(1).click()
      await page.waitForTimeout(1500)
    }
  })

  test('订单卡片点击', async ({ loggedInPage }) => {
    const page = loggedInPage

    const orderTab = page.locator('text="订单"').first()
    if (await orderTab.isVisible().catch(() => false)) {
      await orderTab.click()
      await page.waitForTimeout(3000)
    }

    const orderCards = page.locator('[class*="order-card"], [class*="OrderCard"]')
    if (await orderCards.first().isVisible().catch(() => false)) {
      await orderCards.first().click()
      await page.waitForTimeout(2000)
    }
  })

  test('下拉刷新', async ({ loggedInPage }) => {
    const page = loggedInPage

    const orderTab = page.locator('text="订单"').first()
    if (await orderTab.isVisible().catch(() => false)) {
      await orderTab.click()
      await page.waitForTimeout(3000)
    }

    // 模拟下拉刷新
    await page.mouse.move(187, 300)
    await page.mouse.down()
    await page.mouse.move(187, 500, { steps: 10 })
    await page.mouse.up()
    await page.waitForTimeout(2000)
  })

  test('滚动加载', async ({ loggedInPage }) => {
    const page = loggedInPage

    const orderTab = page.locator('text="订单"').first()
    if (await orderTab.isVisible().catch(() => false)) {
      await orderTab.click()
      await page.waitForTimeout(3000)
    }

    // 滚动到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1500)
  })
})
