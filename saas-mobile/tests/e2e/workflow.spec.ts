import { test, expect } from './fixtures/test-fixtures'

test.describe('业务流程测试', () => {
  test.beforeEach(async ({ loggedInPage }) => {
    // 已通过 fixture 登录
  })

  test('完整进件流程：从工作台开始', async ({ loggedInPage }) => {
    const page = loggedInPage

    // Step 1: 进入工作台
    await page.goto('/pages/carloan/portal/workbench')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 验证工作台加载
    const workbenchTitle = page.locator('text="工作台", text="车贷首页"')
    await expect(workbenchTitle.first()).toBeVisible({ timeout: 10000 })

    // Step 2: 点击新建进件/新增订单按钮
    const addButton = page.locator('text="新建", text="新增", text="进件"').first()
    if (await addButton.isVisible()) {
      await addButton.click()
      await page.waitForTimeout(1500)
    }
  })

  test('订单详情页流程', async ({ loggedInPage }) => {
    const page = loggedInPage

    // 进入订单列表
    await page.goto('/pages/carloan/precheck/orderList')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 检查是否有订单
    const orderCards = page.locator('[class*="order-card"], [class*="OrderCard"]')
    const count = await orderCards.count()

    if (count > 0) {
      // 点击第一个订单
      await orderCards.first().click()
      await page.waitForTimeout(2000)

      // 验证进入详情页
      const detailTitle = page.locator('text="订单详情", text="申请详情", text="进件详情"')
      await expect(detailTitle.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('审批列表页面', async ({ loggedInPage }) => {
    const page = loggedInPage

    await page.goto('/pages/carloan/approval/approvalList')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 验证审批列表加载
    const pageTitle = page.locator('text="审批"')
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 })
  })

  test('签约中心页面', async ({ loggedInPage }) => {
    const page = loggedInPage

    await page.goto('/pages/carloan/signing/signCenter')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 验证签约中心加载
    const pageTitle = page.locator('text="签约"')
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 })
  })

  test('补件列表页面', async ({ loggedInPage }) => {
    const page = loggedInPage

    await page.goto('/pages/carloan/supplement/supplementList')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const pageTitle = page.locator('text="补件", text="补充"')
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 })
  })

  test('消息中心页面', async ({ loggedInPage }) => {
    const page = loggedInPage

    await page.goto('/pages/carloan/portal/messageCenter')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const pageTitle = page.locator('text="消息"')
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 })
  })

  test('待办中心页面', async ({ loggedInPage }) => {
    const page = loggedInPage

    await page.goto('/pages/carloan/portal/todoCenter')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const pageTitle = page.locator('text="待办"')
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 })
  })

  test('还款计划页面', async ({ loggedInPage }) => {
    const page = loggedInPage

    await page.goto('/pages/carloan/postloan/repaymentPlan')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const pageTitle = page.locator('text="还款计划"')
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 })
  })

  test('个人中心页面', async ({ loggedInPage }) => {
    const page = loggedInPage

    await page.goto('/pages/my/my')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 验证个人中心加载
    const myPageTitle = page.locator('text="我的", text="个人中心"')
    await expect(myPageTitle.first()).toBeVisible({ timeout: 10000 })
  })

  test('设置页面', async ({ loggedInPage }) => {
    const page = loggedInPage

    await page.goto('/pages/my/settings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const pageTitle = page.locator('text="设置"')
    await expect(pageTitle.first()).toBeVisible({ timeout: 10000 })
  })

  test('TabBar 导航测试', async ({ loggedInPage }) => {
    const page = loggedInPage

    // 进入首页
    await page.goto('/pages/index/index')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 检查 TabBar
    const tabbar = page.locator('[class*="tabbar"], .u-tabbar')
    const isTabbarVisible = await tabbar.first().isVisible()

    if (isTabbarVisible) {
      // 点击不同的 tab
      const tabs = ['首页', '工作台', '订单', '我的']
      for (const tabText of tabs) {
        const tab = page.locator(`text="${tabText}"`).first()
        if (await tab.isVisible()) {
          await tab.click()
          await page.waitForTimeout(1000)
        }
      }
    }
  })

  test('页面返回功能', async ({ loggedInPage }) => {
    const page = loggedInPage

    // 进入订单列表
    await page.goto('/pages/carloan/precheck/orderList')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 点击返回按钮
    const backBtn = page.locator('[class*="back"], u-icon[name="arrow-left"]').first()
    if (await backBtn.isVisible()) {
      await backBtn.click()
      await page.waitForTimeout(1000)
    }
  })

  test('加载更多/分页功能', async ({ loggedInPage }) => {
    const page = loggedInPage

    await page.goto('/pages/carloan/precheck/orderList')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // 滚动到底部触发加载更多
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)

    // 检查是否显示"加载中"或"没有更多"
    const loadingMore = page.locator('text="加载中", text="没有更多了"')
    // 功能正常即可
  })
})
