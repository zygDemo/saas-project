import type { Page, Locator } from '@playwright/test'

/**
 * 身份证信息表单页面对象
 */
export class IdInfoFormPage {
  private page: Page
  frontImageUpload: Locator
  backImageUpload: Locator
  formItems: Locator
  submitButton: Locator
  saveButton: Locator
  nextButton: Locator

  constructor(page: Page) {
    this.page = page
    this.frontImageUpload = page.locator('[class*="upload-item"]').first()
    this.backImageUpload = page.locator('[class*="upload-item"]').nth(1)
    this.formItems = page.locator('[class*="form-item"], .u-form-item')
    this.submitButton = page.locator('u-button:has-text("提交"), .u-button:has-text("提交")')
    this.saveButton = page.locator('u-button:has-text("保存"), .u-button:has-text("保存")')
    this.nextButton = page.locator('u-button:has-text("下一步"), .u-button:has-text("下一步")')
  }

  async goto(orderId?: string) {
    const url = orderId
      ? `/pages/carloan/precheck/idInfo?creditOrderId=${orderId}`
      : '/pages/carloan/precheck/idInfo'
    await this.page.goto(url)
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(1000)
  }

  /**
   * 填写表单字段（按 placeholder）
   */
  async fillFieldByPlaceholder(placeholder: string, value: string) {
    const input = this.page.locator(`input[placeholder*="${placeholder}"]`).first()
    await input.click()
    await input.fill(value)
    await input.press('Tab') // 触发失焦校验
  }

  /**
   * 填写表单字段（按 label）
   */
  async fillFieldByLabel(label: string, value: string) {
    // 找到 label 对应的输入框
    const formItem = this.page.locator(`text="${label}"`).locator('..').locator('..')
    const input = formItem.locator('input').first()
    await input.click()
    await input.fill(value)
    await input.press('Tab')
  }

  /**
   * 获取表单字段值
   */
  async getFieldValue(placeholder: string): Promise<string> {
    const input = this.page.locator(`input[placeholder*="${placeholder}"]`).first()
    return (await input.inputValue()) || ''
  }

  /**
   * 获取所有表单字段数量
   */
  async getFormFieldCount(): Promise<number> {
    return await this.formItems.count()
  }

  /**
   * 点击上传身份证正面
   */
  async clickUploadFront() {
    await this.frontImageUpload.click()
  }

  /**
   * 点击上传身份证反面
   */
  async clickUploadBack() {
    await this.backImageUpload.click()
  }

  /**
   * 检查是否已上传图片
   */
  async hasFrontImage(): Promise<boolean> {
    const img = this.frontImageUpload.locator('u-image, .u-image')
    return await img.isVisible()
  }

  async hasBackImage(): Promise<boolean> {
    const img = this.backImageUpload.locator('u-image, .u-image')
    return await img.isVisible()
  }

  /**
   * 提交表单
   */
  async submit() {
    await this.submitButton.click()
    await this.page.waitForTimeout(2000)
  }

  /**
   * 保存表单
   */
  async save() {
    await this.saveButton.click()
    await this.page.waitForTimeout(1500)
  }

  /**
   * 点击下一步
   */
  async next() {
    await this.nextButton.click()
    await this.page.waitForTimeout(1500)
  }

  /**
   * 检查是否有错误提示
   */
  async hasError(): Promise<boolean> {
    const error = this.page.locator('[class*="error"], .u-form-item__error')
    return await error.first().isVisible()
  }

  /**
   * 获取错误提示文本
   */
  async getErrorText(): Promise<string> {
    const error = this.page.locator('[class*="error"], .u-form-item__error').first()
    return (await error.textContent()) || ''
  }
}

/**
 * 车辆信息表单页面对象
 */
export class CarInfoFormPage {
  private page: Page
  plateNumberInput: Locator
  brandInput: Locator
  modelInput: Locator
  vinInput: Locator
  submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.plateNumberInput = page.locator('input[placeholder*="车牌号"]')
    this.brandInput = page.locator('input[placeholder*="品牌"]')
    this.modelInput = page.locator('input[placeholder*="车型"]')
    this.vinInput = page.locator('input[placeholder*="车架号"], input[placeholder*="VIN"]')
    this.submitButton = page.locator('u-button:has-text("提交"), .u-button:has-text("下一步")')
  }

  async goto(orderId?: string) {
    const url = orderId
      ? `/pages/carloan/precheck/carInfo?creditOrderId=${orderId}`
      : '/pages/carloan/precheck/carInfo'
    await this.page.goto(url)
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(1000)
  }

  async fillPlateNumber(value: string) {
    await this.plateNumberInput.fill(value)
  }

  async fillBrand(value: string) {
    await this.brandInput.fill(value)
  }

  async fillModel(value: string) {
    await this.modelInput.fill(value)
  }

  async fillVin(value: string) {
    await this.vinInput.fill(value)
  }

  async submit() {
    await this.submitButton.click()
    await this.page.waitForTimeout(2000)
  }
}

/**
 * 进件申请表单页面对象
 */
export class ApplySubmitFormPage {
  private page: Page
  productCards: Locator
  idFrontUpload: Locator
  idBackUpload: Locator
  carLicenseUpload: Locator
  amountInput: Locator
  periodsInput: Locator
  submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.productCards = page.locator('[class*="product-card"]')
    this.idFrontUpload = page.locator('[class*="upload-item"]:has-text("人像面")')
    this.idBackUpload = page.locator('[class*="upload-item"]:has-text("国徽面")')
    this.carLicenseUpload = page.locator('[class*="upload-item"]:has-text("行驶证")')
    this.amountInput = page.locator('input[placeholder*="金额"], input[placeholder*="额度"]')
    this.periodsInput = page.locator('input[placeholder*="期数"], input[placeholder*="期限"]')
    this.submitButton = page.locator('u-button:has-text("提交申请"), .u-button:has-text("提交")')
  }

  async goto(customerId?: string) {
    const url = customerId
      ? `/pages/carloan/precheck/applySubmit?uuid=${customerId}`
      : '/pages/carloan/precheck/applySubmit'
    await this.page.goto(url)
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForTimeout(1000)
  }

  /**
   * 选择产品
   */
  async selectProduct(index: number) {
    await this.productCards.nth(index).click()
    await this.page.waitForTimeout(500)
  }

  /**
   * 获取产品数量
   */
  async getProductCount(): Promise<number> {
    return await this.productCards.count()
  }

  /**
   * 获取选中的产品
   */
  async getSelectedProduct(): Promise<string> {
    const selected = this.page.locator('[class*="product-card"][class*="selected"]')
    return (await selected.first().textContent()) || ''
  }

  async fillAmount(value: string) {
    await this.amountInput.fill(value)
  }

  async fillPeriods(value: string) {
    await this.periodsInput.fill(value)
  }

  async submit() {
    await this.submitButton.click()
    await this.page.waitForTimeout(2000)
  }
}
