import { defineConfig, devices } from '@playwright/test'

const host = process.env.PLAYWRIGHT_HOST || '127.0.0.1'
const port = process.env.PLAYWRIGHT_PORT || '5173'
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://${host}:${port}/saas/mobile/`
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === '1'

/**
 * 移动端 H5 自动化测试配置。
 * 默认启动本地 H5 服务；已有服务时可设置 PLAYWRIGHT_SKIP_WEB_SERVER=1 复用外部地址。
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
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
    baseURL,
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
  webServer: skipWebServer
    ? undefined
    : {
        command: `pnpm dev:h5 -- --host ${host} --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
})
