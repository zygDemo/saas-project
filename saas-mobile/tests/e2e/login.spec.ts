import { test, expect } from './fixtures/test-fixtures'

test.describe('登录功能测试', () => {
  test('页面加载正常，显示登录表单', async ({ loginPage }) => {
    await loginPage.goto()

    // 检查页面标题
    await expect(loginPage.page.locator('text="账号登录"')).toBeVisible()
    await expect(loginPage.page.locator('text="予艺助手"')).toBeVisible()

    // 检查输入框
    await expect(loginPage.usernameInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()

    // 检查按钮
    await expect(loginPage.loginButton).toBeVisible()
  })

  test('用户名为空时提示错误', async ({ loginPage }) => {
    await loginPage.goto()

    // 清空用户名
    await loginPage.usernameInput.fill('')
    await loginPage.passwordInput.fill('123456')
    await loginPage.loginButton.click()

    // 等待 toast 提示
    const toast = loginPage.page.locator('text="请输入用户名"')
    await expect(toast).toBeVisible({ timeout: 5000 })
  })

  test('密码少于6位时提示错误', async ({ loginPage }) => {
    await loginPage.goto()

    await loginPage.usernameInput.fill('testuser')
    await loginPage.passwordInput.fill('12345')
    await loginPage.loginButton.click()

    const toast = loginPage.page.locator('text="密码不能少于6位"')
    await expect(toast).toBeVisible({ timeout: 5000 })
  })

  test('使用演示账号登录成功', async ({ loginPage }) => {
    await loginPage.goto()

    // 使用默认演示账号
    await loginPage.loginAsAdmin()

    // 验证跳转到非登录页
    await loginPage.page.waitForURL('**/!(login)**', { timeout: 15000 })
    const currentPath = await loginPage.page.evaluate(() => window.location.pathname)
    expect(currentPath).not.toContain('login')
  })

  test('错误密码登录失败', async ({ loginPage }) => {
    await loginPage.goto()

    await loginPage.usernameInput.fill('Super')
    await loginPage.passwordInput.fill('wrongpassword')
    await loginPage.loginButton.click()

    // 等待错误提示
    const toast = loginPage.page.locator('[class*="toast"], text="登录失败"')
    await expect(toast.first()).toBeVisible({ timeout: 10000 })
  })
})
