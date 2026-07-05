import type { Page, Locator } from '@playwright/test'

/**
 * 身份证信息表单页面对象
 */
export class IdInfoFormPage {
  page: Page
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
      ? `pages/carloan/precheck/idInfo?creditOrderId=${orderId}`
      : 'pages/carloan/precheck/idInfo'
    await this.page.goto(url)
    await this.page.waitForTimeout(3000)
  }

  async getFormFieldCount(): Promise<number> {
    return await this.formItems.count()
  }

  async clickUploadFront() {
    await this.frontImageUpload.click()
  }

  async submit() {
    await this.submitButton.click()
    await this.page.waitForTimeout(2000)
  }

  async hasError(): Promise<boolean> {
    const error = this.page.locator('[class*="error"], .u-form-item__error')
    return await error.first().isVisible()
  }
}

/**
 * 车辆信息表单页面对象
 */
export class CarInfoFormPage {
  page: Page
  plateNumberInput: Locator
  brandInput: Locator
  modelInput: Locator
  submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.plateNumberInput = page.locator('input[placeholder*="车牌号"]')
    this.brandInput = page.locator('input[placeholder*="品牌"]')
    this.modelInput = page.locator('input[placeholder*="车型"]')
    this.submitButton = page.locator('u-button:has-text("提交"), .u-button:has-text("下一步")')
  }

  async goto(orderId?: string) {
    const url = orderId
      ? `pages/carloan/precheck/carInfo?creditOrderId=${orderId}`
      : 'pages/carloan/precheck/carInfo'
    await this.page.goto(url)
    await this.page.waitForTimeout(3000)
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

  async submit() {
    await this.submitButton.click()
    await this.page.waitForTimeout(2000)
  }
}

/**
 * 进件申请表单页面对象
 */
export class ApplySubmitFormPage {
  page: Page
  productCards: Locator
  amountInput: Locator
  periodsInput: Locator
  submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.productCards = page.locator('[class*="product-card"]')
    this.amountInput = page.locator('input[placeholder*="金额"], input[placeholder*="额度"]')
    this.periodsInput = page.locator('input[placeholder*="期数"], input[placeholder*="期限"]')
    this.submitButton = page.locator('u-button:has-text("提交申请"), .u-button:has-text("提交")')
  }

  async goto(customerId?: string) {
    const url = customerId
      ? `pages/carloan/precheck/applySubmit?uuid=${customerId}`
      : 'pages/carloan/precheck/applySubmit'
    await this.page.goto(url)
    await this.page.waitForTimeout(3000)
  }

  async selectProduct(index: number) {
    await this.productCards.nth(index).click()
    await this.page.waitForTimeout(500)
  }

  async getProductCount(): Promise<number> {
    return await this.productCards.count()
  }

  async fillAmount(value: string) {
    await this.amountInput.fill(value)
  }

  async submit() {
    await this.submitButton.click()
    await this.page.waitForTimeout(2000)
  }
}
