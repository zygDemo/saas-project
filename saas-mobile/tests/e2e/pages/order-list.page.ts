import type { Page, Locator } from '@playwright/test'

/**
 * 订单列表页面对象 - 包含筛选功能
 */
export class OrderListPage {
  private page: Page
  searchInput: Locator
  searchButton: Locator
  businessNodeTabs: Locator
  nodeStatusTabs: Locator
  orderCards: Locator
  emptyState: Locator
  loadingIndicator: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.locator('input[placeholder*="姓名"], input[placeholder*="手机号"]')
    this.searchButton = page.locator('[class*="search"] u-icon, .u-search__action')
    this.businessNodeTabs = page.locator('[class*="filter-tab"]:not([class*="--sub"])')
    this.nodeStatusTabs = page.locator('[class*="filter-tab--sub"]')
    this.orderCards = page.locator('[class*="order-card"], [class*="OrderCard"]')
    this.emptyState = page.locator('[class*="empty-state"], .u-empty')
    this.loadingIndicator = page.locator('[class*="loading"]')
  }

  async goto() {
    await this.page.goto('/pages/carloan/precheck/orderList')
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(1500)
  }

  /**
   * 搜索订单
   */
  async search(keyword: string) {
    await this.searchInput.fill(keyword)
    // 触发搜索（回车或点击搜索按钮）
    await this.searchInput.press('Enter')
    await this.page.waitForTimeout(1500)
  }

  /**
   * 选择业务节点筛选
   */
  async selectBusinessNode(nodeLabel: string) {
    const tab = this.page.locator(`text="${nodeLabel}"`).first()
    await tab.click()
    await this.page.waitForTimeout(1000)
  }

  /**
   * 选择节点状态筛选
   */
  async selectNodeStatus(statusLabel: string) {
    const tab = this.page.locator(`text="${statusLabel}"`).first()
    await tab.click()
    await this.page.waitForTimeout(1000)
  }

  /**
   * 获取当前选中的业务节点
   */
  async getSelectedBusinessNode(): Promise<string> {
    const selected = this.page.locator('[class*="filter-tab--on"]:not([class*="--sub"])').first()
    return (await selected.textContent()) || ''
  }

  /**
   * 获取当前选中的节点状态
   */
  async getSelectedNodeStatus(): Promise<string> {
    const selected = this.page.locator('[class*="filter-tab--on"][class*="--sub"]').first()
    return (await selected.textContent()) || ''
  }

  /**
   * 获取订单列表数量
   */
  async getOrderCount(): Promise<number> {
    await this.page.waitForTimeout(500)
    return await this.orderCards.count()
  }

  /**
   * 获取第一个订单的信息
   */
  async getFirstOrderInfo() {
    const firstCard = this.orderCards.first()
    return {
      name: await firstCard.locator('[class*="name"], [class*="customer"]').first().textContent(),
      status: await firstCard.locator('[class*="status"], [class*="badge"]').first().textContent(),
      amount: await firstCard.locator('[class*="amount"], [class*="money"]').first().textContent(),
    }
  }

  /**
   * 点击第一个订单查看详情
   */
  async clickFirstOrder() {
    await this.orderCards.first().click()
    await this.page.waitForTimeout(1000)
  }

  /**
   * 下拉刷新
   */
  async pullToRefresh() {
    await this.page.mouse.move(187, 300)
    await this.page.mouse.down()
    await this.page.mouse.move(187, 500, { steps: 10 })
    await this.page.mouse.up()
    await this.page.waitForTimeout(1500)
  }

  /**
   * 滚动到底部加载更多
   */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      const scrollEl = document.querySelector('[class*="order-list-scroll"]')
      if (scrollEl) {
        scrollEl.scrollTop = scrollEl.scrollHeight
      } else {
        window.scrollTo(0, document.body.scrollHeight)
      }
    })
    await this.page.waitForTimeout(1000)
  }

  /**
   * 等待列表加载完成
   */
  async waitForListLoaded() {
    try {
      await this.loadingIndicator.first().waitFor({ state: 'hidden', timeout: 10000 })
    } catch {
      // 可能没有 loading
    }
    await this.page.waitForTimeout(500)
  }

  /**
   * 检查是否有订单数据
   */
  async hasOrders(): Promise<boolean> {
    const count = await this.orderCards.count()
    return count > 0
  }

  /**
   * 检查是否显示空状态
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible()
  }
}
