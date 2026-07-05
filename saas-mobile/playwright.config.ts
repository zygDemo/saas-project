import { defineConfig, devices } from '@playwright/test'

/**
 * 移动端 H5 自动化测试配置
 * 使用 Playwright 模拟移动设备测试 uni-app H5 版本
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0, // 不重试
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'tests/e2e-report' }],
    ['list'],
  ],
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:5173/saas/mobile/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  },
  projects: [
    {
      name: 'iPhone-14',
      use: {
        browserName: 'chromium',
        ...devices['iPhone 14'],
      },
    },
  ],
  // 不自动启动 dev server，重用已有的
  webServer: undefined,
})
