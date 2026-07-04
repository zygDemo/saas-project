import { test as base, type Page } from '@playwright/test'
import { LoginPage } from '../pages/login.page'
import { OrderListPage } from '../pages/order-list.page'
import { IdInfoFormPage, CarInfoFormPage, ApplySubmitFormPage } from '../pages/form.page'

/**
 * 测试 fixtures - 自动注入页面对象
 */
type TestFixtures = {
  loginPage: LoginPage
  orderListPage: OrderListPage
  idInfoFormPage: IdInfoFormPage
  carInfoFormPage: CarInfoFormPage
  applySubmitFormPage: ApplySubmitFormPage
  loggedInPage: Page
}

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }: { page: Page }, use: (r: LoginPage) => Promise<void>) => {
    await use(new LoginPage(page))
  },

  orderListPage: async ({ page }: { page: Page }, use: (r: OrderListPage) => Promise<void>) => {
    await use(new OrderListPage(page))
  },

  idInfoFormPage: async ({ page }: { page: Page }, use: (r: IdInfoFormPage) => Promise<void>) => {
    await use(new IdInfoFormPage(page))
  },

  carInfoFormPage: async ({ page }: { page: Page }, use: (r: CarInfoFormPage) => Promise<void>) => {
    await use(new CarInfoFormPage(page))
  },

  applySubmitFormPage: async ({ page }: { page: Page }, use: (r: ApplySubmitFormPage) => Promise<void>) => {
    await use(new ApplySubmitFormPage(page))
  },

  /**
   * 已登录的页面 fixture
   */
  loggedInPage: async ({ page }: { page: Page }, use: (r: Page) => Promise<void>) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAsAdmin()
    await use(page)
  },
})

export { expect } from '@playwright/test'
