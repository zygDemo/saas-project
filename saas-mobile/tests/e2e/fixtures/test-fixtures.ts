import process from 'node:process'
import { test as base } from '@playwright/test'
import type { Page } from '@playwright/test'
import { LoginPage } from '../pages/login.page'
import { OrderListPage } from '../pages/order-list.page'
import { IdInfoFormPage, CarInfoFormPage, ApplySubmitFormPage } from '../pages/form.page'

interface TestFixtures {
  loginPage: LoginPage
  orderListPage: OrderListPage
  idInfoFormPage: IdInfoFormPage
  carInfoFormPage: CarInfoFormPage
  applySubmitFormPage: ApplySubmitFormPage
  loggedInPage: Page
}

interface MobileAuthState {
  token: string
  refreshToken: string
}

let cachedMobileAuthState: MobileAuthState | null = null

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

  loggedInPage: async ({ page }, use) => {
    await seedMobileAuth(page)
    await page.goto('./#/pages/index/index')
    await page.waitForTimeout(3000)
    await use(page)
  },
})

export { expect } from '@playwright/test'

async function seedMobileAuth(page: Page) {
  const apiBaseURL = process.env.PLAYWRIGHT_API_BASE_URL || 'http://127.0.0.1:3001/saas/api'
  const tenantId = process.env.PLAYWRIGHT_TENANT_ID || '1'
  const username = process.env.PLAYWRIGHT_USERNAME || 'Super'
  const password = process.env.PLAYWRIGHT_PASSWORD || '123456'
  const authState = cachedMobileAuthState || (await requestMobileAuth(page, apiBaseURL, tenantId, username, password))
  cachedMobileAuthState = authState

  const now = Date.now()
  await page.goto('./')
  await page.evaluate(
    ({ authState, now }) => {
      window.localStorage.setItem(
        'local-store',
        JSON.stringify({
          token: authState.token,
          refreshToken: authState.refreshToken,
          userInfo: {
            userId: 4,
            userName: 'Super',
            username: 'Super',
            realName: 'Super',
            orgId: 1,
            deptId: '',
            roles: [{ roleId: 1, roleName: 'Super', roleKey: 'R_SUPER' }],
            roleKeys: ['R_SUPER'],
            permissions: ['*:*:*'],
          },
          orgId: 1,
          deptId: '',
          roles: [{ roleId: 1, roleName: 'Super', roleKey: 'R_SUPER' }],
          roleKeys: ['R_SUPER'],
          permissions: ['*:*:*'],
          currentSystem: 'carloan',
          mobileConfig: null,
          loginTime: now,
          expireTime: now + 2 * 60 * 60 * 1000,
        }),
      )
    },
    { authState, now },
  )
}

async function requestMobileAuth(
  page: Page,
  apiBaseURL: string,
  tenantId: string,
  username: string,
  password: string,
): Promise<MobileAuthState> {
  const response = await page.request.post(`${apiBaseURL}/auth/login`, {
    headers: {
      'X-Tenant-ID': tenantId,
    },
    data: {
      userName: username,
      password,
    },
  })

  const result = await response.json().catch(() => null)
  const payload = result?.data || result || {}
  const rawToken = payload.token || payload.accessToken || result?.token || ''
  const token = String(rawToken).replace(/^Bearer\s+/i, '').trim()
  const refreshToken = String(payload.refreshToken || result?.refreshToken || '')

  if (!response.ok() || result?.code !== 200 || !token) {
    throw new Error(`Mobile test login failed: ${result?.msg || response.statusText()}`)
  }

  return { token, refreshToken }
}
