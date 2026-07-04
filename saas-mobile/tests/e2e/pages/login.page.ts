import type { Page, Locator } from '@playwright/test'

/**
 * 登录页面对象
 */
export class LoginPage {
  private page: Page
  usernameInput: Locator
  passwordInput: Locator
  loginButton: Locator

  constructor(page: Page) {
    this.page = page
    this.usernameInput = page.locator('input[placeholder="请输入用户名"]')
    this.passwordInput = page.locator('input[placeholder="请输入密码"]')
    this.loginButton = page.locator('u-button:has-text("登 录"), .u-button:has-text("登 录")')
  }

  async goto() {
    await this.page.goto('/pages/auth/login')
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(1000)
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
    await this.page.waitForTimeout(2000)
  }

  async loginAsAdmin() {
    await this.login('Super', '123456')
  }

  async isLoggedIn(): Promise<boolean> {
    const path = await this.page.evaluate(() => window.location.pathname)
    return !path.includes('login')
  }
}
