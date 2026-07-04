import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3006'
const API = 'http://localhost:3001/saas/api'

test.describe('车贷SaaS后台管理 - 浏览器自动化测试', () => {

  test('1. 登录并进入后台', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState('networkidle')

    // 等待页面加载
    await page.waitForTimeout(2000)

    // 检查是否有登录表单
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"], input[name="userName"]').first()
    const passwordInput = page.locator('input[placeholder*="密码"], input[type="password"]').first()

    if (await usernameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await usernameInput.fill('Super')
      await passwordInput.fill('123456')
      const loginBtn = page.locator('button:has-text("登录"), button:has-text("Login"), button[type="submit"]').first()
      await loginBtn.click()
      await page.waitForTimeout(3000)
    }

    // 截图
    await page.screenshot({ path: 'e2e/screenshots/01-login.png', fullPage: true })
    console.log('当前URL:', page.url())
  })

  test('2. 导航到数据中心', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)

    // 尝试登录
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"], input[name="userName"]').first()
    if (await usernameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await usernameInput.fill('Super')
      await page.locator('input[type="password"]').first().fill('123456')
      await page.locator('button:has-text("登录"), button[type="submit"]').first().click()
      await page.waitForTimeout(3000)
    }

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

  test('3. 日志审计页面', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)

    // 登录
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"], input[name="userName"]').first()
    if (await usernameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await usernameInput.fill('Super')
      await page.locator('input[type="password"]').first().fill('123456')
      await page.locator('button:has-text("登录"), button[type="submit"]').first().click()
      await page.waitForTimeout(3000)
    }

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

  test('4. 业务管理 - 订单列表', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)

    // 登录
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"], input[name="userName"]').first()
    if (await usernameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await usernameInput.fill('Super')
      await page.locator('input[type="password"]').first().fill('123456')
      await page.locator('button:has-text("登录"), button[type="submit"]').first().click()
      await page.waitForTimeout(3000)
    }

    // 导航到订单管理
    const orderMenu = page.locator('text=订单管理, .el-menu-item:has-text("订单管理")').first()
    if (await orderMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
      await orderMenu.click()
      await page.waitForTimeout(2000)
    }

    await page.screenshot({ path: 'e2e/screenshots/04-order-list.png', fullPage: true })
  })

  test('5. 平台管理页面', async ({ page }) => {
    await page.goto(BASE)
    await page.waitForTimeout(2000)

    // 登录
    const usernameInput = page.locator('input[placeholder*="用户名"], input[placeholder*="账号"], input[name="userName"]').first()
    if (await usernameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await usernameInput.fill('Super')
      await page.locator('input[type="password"]').first().fill('123456')
      await page.locator('button:has-text("登录"), button[type="submit"]').first().click()
      await page.waitForTimeout(3000)
    }

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
