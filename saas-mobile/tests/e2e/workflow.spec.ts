import { test, expect } from './fixtures/test-fixtures'

test.describe('业务流程测试', () => {
  const pages = [
    { name: '工作台', path: 'pages/carloan/portal/workbench' },
    { name: '订单列表', path: 'pages/carloan/precheck/orderList' },
    { name: '审批列表', path: 'pages/carloan/approval/approvalList' },
    { name: '签约中心', path: 'pages/carloan/signing/signCenter' },
    { name: '补件列表', path: 'pages/carloan/supplement/supplementList' },
    { name: '消息中心', path: 'pages/carloan/portal/messageCenter' },
    { name: '待办中心', path: 'pages/carloan/portal/todoCenter' },
    { name: '还款计划', path: 'pages/carloan/postloan/repaymentPlan' },
    { name: '个人中心', path: 'pages/my/my' },
    { name: '设置', path: 'pages/my/settings' },
  ]

  for (const { name, path } of pages) {
    test(`${name}页面可访问`, async ({ loggedInPage }) => {
      const page = loggedInPage
      await page.goto(path)
      await page.waitForTimeout(3000)

      // 验证页面已加载（不崩溃、有内容）
      const bodyText = await page.locator('body').innerText().catch(() => '')
      expect(bodyText.length).toBeGreaterThan(0)
    })
  }

  test('TabBar 导航', async ({ loggedInPage }) => {
    const page = loggedInPage
    await page.goto('pages/index/index')
    await page.waitForTimeout(3000)

    // 检查是否有导航栏
    const nav = page.locator('[class*="tabbar"], [class*="nav"]')
    const hasNav = await nav.first().isVisible().catch(() => false)
    expect(hasNav).toBeTruthy()
  })

  test('页面返回', async ({ loggedInPage }) => {
    const page = loggedInPage

    // 进入子页面
    await page.goto('pages/carloan/precheck/orderList')
    await page.waitForTimeout(2000)

    // 点击返回按钮
    const backBtn = page.locator('[class*="back"], u-icon[name="arrow-left"]').first()
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click()
      await page.waitForTimeout(1000)
    }
  })
})
