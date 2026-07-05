import { test as base, type Page } from '@playwright/test'
import { LoginPage } from '../pages/login.page'
import { OrderListPage } from '../pages/order-list.page'
import { IdInfoFormPage, CarInfoFormPage, ApplySubmitFormPage } from '../pages/form.page'

type TestFixtures = {
  loginPage: LoginPage
  orderListPage: OrderListPage
  idInfoFormPage: IdInfoFormPage
  carInfoFormPage: CarInfoFormPage
  applySubmitFormPage: ApplySubmitFormPage
  loggedInPage: Page
}

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },

  orderListPage: async ({ page }, use) => {
    await use(new OrderListPage(page))
  },

  idInfoFormPage: async ({ page }, use) => {
    await use(new IdInfoFormPage(page))
  },

  carInfoFormPage: async ({ page }, use) => {
    await use(new CarInfoFormPage(page))
  },

  applySubmitFormPage: async ({ page }, use) => {
    await use(new ApplySubmitFormPage(page))
  },

  /**
   * 已登录的页面 fixture
   * 先访问首页，检查是否已登录，否则执行登录
   */
  loggedInPage: async ({ page }, use) => {
    await page.goto('pages/index/index')
    await page.waitForTimeout(3000)

    // 检查是否需要登录
    const isLoggedIn = await page.locator('text="首页"').first().isVisible()
    if (!isLoggedIn) {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await page.waitForTimeout(2000)
      await loginPage.loginAsAdmin()
      await page.waitForTimeout(3000)
    }

    await use(page)
  },
})

export { expect } from '@playwright/test'
