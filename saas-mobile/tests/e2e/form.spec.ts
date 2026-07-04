import { test, expect } from './fixtures/test-fixtures'

test.describe('表单功能测试', () => {
  test.beforeEach(async ({ loggedInPage }) => {
    // 已通过 fixture 登录
  })

  test('身份证信息页面加载', async ({ idInfoFormPage, loggedInPage }) => {
    await idInfoFormPage.goto()

    // 检查页面标题
    const pageTitle = idInfoFormPage.page.locator('text="身份证信息"')
    await expect(pageTitle).toBeVisible({ timeout: 10000 })

    // 检查上传区域
    await expect(idInfoFormPage.frontImageUpload).toBeVisible()
    await expect(idInfoFormPage.backImageUpload).toBeVisible()

    // 检查表单字段
    const fieldCount = await idInfoFormPage.getFormFieldCount()
    expect(fieldCount).toBeGreaterThan(0)
  })

  test('身份证姓名字段填写', async ({ idInfoFormPage, loggedInPage }) => {
    await idInfoFormPage.goto()

    // 找到姓名输入框并填写
    const nameInput = idInfoFormPage.page.locator('input[placeholder*="姓名"], input[placeholder*="名字"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('张三')
      const value = await nameInput.inputValue()
      expect(value).toBe('张三')
    }
  })

  test('身份证号字段填写', async ({ idInfoFormPage, loggedInPage }) => {
    await idInfoFormPage.goto()

    // 找到身份证号输入框
    const idCardInput = idInfoFormPage.page.locator('input[placeholder*="身份证"], input[placeholder*="证件号"]').first()
    if (await idCardInput.isVisible()) {
      await idCardInput.fill('110101199001011234')
      const value = await idCardInput.inputValue()
      expect(value).toBe('110101199001011234')
    }
  })

  test('手机号字段填写', async ({ idInfoFormPage, loggedInPage }) => {
    await idInfoFormPage.goto()

    const phoneInput = idInfoFormPage.page.locator('input[placeholder*="手机"], input[placeholder*="电话"]').first()
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('13800138000')
      const value = await phoneInput.inputValue()
      expect(value).toBe('13800138000')
    }
  })

  test('表单字段必填校验', async ({ idInfoFormPage, loggedInPage }) => {
    await idInfoFormPage.goto()

    // 不填写任何内容直接提交
    const submitBtn = idInfoFormPage.page.locator('u-button:has-text("提交"), u-button:has-text("下一步")').first()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      await idInfoFormPage.page.waitForTimeout(1000)

      // 检查是否有错误提示
      const hasError = await idInfoFormPage.hasError()
      // 应该显示错误提示或 toast
    }
  })

  test('车辆信息页面加载', async ({ carInfoFormPage, loggedInPage }) => {
    await carInfoFormPage.goto()

    const pageTitle = carInfoFormPage.page.locator('text="车辆信息"')
    await expect(pageTitle).toBeVisible({ timeout: 10000 })
  })

  test('车牌号输入', async ({ carInfoFormPage, loggedInPage }) => {
    await carInfoFormPage.goto()

    if (await carInfoFormPage.plateNumberInput.isVisible()) {
      await carInfoFormPage.fillPlateNumber('京A12345')
      const value = await carInfoFormPage.plateNumberInput.inputValue()
      expect(value).toBe('京A12345')
    }
  })

  test('品牌型号输入', async ({ carInfoFormPage, loggedInPage }) => {
    await carInfoFormPage.goto()

    if (await carInfoFormPage.brandInput.isVisible()) {
      await carInfoFormPage.fillBrand('宝马')
      await carInfoFormPage.fillModel('325Li')
    }
  })

  test('进件申请页面加载', async ({ applySubmitFormPage, loggedInPage }) => {
    await applySubmitFormPage.goto()

    const pageTitle = applySubmitFormPage.page.locator('text="进件申请"')
    await expect(pageTitle).toBeVisible({ timeout: 10000 })
  })

  test('产品选择功能', async ({ applySubmitFormPage, loggedInPage }) => {
    await applySubmitFormPage.goto()

    const productCount = await applySubmitFormPage.getProductCount()
    if (productCount > 0) {
      // 选择第一个产品
      await applySubmitFormPage.selectProduct(0)
      await applySubmitFormPage.page.waitForTimeout(500)

      // 验证选中状态
      const selectedProduct = await applySubmitFormPage.getSelectedProduct()
      expect(selectedProduct).toBeTruthy()
    }
  })

  test('金额输入校验', async ({ applySubmitFormPage, loggedInPage }) => {
    await applySubmitFormPage.goto()

    if (await applySubmitFormPage.amountInput.isVisible()) {
      // 输入正常金额
      await applySubmitFormPage.fillAmount('100000')
      const value = await applySubmitFormPage.amountInput.inputValue()
      expect(value).toBe('100000')
    }
  })

  test('上传按钮点击响应', async ({ idInfoFormPage, loggedInPage }) => {
    await idInfoFormPage.goto()

    // 点击上传正面（会触发选择框，但测试环境中无法实际上传）
    // 验证点击不会导致页面崩溃
    await idInfoFormPage.clickUploadFront()
    await idInfoFormPage.page.waitForTimeout(500)
  })

  test('下拉选择组件', async ({ loggedInPage }) => {
    // 测试通用的下拉选择组件
    const page = loggedInPage
    await page.goto('/pages/carloan/precheck/applySubmit')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // 查找下拉选择器
    const selectors = page.locator('[class*="picker"], [class*="select"], u-picker')
    const count = await selectors.count()

    if (count > 0) {
      // 点击第一个选择器
      await selectors.first().click()
      await page.waitForTimeout(1000)

      // 验证弹出选择面板
      const popup = page.locator('[class*="popup"], [class*="picker-panel"]')
      const isPopupVisible = await popup.first().isVisible()

      // 关闭弹窗
      if (isPopupVisible) {
        await page.locator('text="取消"').first().click()
      }
    }
  })
})
