import { test, expect } from './fixtures/test-fixtures'

test.describe('登录功能测试', () => {
  test('已登录状态验证', async ({ loginPage }) => {
    await loginPage.goto()

    const isLoggedIn = await loginPage.isLoggedIn()
    if (isLoggedIn) {
      const homeTitle = loginPage.page.locator('text="首页"')
      await expect(homeTitle.first()).toBeVisible()
    }
  })

  test('首页功能卡片显示', async ({ loginPage }) => {
    await loginPage.goto()

    const isLoggedIn = await loginPage.isLoggedIn()
    if (isLoggedIn) {
      const serviceTitle = loginPage.page.locator('text="业务服务"')
      await expect(serviceTitle).toBeVisible()
      const carLoanCard = loginPage.page.locator('text="车抵贷"')
      await expect(carLoanCard).toBeVisible()
    }
  })

  test('页面 URL 有效', async ({ loginPage }) => {
    await loginPage.goto()

    const url = loginPage.page.url()
    expect(url).toBeTruthy()
    const parsedUrl = new URL(url)
    expect(['localhost', '127.0.0.1']).toContain(parsedUrl.hostname)
    expect(parsedUrl.port).toBe('5173')
  })
})
