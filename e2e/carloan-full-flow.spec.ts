import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

const BASE = 'http://localhost:3006'
const API = 'http://localhost:3001/saas/api'

interface LoginResult {
  token: string
  refreshToken: string
}

async function loginViaApi(page: Page, request: APIRequestContext): Promise<LoginResult> {
  const loginRes = await request.post(`${API}/auth/login`, {
    headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': '1' },
    data: { userName: 'Super', password: '123456' },
  })
  expect(loginRes.status()).toBe(200)
  const loginData = await loginRes.json()
  const { token, refreshToken } = loginData.data as LoginResult
  expect(token).toBeTruthy()

  // 先进入应用以共享同源，再注入登录态
  await page.goto(BASE)
  await page.waitForLoadState('domcontentloaded')

  await page.evaluate(({ token, refreshToken }) => {
    // 匹配所有版本化的 user store key，例如 sys-v3.0.2-user
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && /^sys-v[^-]+-user$/.test(key)) {
        keys.push(key)
      }
    }

    // 若没有已存在的 key，则使用当前默认版本构造
    if (keys.length === 0) {
      keys.push('sys-v3.0.2-user')
    }

    keys.forEach((key) => {
      const state = JSON.parse(localStorage.getItem(key) || '{}')
      localStorage.setItem(
        key,
        JSON.stringify({
          ...state,
          accessToken: token,
          refreshToken: refreshToken,
          isLogin: true,
        })
      )
    })
  }, { token, refreshToken })

  // 刷新页面使 Pinia 从 localStorage 恢复登录态
  await page.reload()
  await page.waitForLoadState('networkidle')

  return { token, refreshToken }
}

test.describe('车贷SaaS后台管理 - 浏览器自动化测试', () => {

  test('1. 登录并进入后台', async ({ page, request }) => {
    await loginViaApi(page, request)

    // 验证已进入后台（URL 不再是登录页）
    await expect(page).not.toHaveURL(/\/auth\/login/)

    await page.screenshot({ path: 'e2e/screenshots/01-login.png', fullPage: true })
    console.log('当前URL:', page.url())
  })

  test('2. 导航到数据中心', async ({ page, request }) => {
    await loginViaApi(page, request)

    // 点击数据中心菜单
    const dataCenterMenu = page.locator('text=数据中心, .el-menu-item:has-text("数据中心")').first()
    if (await dataCenterMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dataCenterMenu.click()
      await page.waitForTimeout(1000)
    }

    // 点击统计子菜单
    const statsMenu = page.locator('text=数据统计, .el-menu-item:has-text("数据统计")').first()
    if (await statsMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await statsMenu.click()
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'e2e/screenshots/02-stats.png', fullPage: true })
  })

  test('3. 日志审计页面', async ({ page, request }) => {
    await loginViaApi(page, request)

    // 导航到日志审计
    const auditMenu = page.locator('text=日志审计, .el-menu-item:has-text("日志审计")').first()
    if (await auditMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await auditMenu.click()
      await page.waitForTimeout(2000)
    }

    // 点击数据概览按钮
    const chartBtn = page.locator('button:has-text("数据概览"), .el-button:has-text("数据概览")').first()
    if (await chartBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chartBtn.click()
      await page.waitForTimeout(1000)
      console.log('数据概览抽屉已打开')
    }

    await page.screenshot({ path: 'e2e/screenshots/03-audit-log.png', fullPage: true })
  })

  test('4. 业务管理 - 订单列表', async ({ page, request }) => {
    await loginViaApi(page, request)

    // 导航到订单管理
    const orderMenu = page.locator('text=订单管理, .el-menu-item:has-text("订单管理")').first()
    if (await orderMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orderMenu.click()
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'e2e/screenshots/04-order-list.png', fullPage: true })
  })

  test('5. 平台管理页面', async ({ page, request }) => {
    await loginViaApi(page, request)

    // 点击平台管理菜单
    const platformMenu = page.locator('text=平台管理, .el-sub-menu__title:has-text("平台管理")').first()
    if (await platformMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await platformMenu.click()
      await page.waitForTimeout(1000)
    }

    // 点击套餐与计费
    const packageMenu = page.locator('text=套餐与计费, .el-menu-item:has-text("套餐与计费")').first()
    if (await packageMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await packageMenu.click()
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'e2e/screenshots/05-package-billing.png', fullPage: true })
  })

  test('6. API 全量健康检查', async ({ request }) => {
    // 获取 token
    const loginRes = await request.post(`${API}/auth/login`, {
      headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': '1' },
      data: { userName: 'Super', password: '123456' },
    })
    const loginData = await loginRes.json()
    const token = loginData.data.token

    const endpoints = [
      ['GET', '/org/list?current=1&size=5'],
      ['GET', '/dept/list?current=1&size=5'],
      ['GET', '/user/list?current=1&size=5'],
      ['GET', '/role/list?current=1&size=5'],
      ['GET', '/menu/tree'],
      ['GET', '/dict/type/list?current=1&size=5'],
      ['GET', '/product/list?current=1&size=5'],
      ['GET', '/funder/list?current=1&size=5'],
      ['GET', '/customer/list?current=1&size=5'],
      ['GET', '/lead/list?current=1&size=5'],
      ['GET', '/application/order-list?pageNum=1&pageSize=5'],
      ['GET', '/package-plan/list?current=1&size=5'],
      ['GET', '/product-template/list?current=1&size=5'],
      ['GET', '/third-party-service/list?current=1&size=5'],
      ['GET', '/work-order/list?current=1&size=5'],
      ['GET', '/platform-supervision/stats'],
      ['GET', '/data-center/audit-log/stats'],
      ['GET', '/data-center/stats'],
      ['GET', '/m/enum/loanBusinessNodes'],
      ['GET', '/m/credit/getCreditList?current=1&size=5'],
      ['GET', '/m/credit/getCreditList?status=4&current=1&size=5'],
    ]

    const results: string[] = []
    for (const [method, ep] of endpoints) {
      const res = await request.get(`${API}${ep}`, {
        headers: { 'X-Tenant-ID': '1', Authorization: `Bearer ${token}` },
      })
      const status = res.status()
      const pass = status === 200 ? '✓' : '✗'
      results.push(`${pass} ${method} ${ep}: ${status}`)
    }

    console.log('\n=== API 健康检查结果 ===')
    results.forEach(r => console.log(r))

    const failed = results.filter(r => r.startsWith('✗'))
    expect(failed.length).toBe(0)
  })
})
