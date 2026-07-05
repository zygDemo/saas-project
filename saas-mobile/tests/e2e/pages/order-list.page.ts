import type { Page, Locator } from '@playwright/test'

/**
 * 订单列表页面对象 - 包含筛选功能
 */
export class OrderListPage {
  page: Page
  searchInput: Locator
  businessNodeTabs: Locator
  nodeStatusTabs: Locator
  orderCards: Locator
  emptyState: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.locator('input[placeholder*="姓名"], input[placeholder*="手机号"], input[placeholder*="搜索"]')
    this.businessNodeTabs = page.locator('[class*="filter-tab"]:not([class*="--sub"])')
    this.nodeStatusTabs = page.locator('[class*="filter-tab--sub"]')
    this.orderCards = page.locator('[class*="order-card"], [class*="OrderCard"]')
    this.emptyState = page.locator('[class*="empty-state"], .u-empty')
  }

  async goto() {
    await this.page.goto('pages/carloan/precheck/orderList')
    await this.page.waitForTimeout(3000)
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword)
    await this.searchInput.press('Enter')
    await this.page.waitForTimeout(2000)
  }

  async selectBusinessNode(nodeLabel: string) {
    const tab = this.page.locator(`text="${nodeLabel}"`).first()
    await tab.click()
    await this.page.waitForTimeout(1500)
  }

  async getOrderCount(): Promise<number> {
    await this.page.waitForTimeout(500)
    return await this.orderCards.count()
  }

  async clickFirstOrder() {
    await this.orderCards.first().click()
    await this.page.waitForTimeout(2000)
  }

  async pullToRefresh() {
    await this.page.mouse.move(187, 300)
    await this.page.mouse.down()
    await this.page.mouse.move(187, 500, { steps: 10 })
    await this.page.mouse.up()
    await this.page.waitForTimeout(2000)
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await this.page.waitForTimeout(1500)
  }

  async hasOrders(): Promise<boolean> {
    return (await this.orderCards.count()) > 0
  }
}
