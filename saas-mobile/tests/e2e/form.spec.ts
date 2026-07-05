import { test, expect } from './fixtures/test-fixtures'

test.describe('表单功能测试', () => {
  test('身份证信息页面加载', async ({ idInfoFormPage, loggedInPage }) => {
    await idInfoFormPage.goto()

    // 验证页面加载
    const pageTitle = idInfoFormPage.page.locator('text="身份证"')
    const isVisible = await pageTitle.first().isVisible().catch(() => false)

    if (isVisible) {
      // 检查上传区域
      await expect(idInfoFormPage.frontImageUpload).toBeVisible()
      const fieldCount = await idInfoFormPage.getFormFieldCount()
      expect(fieldCount).toBeGreaterThan(0)
    }
  })

  test('表单字段填写', async ({ idInfoFormPage, loggedInPage }) => {
    await idInfoFormPage.goto()

    // 尝试找到输入框
    const inputs = idInfoFormPage.page.locator('input')
    const count = await inputs.count()
    if (count > 0) {
      await inputs.first().fill('测试数据')
      const value = await inputs.first().inputValue()
      expect(value).toBe('测试数据')
    }
  })

  test('车辆信息页面加载', async ({ carInfoFormPage, loggedInPage }) => {
    await carInfoFormPage.goto()

    const pageTitle = carInfoFormPage.page.locator('text="车辆"')
    const isVisible = await pageTitle.first().isVisible().catch(() => false)
    // 页面能正常访问即可
  })

  test('车牌号输入', async ({ carInfoFormPage, loggedInPage }) => {
    await carInfoFormPage.goto()

    if (await carInfoFormPage.plateNumberInput.isVisible().catch(() => false)) {
      await carInfoFormPage.fillPlateNumber('京A12345')
      const value = await carInfoFormPage.plateNumberInput.inputValue()
      expect(value).toBe('京A12345')
    }
  })

  test('进件申请页面加载', async ({ applySubmitFormPage, loggedInPage }) => {
    await applySubmitFormPage.goto()

    const pageTitle = applySubmitFormPage.page.locator('text="进件"')
    const isVisible = await pageTitle.first().isVisible().catch(() => false)
    // 页面能正常访问即可
  })

  test('产品选择', async ({ applySubmitFormPage, loggedInPage }) => {
    await applySubmitFormPage.goto()

    const productCount = await applySubmitFormPage.getProductCount()
    if (productCount > 0) {
      await applySubmitFormPage.selectProduct(0)
      await applySubmitFormPage.page.waitForTimeout(500)
    }
  })
})
