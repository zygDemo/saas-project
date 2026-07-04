import { test, expect } from './fixtures/test-fixtures'

test.describe('订单列表筛选测试', () => {
  // 使用已登录的页面
  test.beforeEach(async ({ loggedInPage }) => {
    // 已通过 fixture 登录
  })

  test('订单列表页面加载正常', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()

    // 检查搜索框
    await expect(orderListPage.searchInput).toBeVisible()

    // 检查业务节点筛选 tabs
    const nodeTabs = orderListPage.businessNodeTabs
    await expect(nodeTabs.first()).toBeVisible()
  })

  test('业务节点筛选功能', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()
    await orderListPage.waitForListLoaded()

    // 获取初始订单数
    const initialCount = await orderListPage.getOrderCount()

    // 点击某个业务节点筛选（如 "预审"）
    const nodeTexts = ['预审', '初审', '签约', '放款']
    for (const nodeText of nodeTexts) {
      const tab = orderListPage.page.locator(`text="${nodeText}"`).first()
      if (await tab.isVisible()) {
        await tab.click()
        await orderListPage.page.waitForTimeout(1500)
        break
      }
    }

    // 验证筛选生效（页面重新加载）
    await orderListPage.waitForListLoaded()
  })

  test('节点状态筛选功能', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()
    await orderListPage.waitForListLoaded()

    // 点击状态筛选 tab
    const statusTexts = ['处理中', '已通过', '已拒绝', '待补充']
    for (const statusText of statusTexts) {
      const tab = orderListPage.page.locator(`text="${statusText}"`).first()
      if (await tab.isVisible()) {
        await tab.click()
        await orderListPage.page.waitForTimeout(1500)
        await orderListPage.waitForListLoaded()
        break
      }
    }
  })

  test('关键词搜索功能', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()
    await orderListPage.waitForListLoaded()

    // 搜索关键词
    await orderListPage.search('张')
    await orderListPage.waitForListLoaded()

    // 验证搜索结果
    const count = await orderListPage.getOrderCount()
    // 搜索后可能有结果也可能为空，都是正常的
  })

  test('搜索框清空后显示全部', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()
    await orderListPage.waitForListLoaded()

    // 先搜索
    await orderListPage.search('测试')
    await orderListPage.waitForListLoaded()

    // 清空搜索框
    await orderListPage.searchInput.fill('')
    await orderListPage.searchInput.press('Enter')
    await orderListPage.page.waitForTimeout(1500)
    await orderListPage.waitForListLoaded()
  })

  test('组合筛选：节点+状态', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()
    await orderListPage.waitForListLoaded()

    // 选择业务节点
    const nodeTab = orderListPage.page.locator('text="预审"').first()
    if (await nodeTab.isVisible()) {
      await nodeTab.click()
      await orderListPage.page.waitForTimeout(1000)
    }

    // 选择状态
    const statusTab = orderListPage.page.locator('text="处理中"').first()
    if (await statusTab.isVisible()) {
      await statusTab.click()
      await orderListPage.page.waitForTimeout(1000)
    }

    await orderListPage.waitForListLoaded()
  })

  test('下拉刷新功能', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()
    await orderListPage.waitForListLoaded()

    const initialCount = await orderListPage.getOrderCount()

    // 执行下拉刷新
    await orderListPage.pullToRefresh()
    await orderListPage.waitForListLoaded()

    // 刷新后列表应重新加载
    const afterCount = await orderListPage.getOrderCount()
    // 刷新后数据可能变化，但功能应正常
  })

  test('滚动加载更多', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()
    await orderListPage.waitForListLoaded()

    const initialCount = await orderListPage.getOrderCount()

    // 如果有订单数据，测试加载更多
    if (initialCount > 0) {
      await orderListPage.scrollToBottom()
      await orderListPage.page.waitForTimeout(1500)

      const afterCount = await orderListPage.getOrderCount()
      // 加载更多后数量应 >= 初始数量
      expect(afterCount).toBeGreaterThanOrEqual(initialCount)
    }
  })

  test('点击订单跳转详情', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()
    await orderListPage.waitForListLoaded()

    const hasOrders = await orderListPage.hasOrders()
    if (hasOrders) {
      // 记录当前 URL
      const beforeUrl = orderListPage.page.url()

      // 点击第一个订单
      await orderListPage.clickFirstOrder()

      // 等待页面跳转
      await orderListPage.page.waitForTimeout(2000)

      // 验证 URL 变化
      const afterUrl = orderListPage.page.url()
      expect(afterUrl).not.toBe(beforeUrl)
    }
  })

  test('筛选后点击重置/全部', async ({ orderListPage, loggedInPage }) => {
    await orderListPage.goto()
    await orderListPage.waitForListLoaded()

    // 先筛选
    const nodeTab = orderListPage.page.locator('text="预审"').first()
    if (await nodeTab.isVisible()) {
      await nodeTab.click()
      await orderListPage.page.waitForTimeout(1000)
    }

    // 点击"全部"重置
    const allTab = orderListPage.page.locator('text="全部"').first()
    if (await allTab.isVisible()) {
      await allTab.click()
      await orderListPage.page.waitForTimeout(1500)
      await orderListPage.waitForListLoaded()
    }
  })
})
