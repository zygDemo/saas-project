# AGENTS.md — CarLoanH5 / 嗨车无忧

> This file is intended for AI coding agents. It describes the project architecture, technology stack, conventions, and workflows.
> 本文件供 AI 编码代理阅读，描述项目架构、技术栈、开发规范和工作流程。

---

## 项目概述（Project Overview）

**CarLoanH5**（产品名"嗨车无忧"）是一款基于 **uni-app 3 + Vue 3 + TypeScript** 开发的跨平台移动端应用，面向汽车贷款/金融业务场景。

- **项目模板来源**：基于 [uView Pro Starter](https://starter.uviewpro.cn) 搭建
- **UI 框架**：uview-pro（uni-app Vue3 多平台 UI 框架）
- **支持平台**：H5、微信小程序（mp-weixin）、Android App、iOS App、HarmonyOS、支付宝小程序、百度小程序、抖音小程序、QQ 小程序、快手小程序、京东小程序、飞书小程序、小红书小程序、钉钉小程序、快应用等
- **应用标识**：`__UNI__A86ECA0`
- **微信小程序 AppID**：`wxbb176981bffc17fe`

---

## 技术栈（Technology Stack）

| 层级 | 技术 |
|------|------|
| 框架 | uni-app 3.0 + Vue 3.4（Composition API） |
| 语言 | TypeScript 5.9（strict 模式） |
| 构建工具 | Vite 5.2.8 + `@dcloudio/vite-plugin-uni` |
| UI 库 | uview-pro ^0.5.16 |
| 状态管理 | Pinia 2.2.4 + pinia-plugin-persistedstate |
| 样式 | SCSS 1.64.2 + UnoCSS 66.0.0 |
| 国际化 | vue-i18n 9.1.9 |
| 路由 | vue-router 4.5.1 |
| 分页组件 | z-paging ^2.8.8 |
| 调试工具 | vConsole 3.15.1（H5 条件加载） |
| 包管理器 | pnpm（>= 7.30） |
| Node 版本 | >= 18 |

---

## 目录结构（Directory Structure）

```
src/
├── api/                # API 请求层（按业务域分组）
│   ├── index.ts        # 通用 API 示例
│   ├── auth.ts         # 认证相关（登录、刷新 Token、用户信息）
│   └── business.ts     # 业务相关（身份、车辆、进件、产品等）
├── common/             # 公共工具、常量、拦截器、全局样式
│   ├── constant.ts     # 应用常量、平台判断
│   ├── env.ts          # 环境变量读取工具（getEnv / getEnvBoolean / getEnvNumber）
│   ├── http.interceptor.ts   # HTTP 统一拦截器（Loading、Token、错误处理、上传封装）
│   ├── style.scss      # 全局 SCSS 样式
│   └── uview-pro.theme.ts    # uview-pro 自定义主题（ocean 主题）
├── components/         # 全局自定义组件（仅 3 个，大量依赖 uview-pro 自动引入）
│   ├── app-form/       # 表单封装组件
│   ├── app-page/       # 页面包装器（导航栏、返回、过渡动画、TabBar 集成）
│   └── app-tabbar/     # 自定义底部 TabBar
├── composables/        # Vue Composables
│   └── useLang.ts      # 语言切换逻辑（桥接 vue-i18n 与 uview-pro 的 locale）
├── enums/              # 业务枚举
│   └── nation.ts       # 中国 56 个民族枚举
├── locale/             # 国际化配置
│   ├── index.ts        # vue-i18n 实例创建
│   └── lang/           # 翻译文件（zh-CN.json、en-US.json）
├── pages/              # 页面组件（按业务模块分组）
│   ├── auth/           # 登录页
│   ├── business/       # 核心业务页（工作台、身份、车辆、进件、审批、面签、订单等）
│   ├── home/           # 首页及演示页
│   ├── layout/         # 布局组件页
│   └── my/             # 个人中心及设置页
├── static/             # 静态资源
│   └── logo.png
├── stores/             # Pinia 状态管理
│   ├── local.ts        # 本地持久化存储（Token、用户信息）
│   ├── session.ts      # 会话级存储（Token、用户信息、订单信息）
│   ├── tabbar.ts       # TabBar 状态（激活索引、徽标）
│   └── counter.ts      # 示例计数器 Store
├── types/              # 全局 TypeScript 类型声明
│   └── env.d.ts        # Vite 环境变量类型声明
├── App.vue             # 根组件（引入 uview-pro/index.scss + common/style.scss）
├── main.ts             # 应用入口（createSSRApp、插件注册）
├── manifest.json       # uni-app 平台清单（AppID、权限、各平台配置）
├── pages.json          # 页面路由、全局样式、TabBar、easycom 配置
└── theme.json          # 暗黑/亮色模式主题 token
```

---

## 构建与运行命令（Build & Run Commands）

所有命令均通过 `pnpm` 执行：

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev                    # 默认平台开发
pnpm dev:h5                 # H5 开发（development 模式）
pnpm dev:h5:sit             # H5 开发（SIT 模式）
pnpm dev:h5:prod            # H5 开发（production 模式）
pnpm dev:mp-weixin          # 微信小程序开发
pnpm dev:app-android        # Android App 开发
pnpm dev:app-ios            # iOS App 开发

# 生产构建
pnpm build:h5               # H5 生产构建
pnpm build:h5:sit           # H5 SIT 构建
pnpm build:h5:dev           # H5 development 构建
pnpm build:mp-weixin        # 微信小程序生产构建
pnpm build:app-android      # Android App 生产构建
pnpm build:app-ios          # iOS App 生产构建

# 代码质量
pnpm type-check             # TypeScript 类型检查（vue-tsc --noEmit）
pnpm lint                   # ESLint 检查
pnpm lint:fix               # ESLint 自动修复
```

> **Mode 机制**：Vite 通过 `--mode` 参数加载对应的 `.env.*` 文件，支持 `development` / `sit` / `production` 三种环境。

---

## 环境变量（Environment Variables）

| 文件 | 用途 |
|------|------|
| `.env.development` | 本地开发环境 |
| `.env.sit` | SIT/UAT 测试环境 |
| `.env.production` | 生产环境 |

**已声明的环境变量**（`src/types/env.d.ts`）：

- `VITE_APP_ENV` — 当前环境标识
- `VITE_API_BASE_URL` — API 基础地址（默认 fallback：`http://122.51.140.89:10088`）
- `VITE_IMAGE_BASE_URL` — 图片资源基础地址
- `VITE_APP_NAME` — 应用名称
- `VITE_DEBUG` — 调试开关
- `VITE_UPLOAD_MAX_SIZE` — 上传文件大小限制
- `VITE_REQUEST_TIMEOUT` — 请求超时时间

**环境变量读取**：统一使用 `src/common/env.ts` 中的工具函数：
- `getEnv(key)` / `getEnvBoolean(key)` / `getEnvNumber(key)`
- 快捷判断：`isDev` / `isSit` / `isProd`

---

## 代码规范（Code Style Guidelines）

### TypeScript

- 启用 `strict: true`、`verbatimModuleSyntax: true`、`noImplicitThis: true`
- 路径别名：`@/` 映射到 `src/`
- 组件和类型通过 Vite 插件自动引入，无需手动 `import`

### ESLint（`eslint.config.js`）

- 继承 `@uni-helper/eslint-config`
- **大量风格规则被显式关闭**以降低开发摩擦：
  - Vue 模板规则：`block-order`、`html-indent`、`html-self-closing`、`attribute-hyphenation`、`max-attributes-per-line` 等
  - 样式规则：`style/*`、`antfu/*`、`perfectionist/*` 全部禁用
  - `no-console`：仅 `warn` 级别

> **注意**：项目对代码格式要求宽松，没有启用 Prettier。

### 条件编译

项目广泛使用 uni-app 的条件编译语法，针对不同平台写差异化代码：

```vue
<!-- #ifdef H5 -->
<!-- H5 专属代码 -->
<!-- #endif -->

// #ifdef MP-WEIXIN
// 微信小程序专属代码
// #endif
```

常用平台标识：`H5`、`MP-WEIXIN`、`APP-PLUS`、`APP-ANDROID`、`APP-IOS`、`APP-HARMONY`、`MP-ALIPAY` 等。

---

## 组件系统（Component System）

### 自动引入机制

通过 `vite.config.ts` 中的 `@uni-helper/vite-plugin-uni-components` 插件实现组件自动注册：

- **uview-pro 组件**：`uViewProResolver` — 所有 `u-*` 前缀组件自动引入
- **z-paging 组件**：`ZPagingResolver` — 分页组件自动引入
- **自定义组件**：`src/components/` 目录下的组件自动引入

自动生成的类型声明位于 `components.d.ts`（该文件在 `.gitignore` 中，但当前被跟踪）。

### 全局自定义组件

| 组件 | 用途 |
|------|------|
| `<app-page>` | 页面包装器，提供渐变导航栏、返回按钮、页面滑动过渡动画、可选 TabBar |
| `<app-tabbar>` | 自定义底部 TabBar（基于 `u-tabbar` + Pinia store 驱动） |
| `<app-form>` | 表单封装组件 |

### 页面组织

- 页面按业务模块放在 `src/pages/{module}/` 下
- `pages.json` 中注册所有页面路由，并配置 `globalStyle`（自定义导航栏、标题"嗨车无忧"）
- `tabBar` 配置 4 个 Tab：首页、工作台、订单、我的

---

## HTTP 与 API 规范

### HTTP 层

基于 `uview-pro` 的 `httpPlugin`，通过 `src/common/http.interceptor.ts` 配置：

**请求拦截器**：
1. 根据 `meta.loading` 显示/隐藏 `uni.showLoading`
2. 从 `useLocalStore()` 读取 `token`，注入 `M-Authorization: Bearer <token>` 请求头

**响应拦截器**：
1. 关闭 Loading
2. HTTP 状态码非 200 → 统一错误提示，401 触发登出重定向
3. 业务状态码非 200 → 统一错误提示，401 同样触发登出
4. 成功时返回 `response.data`

**未授权统一处理**：
- 调用 `localStore.logout()` 清除认证数据
- `uni.reLaunch({ url: '/pages/auth/login' })` 跳转登录页

**文件上传**：`uploadFile(filePath, url)` 封装 `uni.uploadFile`，自动携带 Token。

### API 组织模式

`src/api/` 下按业务域分组，存在两种风格：

1. **简单导出**（`api/index.ts`）：`export const login = (data) => http.post('/api/login', data)`
2. **Composable 风格**（`api/auth.ts`、`api/business.ts`）：`export function useAuthApi()` 返回方法对象

建议新增 API 时保持与所在文件一致的现有风格。

---

## 状态管理（State Management）

使用 **Pinia** + `pinia-plugin-persistedstate`，持久化通过 `uni.getStorageSync` / `uni.setStorageSync` 实现跨平台兼容。

| Store | 文件 | 用途 | 持久化 |
|-------|------|------|--------|
| `useLocalStore` | `stores/local.ts` | Token、refreshToken、userInfo、登录状态 | localStorage（跨会话） |
| `useSessionStore` | `stores/session.ts` | Token、userInfo、orderInfo | sessionStorage（会话级） |
| `useTabbarStore` | `stores/tabbar.ts` | TabBar 激活索引、徽标数量、Tab 列表 | 持久化 |
| `useCounterStore` | `stores/counter.ts` | 示例计数器 | 不持久化 |

**认证数据流**：`localStore` 是主要认证存储。HTTP 拦截器读取 `localStore.token`，401 时调用 `localStore.logout()` 清除数据并重定向。

---

## 主题与样式

### uview-pro 主题

- 自定义主题文件：`src/common/uview-pro.theme.ts`
- 主题名称：`ocean`
- 默认暗黑模式：`light`
- Vite SCSS `additionalData` 自动注入 `uview-pro/theme.scss`
- `App.vue` 中引入 `uview-pro/index.scss` 和 `common/style.scss`

### UnoCSS

配置在 `uno.config.ts`：
- `presetUni({ attributify: false })` — uni-app 适配预设
- `presetIcons({ scale: 1.2 })` — Iconify 图标支持
- `transformerDirectives()` / `transformerVariantGroup()` — 指令和变体组转换

---

## 测试策略（Testing）

**当前状态：无自动化测试。**

- 无单元测试框架（Jest / Vitest）
- 无 E2E 测试（Cypress / Playwright）
- `devDependencies` 中包含 `@dcloudio/uni-automator`（uni-app 官方 UI 自动化工具），但未配置测试脚本或测试用例
- `package.json` 无 `test` 脚本

**现有质量门禁**：
- `pnpm type-check` — TypeScript 类型检查
- `pnpm lint` — ESLint 代码检查

---

## 部署流程（Deployment）

**当前状态：无 CI/CD 流水线。**

- 无 `.github/workflows/`、无 `Dockerfile`、无 Jenkins/GitLab CI 配置
- 部署方式为**手动构建**，通过 CLI 命令或 HBuilderX IDE 导出各平台产物：
  - **H5**：`pnpm build:h5`，产物在 `dist/build/h5/`
  - **微信小程序**：`pnpm build:mp-weixin`，产物在 `dist/build/mp-weixin/`，需通过微信开发者工具上传
  - **App**：`pnpm build:app-android` / `pnpm build:app-ios`，产物为原生工程，需进一步用 Android Studio / Xcode 打包
  - **HarmonyOS**：`pnpm build:app-harmony`，需配合 `harmony-configs/build-profile.json5` 中的签名配置

### 平台特定配置

- **HarmonyOS**：`harmony-configs/build-profile.json5` 包含签名配置（default / release）
- **HBuilderX**：`.hbuilderx/launch.json` 配置了 Android App playground 启动
- **manifest.json**：包含各平台的 AppID、权限声明、图标配置等

---

## 开发注意事项

1. **pnpm 强制**：项目使用 `pnpm-lock.yaml`，`.npmrc` 配置了 `strict-peer-dependencies=false`、`auto-install-peers=true`、`shamefully-hoist=true`
2. **unconfig 版本锁定**：`package.json` 中通过 `pnpm.overrides` / `overrides` / `resolutions` 三重锁定 `unconfig@7.3.2`
3. **vConsole 调试**：H5 环境下，URL 添加 `?vConsole=1` 参数可动态加载 vConsole 调试面板
4. **组件自动引入**：新增全局组件到 `src/components/` 后无需手动注册，类型声明会自动生成
5. **pages.json 修改**：新增页面必须在 `pages.json` 中注册，否则无法访问
6. **条件编译优先**：涉及平台差异时，优先使用 uni-app 条件编译而非运行时判断
7. **中文为主**：项目注释、文档、变量命名、UI 文案均以中文为主

---

## 关键文件速查表

| 文件 | 作用 |
|------|------|
| `package.json` | 依赖、脚本、pnpm 覆盖配置 |
| `vite.config.ts` | Vite 构建配置、别名、插件、SCSS 注入 |
| `tsconfig.json` | TypeScript 编译选项、类型声明、路径映射 |
| `uno.config.ts` | UnoCSS 预设和转换器配置 |
| `eslint.config.js` | ESLint 规则（大量禁用） |
| `src/main.ts` | 应用入口、插件注册、vConsole 条件加载 |
| `src/App.vue` | 根组件、全局样式引入 |
| `src/pages.json` | 页面路由、全局样式、TabBar、easycom |
| `src/manifest.json` | uni-app 平台清单、AppID、权限 |
| `src/common/http.interceptor.ts` | HTTP 请求/响应拦截器、错误处理、上传封装 |
| `src/common/env.ts` | 环境变量读取工具 |
| `components.d.ts` | 自动生成的全局组件类型声明 |
