import type { Page, Locator } from '@playwright/test'

/**
 * 通用测试工具函数
 */
export class TestUtils {
  constructor(private page: Page) {}

  /**
   * 等待 uni-app 页面加载完成
   */
  async waitForPageReady() {
    await this.page.waitForLoadState('networkidle')
    // 等待 uni-app 框架初始化
    await this.page.waitForTimeout(1000)
  }

  /**
   * 通过 placeholder 找到输入框并填写
   */
  async fillByPlaceholder(placeholder: string, value: string) {
    const input = this.page.locator(`input[placeholder="${placeholder}"]`).first()
    await input.click()
    await input.fill(value)
  }

  /**
   * 通过文本内容点击元素
   */
  async clickByText(text: string) {
    await this.page.locator(`text="${text}"`).first().click()
  }

  /**
   * 等待 toast 提示
   */
  async waitForToast(text?: string) {
    const toast = this.page.locator('.u-toast, .uni-toast, [class*="toast"]').first()
    await toast.waitFor({ state: 'visible', timeout: 5000 })
    if (text) {
      await toast.locator(`text="${text}"`).waitFor({ timeout: 3000 })
    }
    return toast
  }

  /**
   * 等待 loading 消失
   */
  async waitForLoadingDone() {
    try {
      await this.page.locator('.u-loading, .uni-loading, [class*="loading"]')
        .first()
        .waitFor({ state: 'hidden', timeout: 15000 })
    } catch {
      // 可能没有 loading 元素
    }
  }

  /**
   * 模拟下拉刷新
   */
  async pullToRefresh() {
    const startY = 300
    const endY = 600
    await this.page.mouse.move(187, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(187, endY, { steps: 10 })
    await this.page.mouse.up()
    await this.page.waitForTimeout(1500)
  }

  /**
   * 模拟滚动到底部
   */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await this.page.waitForTimeout(800)
  }

  /**
   * 截图并保存
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `tests/e2e-screenshots/${name}.png`,
      fullPage: true,
    })
  }

  /**
   * 获取当前页面路径
   */
  getCurrentPath(): Promise<string> {
    return this.page.evaluate(() => window.location.pathname)
  }

  /**
   * 检查元素是否可见
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible()
    } catch {
      return false
    }
  }

  /**
   * 输入文本到 u-input 组件
   */
  async fillUInput(index: number, value: string) {
    const input = this.page.locator('.u-input input, .uni-input input').nth(index)
    await input.click()
    await input.fill(value)
  }

  /**
   * 点击 u-button 按钮
   */
  async clickButton(text: string) {
    const button = this.page.locator(`u-button:has-text("${text}"), .u-button:has-text("${text}")`)
    await button.first().click()
  }
}
