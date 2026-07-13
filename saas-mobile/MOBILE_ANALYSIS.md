# saas-mobile 移动端项目分析报告

## 一、项目概览

| 项目 | 说明 |
|------|------|
| 项目名称 | `uview-pro-starter`（予艺助手） |
| 版本 | 1.0.0 |
| 技术栈 | uni-app 3.x + Vue 3.4 + TypeScript 5.9 + Vite 5.2 |
| UI 框架 | uView Pro + UnoCSS |
| 状态管理 | Pinia 2.2 + pinia-plugin-persistedstate |
| 包管理器 | pnpm 9.15 |
| 部署路径 | `/saas/mobile/` |

### 定位

这是一个**多租户 SaaS 移动端应用**，采用 uni-app 跨平台框架，支持 H5、微信小程序、App（Android/iOS）、支付宝小程序等多种平台。应用聚合了车抵贷、点餐、征信查询、读书等多个业务模块，通过租户配置实现模块动态启用。

---

## 二、技术架构

### 2.1 技术栈详情

```
┌─────────────────────────────────────────────┐
│              uni-app 3.x (跨平台)            │
├─────────────────────────────────────────────┤
│  Vue 3.4 (Composition API, <script setup>)  │
├─────────────────────────────────────────────┤
│  TypeScript 5.9 / Vite 5.2 / UnoCSS 66      │
├─────────────────────────────────────────────┤
│  uView Pro (UI组件库) + z-paging (分页组件)  │
├─────────────────────────────────────────────┤
│  Pinia (状态管理) + 持久化插件               │
├─────────────────────────────────────────────┤
│  vue-i18n 9.1 (国际化) + tesseract.js (OCR) │
└─────────────────────────────────────────────┘
```

### 2.2 多平台支持

项目通过 `package.json` scripts 配置了丰富的平台构建命令：

- **H5**: `dev:h5` / `build:h5`（支持 dev/sit/prod 三套环境）
- **微信小程序**: `dev:mp-weixin` / `build:mp-weixin`
- **App**: `dev:app` / `build:app`（Android / iOS 分别支持）
- **其他小程序**: 支付宝、百度、京东、快手、飞书、QQ、头条、小红书、钉钉
- **快应用**: `quickapp-webview` 系列

### 2.3 环境配置

三套环境配置文件：

| 环境 | 文件 | API 地址 |
|------|------|---------|
| 开发 | `.env.development` | `http://localhost:3001/saas/api` |
| 测试 | `.env.sit` | (SIT 环境) |
| 生产 | `.env.production` | (生产环境) |

环境变量通过 `src/common/env.ts` 统一管理，提供类型安全的环境变量读取工具函数。

---

## 三、源码目录结构

```
saas-mobile/src/
├── App.vue              # 应用入口
├── App.ku.vue           # @uni-ku/root 插件入口
├── main.ts              # 主入口文件
├── manifest.json        # uni-app 应用配置
├── pages.json           # 页面路由配置（~60+ 页面）
├── theme.json           # 主题配置
├── uni.scss             # 全局样式变量
│
├── api/                 # API 接口层（按业务模块拆分）
│   ├── auth.ts          # 认证接口
│   ├── business.ts      # 通用业务接口
│   ├── carloan.ts       # 车抵贷接口（655行，核心模块）
│   ├── credit.ts        # 征信查询接口
│   ├── food.ts          # 点餐接口
│   ├── mobile-config.ts # 移动端模块配置接口
│   ├── reading.ts       # 读书接口
│   └── index.ts         # 统一导出
│
├── common/              # 公共工具
│   ├── env.ts           # 环境变量工具
│   ├── navigation.ts    # 路由导航（520行，核心）
│   ├── token.ts         # Token 工具
│   ├── http.interceptor.ts # HTTP 拦截器
│   ├── carloan-route-query.ts # 车贷路由参数构建
│   └── ...
│
├── components/          # 公共组件
│   ├── app-page/        # 页面容器组件（含导航栏+TabBar）
│   ├── app-tabbar/      # 自定义底部导航栏
│   ├── progress-ring/   # 进度环组件
│   └── ...
│
├── composables/         # 组合式函数
│   ├── useLang.ts       # 语言切换
│   ├── useListPage.ts   # 列表页通用逻辑（分页、搜索、下拉刷新）
│   └── index.ts
│
├── enums/               # 枚举定义
├── locale/              # 国际化资源
├── pages/               # 页面目录
├── static/              # 静态资源
├── stores/              # Pinia 状态管理
│   ├── local.ts         # 全局本地存储（token、用户信息、权限）
│   ├── carloan.ts       # 车贷业务状态
│   ├── food.ts          # 点餐业务状态
│   ├── reading.ts       # 读书业务状态
│   ├── session.ts       # 会话状态
│   ├── tabbar.ts        # TabBar 状态
│   └── counter.ts       # 计数器（示例）
├── styles/              # 全局样式
└── types/               # TypeScript 类型定义
    └── api/contract.ts  # API 响应契约类型
```

---

## 四、业务模块分析

### 4.1 模块体系

应用采用**多模块架构**，通过后端配置动态启用模块：

| 模块 Key | 名称 | 首页路由 | 状态 | 复杂度 |
|----------|------|---------|------|--------|
| `carloan` | 车抵贷 | `/pages/carloan/portal/workbench` | 完整 | 最高 |
| `food` | 点餐 | `/pages/food/index/index` | 可用 | 中等 |
| `credit` | 征信查询 | `/pages/credit/index/index` | 可用 | 较低 |
| `reading` | 读书 | `/pages/reading/index/index` | 可用 | 中等 |

### 4.2 模块配置机制

```typescript
// src/common/navigation.ts
interface MobileModuleConfigLike {
  enabled?: string[]; // 已启用的模块列表
  defaultModule?: string; // 默认模块
  isMultiModule?: boolean; // 是否多模块模式
}
```

- **单模块模式**: 自动跳转到唯一启用模块的首页
- **多模块模式**: 显示门户首页，用户自由选择
- **角色映射**: 通过 `ROLE_MODULE_MAP` 实现角色到默认模块的映射

### 4.3 车抵贷模块（核心业务）

车抵贷是项目的核心业务模块，拥有完整的贷款全生命周期流程：

```
线索管理 -> 进件预审 -> 资料补充 -> 审批 -> 签约 -> 贷后管理
```

#### 页面结构（30+ 页面）

```
carloan/
├── portal/                    # 门户工作台
│   ├── workbench.vue          # 工作台首页
│   ├── todoCenter.vue         # 待办中心
│   └── messageCenter.vue      # 消息中心
│
├── precheck/                  # 预审阶段
│   ├── leadList.vue           # 线索列表
│   ├── leadAdd.vue            # 新增线索
│   ├── entryList.vue          # 进件列表
│   ├── entryDetail.vue        # 进件详情
│   ├── idInfo.vue             # 身份证信息
│   ├── carInfo.vue            # 车辆信息
│   ├── applyInfo.vue          # 申请信息
│   ├── applySubmit.vue        # 提交申请
│   ├── applyResult.vue        # 申请结果
│   ├── applyListPage.vue      # 申请列表
│   ├── applyDetail.vue        # 申请详情
│   ├── applyProgress.vue      # 申请进度
│   ├── orderList.vue          # 订单列表
│   ├── applyDetail-flow.ts    # 流程逻辑
│   └── types.ts               # 类型定义
│
├── supplement/                # 资料补充
│   ├── supplementList.vue     # 补件列表
│   ├── supplementDetail.vue   # 补件详情
│   ├── idInfoSupplement.vue   # 身份证补充
│   ├── carInfoSupplement.vue  # 车辆信息补充
│   ├── orderInfoSupplement.vue # 订单信息补充
│   ├── fileInfoSupplement.vue # 文件资料补充
│   └── fileManage.vue         # 文件管理
│
├── approval/                  # 审批
│   ├── approvalList.vue       # 审批列表
│   ├── pawnApprovalList.vue   # 抵押审批列表
│   ├── pawnApprovalDetail.vue # 抵押审批详情
│   ├── pawnMaterials.vue      # 抵押材料
│   └── pawnLoanInfo.vue       # 抵押贷款信息
│
├── signing/                   # 签约
│   ├── signCenter.vue         # 签约中心
│   ├── signConfirmAmount.vue  # 额度确认
│   ├── signBindCard.vue       # 绑卡
│   ├── authSign.vue           # 授权签署
│   ├── videoFaceSign.vue      # 视频面签
│   ├── faceSignList.vue       # 面签列表
│   ├── faceSignResult.vue     # 面签结果
│   ├── signGpsAppointment.vue # GPS 预约
│   ├── signMortgage.vue       # 抵押登记
│   └── signing-url.ts         # 签约 URL 工具
│
├── postloan/                  # 贷后管理
│   ├── loanConfirm.vue        # 请款确认
│   ├── repaymentPlan.vue      # 还款计划
│   └── earlyRepayment.vue     # 提前还款
│
├── components/
│   └── FileCard.vue           # 文件卡片组件
│
└── workbench.vue              # 旧版工作台
```

#### API 接口（50+ 接口）

`src/api/carloan.ts` 提供了完整的车贷业务 API 封装：

| 功能域 | 接口示例 | 说明 |
|--------|---------|------|
| 用户信息 | `addOrUpdateUserBasic`, `getIdCardInfo`, `getIdCardOcr` | 身份证OCR、信息管理 |
| 车辆信息 | `addOrUpdateVehicle`, `getVehicleOcr`, `getVehiclePriceByVin` | 行驶证OCR、车辆评估 |
| 文件管理 | `uploadFile`, `uploadWithType`, `getFileList`, `deleteFile` | 文件上传/下载/管理 |
| 授信申请 | `creditApply`, `updateCredit`, `getCreditList`, `getCreditDetail` | 贷款申请全流程 |
| 流程推进 | `submitApplication`, `completeSupplement`, `submitPreAudit` | 业务节点状态机 |
| 签约 | `startFaceSign`, `startAuthContractSign`, `startContractSign` | 人脸识别、合同签署 |
| 贷后 | `confirmAmount`, `getRepaymentPlans`, `applyEarlyRepayment` | 还款管理 |
| 统计 | `getStatisticsOverview`, `getLifecycle` | 数据概览、流程追踪 |

### 4.4 其他业务模块

- **点餐模块 (`food/`)**: 门店列表、商品浏览、购物车、订单管理
- **征信查询 (`credit/`)**: 在线查询、信用报告
- **读书模块 (`reading/`)**: 书架、书城、阅读器、下载管理

---

## 五、核心架构设计

### 5.1 路由与导航系统

项目采用**自定义 TabBar + 多作用域**的导航架构：

```typescript
// 5 种 TabBar 作用域
const TABBAR_SCOPES = {
  reading: "reading",
  portal: "portal",
  carloan: "carloan",
  food: "food",
  credit: "credit",
};
```

- **门户 TabBar**: 首页 + 我的
- **车贷 TabBar**: 首页 + 订单 + 我的
- **点餐 TabBar**: 首页 + 订单 + 我的
- **征信 TabBar**: 首页 + 我的
- **读书 TabBar**: 书架 + 书城 + 我的

导航方式支持 `switchTab` / `redirectTo` / `reLaunch` 三种模式，每个 Tab 项可独立配置。通过 `navigateFromTabbar()` 统一处理导航逻辑，并通过 `navigateBackOrFallback()` 提供兜底回退。

### 5.2 状态管理

| Store | 文件 | 持久化 | 用途 |
|-------|------|--------|------|
| `local` | `local.ts` | localStorage | Token、用户信息、角色权限、当前系统、移动端配置 |
| `carloan` | `carloan.ts` | sessionStorage | 当前订单、页面上下文、工作台筛选、草稿 |
| `food` | `food.ts` | - | 点餐业务状态 |
| `reading` | `reading.ts` | - | 读书业务状态 |
| `session` | `session.ts` | - | 会话状态 |
| `tabbar` | `tabbar.ts` | - | TabBar 状态 |

**持久化适配器**: 针对小程序环境，使用 `uni.getStorageSync` / `uni.setStorageSync` 实现 Storage 适配。

### 5.3 页面上下文机制

车贷模块通过 `CarloanPageContext` 统一管理跨页面的业务上下文：

```typescript
interface CarloanPageContext {
  uuid: string; // 客户唯一编码
  creditOrderId: string; // 授信订单ID
  customerName: string; // 客户姓名
  customerPhone: string; // 客户电话
  nodeCode: string; // 当前节点
}
```

通过 `syncFromRouteQuery()` 从路由参数中自动提取并映射字段（如 `name -> customerName`、`orderNo -> creditOrderId`），实现页面间数据的无缝传递。

### 5.4 组合式函数

- **`useListPage<T>`**: 通用列表页逻辑，封装了分页加载、关键词搜索、下拉刷新、上拉加载更多、回到顶部等功能。自动识别手机号（7位以上数字）和姓名进行不同字段搜索。
- **`useLang`**: 语言切换。

### 5.5 组件体系

- **`app-page`**: 统一页面容器，集成导航栏 + TabBar + 返回逻辑
- **`layout`**: 布局组件，支持动态 TabBar 作用域切换
- **`app-tabbar`**: 自定义底部导航
- **`progress-ring`**: 进度环

通过 `easycom` 自动导入机制，`app-*` 前缀组件无需手动注册。

---

## 六、配置与构建

### 6.1 Vite 配置要点

- **base**: `/saas/mobile/`（部署子路径）
- **别名**: `@` -> `./src`
- **i18n**: 通过 `define` 关闭生产环境 DevTools
- **SCSS**: 自动注入 `uview-pro/theme.scss`
- **Windows 补丁**: 修复 uni-app 在 Windows 下 easycom 组件路径解析问题

### 6.2 代码质量

- **ESLint**: 使用 `@uni-helper/eslint-config`
- **TypeScript**: 严格类型检查，`vue-tsc --noEmit`
- **测试**: Playwright E2E 测试（`playwright.config.ts`）

---

## 七、页面路由总览

项目共注册 **60+ 页面**，分布如下：

| 模块 | 页面数 | 核心页面 |
|------|--------|---------|
| 门户 | 1 | `pages/index/index`（首页门户） |
| 认证 | 2 | `login`, `transfer` |
| 车抵贷 | ~35 | 工作台、进件、补件、审批、签约、贷后 |
| 点餐 | ~6 | 门店、商品、购物车、订单 |
| 征信 | 2 | 查询首页、查询结果 |
| 读书 | ~6 | 书架、书城、书籍详情、阅读器、下载管理 |
| 我的 | ~6 | 个人中心、关于、FAQ、设置、隐私、协议 |

---

## 八、认证与权限

### 8.1 认证流程

1. **登录**: `pages/auth/login` - 用户名密码登录，支持多租户
2. **令牌管理**: `src/common/token.ts` 提供 Token 的规范化、存储、读取
3. **Token 刷新**: 支持 `refreshToken` 机制，过期自动续期
4. **跳转登录**: `pages/auth/transfer` - 中间跳转页，处理来源页回跳

### 8.2 权限模型

```typescript
// 三层权限体系
interface UserInfo {
  roles: SysRole[]; // 角色列表
  roleKeys: string[]; // 角色编码列表
  permissions: string[]; // 按钮/接口权限标识
}
```

- **角色判断**: `hasRole(roleKey)` - 检查角色编码
- **权限判断**: `hasPermission(permission)` - 检查权限标识，支持通配符 `*:*:*`
- **模块访问**: 通过 `ROLE_MODULE_MAP` 将角色映射到可访问的业务模块

### 8.3 HTTP 拦截

`src/common/http.interceptor.ts` 统一处理：

- 请求自动携带 `Authorization` Token 和 `tenant-id` 租户头
- 401 自动跳转登录
- Token 过期自动刷新
- 统一错误提示

---

## 九、项目亮点

### 9.1 跨平台一致性

通过 uni-app 实现一套代码多端运行，同时针对各平台差异做了适配：

- 持久化存储适配（`localStorage` vs `uni.getStorageSync`）
- Windows 路径解析补丁
- 平台条件编译

### 9.2 模块化 SaaS 架构

- 后端配置驱动的模块动态启用
- 角色到模块的映射机制
- 每个模块独立的 Store、API、页面
- 统一的门户入口和导航管理

### 9.3 车贷全流程数字化

完整的车抵贷业务闭环，覆盖从线索到贷后的全生命周期，集成 OCR 识别、人脸签约、合同电子签署等能力。

### 9.4 开发体验

- TypeScript 全量类型覆盖
- `useListPage` 等组合式函数减少重复代码
- UnoCSS 原子化样式
- 组件自动导入（easycom + vite-plugin-uni-components）
- Playwright E2E 测试

---

## 十、潜在改进建议

| 领域 | 建议 | 优先级 |
|------|------|--------|
| 分包优化 | 车贷模块页面众多，建议使用 `subPackages` 进行分包加载 | 高 |
| 组件文档 | 补充公共组件的 Props/Events 文档 | 中 |
| API 类型 | `api/carloan.ts` 部分接口缺少请求/响应类型定义 | 中 |
| 环境变量 | `.env.sit` 和 `.env.production` 的 API 地址需确认配置 | 高 |
| 代码拆分 | `navigation.ts`（520行）可考虑按功能拆分 | 低 |
| 单元测试 | 目前仅有 E2E 测试，建议补充关键逻辑的单元测试 | 中 |
| 依赖更新 | `vue-i18n` 9.1 偏旧，建议升级到 9.14+ | 低 |

---

## 总结

`saas-mobile` 是一个功能完善的**多租户 SaaS 移动端应用**，基于 uni-app + Vue 3 + TypeScript 构建，核心业务为车抵贷全流程管理，同时集成了点餐、征信查询、读书等多个模块。项目架构清晰，模块化程度高，状态管理和导航系统设计合理，具备良好的可维护性和可扩展性。车贷模块的业务流程完整，覆盖了从线索到贷后的全生命周期，是一个成熟的金融业务移动端解决方案。
