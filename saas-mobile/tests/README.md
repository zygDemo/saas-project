# 移动端 E2E 自动化测试

基于 Playwright 的移动端 H5 自动化测试，使用浏览器模拟 iPhone 14 测试 uni-app H5 版本。

## 测试覆盖范围

###1 登录功能测试 (`login.spec.ts`)
- 页面加载正常
- 用户名为空校验
- 密码长度校验
- 正确账号登录成功
- 错误密码登录失败

### 2. 订单列表筛选测试 (`order-list.spec.ts`)
- 列表页面加载
- 业务节点筛选（预审、初审、签约、放款等）
- 节点状态筛选（处理中、已通过、已拒绝等）
- 关键词搜索功能
- 组合筛选
- 下拉刷新
- 滚动加载更多
- 点击订单跳转详情

### 3. 表单功能测试 (`form.spec.ts`)
- 身份证信息页面加载
- 姓名、身份证号、手机号填写
- 必填字段校验
- 车辆信息填写
- 进件申请产品选择
- 金额输入校验
- 上传按钮响应
- 下拉选择组件

### 4. 业务流程测试 (`workflow.spec.ts`)
- 工作台页面加载
- 订单详情页流程
- 审批列表页面
- 签约中心页面
- 补件列表页面
- 消息中心页面
- 待办中心页面
- 还款计划页面
- 个人中心页面
- 设置页面
- TabBar 导航
- 页面返回功能
- 分页加载功能

## 运行测试

### 前置条件
1. 确保后端服务运行中 (saas-api)
2. 确保前端 H5 服务可访问

### 运行所有测试
```bash
pnpm test
```

### 带界面运行（可视化）
```bash
pnpm test:ui
```

### 有头模式运行（看到浏览器）
```bash
pnpm test:headed
```

### 调试模式
```bash
pnpm test:debug
```

### 查看测试报告
```bash
pnpm test:report
```

## 测试目录结构

```
tests/
├── e2e/
│   ├── fixtures/         # 测试夹具
│   │   └── test-fixtures.ts
│   ├── pages/            # 页面对象模型
│   │   ├── login.page.ts
│   │   ├── order-list.page.ts
│   │   └── form.page.ts
│   ├── utils/            # 测试工具
│   │   └── test-utils.ts
│   ├── login.spec.ts     # 登录测试
│   ├── order-list.spec.ts # 列表筛选测试
│   ├── form.spec.ts      # 表单测试
│   └── workflow.spec.ts  # 流程测试
├── e2e-report/           # 测试报告
└── e2e-screenshots/      # 失败截图
```

## 配置说明

### playwright.config.ts
- 使用 iPhone 14 设备模拟
- 视口: 375x812
- 自动启动 H5 dev server
- 超时: 60秒
- 失败时截图和录屏

## 编写新测试

### 使用页面对象
```typescript
import { test, expect } from '../fixtures/test-fixtures'

test('新测试', async ({ loginPage, orderListPage }) => {
  await loginPage.goto()
  await loginPage.loginAsAdmin()
  
  await orderListPage.goto()
  await orderListPage.search('测试')
})
```

### 使用已登录 fixture
```typescript
test('需要登录的测试', async ({ loggedInPage }) => {
  const page = loggedInPage
  await page.goto('/some/page')
})
```

## 常见问题

### 1. 测试超时
- 检查后端服务是否运行
- 检查网络连接
- 增加 timeout 配置

### 2. 元素找不到
- 检查页面是否加载完成
- 使用 `page.waitForTimeout()` 等待
- 使用 `test:headed` 模式查看实际页面

### 3. 登录失败
- 确认测试账号密码正确
- 检查后端认证服务

## CI/CD 集成

```yaml
# GitHub Actions 示例
- name: Run E2E Tests
  run: |
    pnpm test
    pnpm test:report
```
