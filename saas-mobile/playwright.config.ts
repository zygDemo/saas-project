import { defineConfig, devices } from '@playwright/test'

/**
 * 移动端 H5 自动化测试配置
 * 使用 Playwright 模拟移动设备测试 uni-app H5 版本
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // 移动端测试建议串行执行
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'tests/e2e-report' }],
    ['list'],
  ],
  timeout: 60000, // 每个测试超时 60 秒
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // 模拟移动端视口
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
  webServer: {
    command: 'pnpm dev:h5',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
