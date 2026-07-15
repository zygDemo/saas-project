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

这是一个**多租户 SaaS 移动端应用**，采用 uni-app 跨平台框架，支持 H5、微信小程序、App（Android/iOS）、支付宝小程序等多种平台。应用聚合了车抵贷、点餐、征信查询、读书、命理等多个业务模块，通过租户配置实现模块动态启用。

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
├── pages.json           # 页面路由配置（68 页面）
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
│   ├── navigation.ts    # 路由导航（541行，核心）
│   ├── token.ts         # Token 工具
│   ├── http.interceptor.ts # HTTP 拦截器（388行）
│   ├── logger.ts        # 生产环境日志工具（75行，新增）
│   ├── file-url.ts      # 文件 URL 处理
│   ├── carloan-route-query.ts # 车贷路由参数构建
│   └── mingli/          # 命理算法模块（新增）
│       ├── bazi.ts      # 八字排盘算法（371行）
│       └── liuyao.ts    # 六爻排盘算法（359行）
│
├── components/          # 公共组件
│   ├── app-page/        # 页面容器组件（含导航栏+TabBar）
│   ├── app-tabbar/      # 自定义底部导航栏
│   ├── virtual-list/    # 虚拟滚动列表组件（新增）
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
│   ├── dict.ts          # 字典数据缓存（119行，新增）
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
| `mingli` | 命理 | `/pages/mingli/index` | 可用（新增） | 中等 |

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

模块注册和导航体系已完整集成命理模块：
- `MobileModuleKey` 类型已包含 `"mingli"`
- `MODULE_HOME_ROUTE_MAP` 映射命理首页路由
- `MODULE_SYSTEM_MAP` 映射命理系统标识
- `ROUTE_SYSTEM_MAP` 通过路由前缀 `/pages/mingli/` 推断模块归属
- `getFallbackRouteByPage()` 支持命理模块的回退导航

### 4.3 车抵贷模块（核心业务）

车抵贷是项目的核心业务模块，拥有完整的贷款全生命周期流程：

```
线索管理 -> 进件预审 -> 资料补充 -> 审批 -> 签约 -> 贷后管理
```

#### 页面结构（35+ 页面）

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
│   ├── videoFaceSign.vue      # 视频面签（1169行，待拆分）
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

### 4.4 命理模块（新增，纯前端算法）

命理模块是一个**完全离线的纯前端算法模块**，不依赖后端 API，所有排盘计算在客户端完成。

#### 页面结构（6 页面）

```
mingli/
├── index.vue              # 命理首页（功能入口）
├── bazi/
│   ├── input.vue          # 八字信息输入页
│   └── result.vue         # 八字排盘结果页
├── liuyao/
│   ├── shake.vue          # 六爻摇卦页（含动画）
│   └── result.vue         # 六爻排盘结果页
└── history.vue            # 历史记录页
```

#### 核心算法文件

**`src/common/mingli/bazi.ts`（371 行）** — 八字排盘引擎：

| 功能 | 函数 | 说明 |
|------|------|------|
| 四柱排盘 | `paiPan(year, month, day, hour, gender)` | 生成完整八字排盘结果 |
| 年柱推算 | `getYearZhu(year)` | 基于公元年份推算天干地支 |
| 月柱推算 | `getMonthZhu(yearGan, month)` | 五虎遁年起月干 |
| 日柱推算 | `getDayZhu(year, month, day)` | 基于 1900-01-01 基准日计算 |
| 时柱推算 | `getHourZhu(dayGan, hour)` | 五鼠遁日起时干 |
| 十神推算 | `getShiShen(riGan, otherGan)` | 基于日干推算十神关系 |
| 纳音五行 | `getNaYin(gan, zhi)` | 60 甲子纳音查询表 |
| 五行统计 | `countWuXing(siZhu)` | 统计四柱五行分布 |
| 大运排盘 | `getDaYun(siZhu, gender)` | 阳男阴女顺排、阴男阳女逆排 |

数据表：天干（10）、地支（12）、五行对照、阴阳对照、五行生克关系、纳音表（60 组）、五行颜色映射。

**`src/common/mingli/liuyao.ts`（359 行）** — 六爻排盘引擎：

| 功能 | 函数 | 说明 |
|------|------|------|
| 摇卦模拟 | `yaoGua()` | 模拟三枚铜钱，生成 6 个爻值（6/7/8/9） |
| 阴阳判定 | `getYinYang(value)` | 7、9 为阳，6、8 为阴 |
| 动爻判定 | `isDongYao(value)` | 6（老阴）和 9（老阳）为动爻 |
| 变爻推算 | `getBianYinYang(value)` | 老阴变阳、老阳变阴 |
| 卦象推算 | `getGuaFromYao(values)` | 从 6 爻推算上下卦 |
| 64 卦查询 | `getGua64(upper, lower)` | 查询卦名、世应、卦辞 |
| 六神排列 | `getLiuShenByDay(riGan)` | 甲乙起青龙…壬癸起玄武 |
| 六亲推算 | `getLiuQin(guaWuXing, yaoWuXing)` | 基于卦宫五行与爻五行关系 |
| 完整排盘 | `liuYaoPaiPan(question)` | 生成完整六爻排盘结果 |

数据表：八卦（8）、八卦五行、八卦象征、64 卦数据（含卦名、全名、世应、卦辞、宫位）、纳甲表（8 卦 × 天干 + 6 地支）、地支五行。

#### 数据传递机制

- **八字**: 通过 `uni.setStorageSync('bazi_params', ...)` 存储参数 → 结果页 `onMounted` 读取
- **六爻**: 通过 URL query 参数 `?values=6,7,8,9,...` 传递爻值
- **历史记录**: 通过 `uni.getStorageSync('mingli_history')` 读取本地存储

#### UI 设计特点

- 深色主题（`#1a1a2e → #16213e → #0f3460` 渐变背景）
- 金色（`#e6b422`）为主色调，呼应传统命理风格
- 八字结果页使用五行颜色区分（金-黄、木-绿、水-蓝、火-红、土-棕）
- 六爻摇卦页含摇卦动画交互
- 历史记录页区分八字/六爻两种类型展示

#### 已知限制

1. **日柱时区偏差**: `getDayZhu()` 使用本地时区构造日期，非东八区用户跨午夜可能产生 1 天偏差（代码中已有注释提示）
2. **六爻日干简化**: `liuYaoPaiPan()` 中日干硬编码为 `'甲'`，未根据实际日期推算
3. **爻辞缺失**: `Gua64.yaoCi` 为空数组（标注 TODO）
4. **大运起运年龄简化**: `getDaYun()` 使用 `i * 10` 简化计算，未精确到天数折算
5. **历史记录无上限管理**: 本地存储 `mingli_history` 无数量限制，长期使用可能占用过多空间

### 4.5 其他业务模块

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

> 注：命理模块未配置独立 TabBar 作用域，使用 `navigationStyle: "custom"` 自定义导航栏。

### 5.2 状态管理

| Store | 文件 | 持久化 | 用途 |
|-------|------|--------|------|
| `local` | `local.ts` | localStorage | Token、用户信息、角色权限、当前系统、移动端配置 |
| `carloan` | `carloan.ts` | sessionStorage | 当前订单、页面上下文、工作台筛选、草稿 |
| `food` | `food.ts` | - | 点餐业务状态 |
| `reading` | `reading.ts` | - | 读书业务状态 |
| `session` | `session.ts` | - | 会话状态 |
| `tabbar` | `tabbar.ts` | - | TabBar 状态 |
| `dict` | `dict.ts` | - | 字典数据缓存（新增） |

**字典缓存 Store 详解** (`dict.ts`, 119 行):

```typescript
// 核心机制：缓存 + 并发去重 + TTL 过期
const DEFAULT_TTL = 10 * 60 * 1000; // 10 分钟

// fetchOptions(dictType, fetcher, ttl) 流程：
// 1. 检查缓存是否有效 -> 命中则直接返回
// 2. 检查是否有进行中的请求 -> 有则返回同一 Promise（并发去重）
// 3. 同步创建 Promise 并写入 loading 状态 -> 防止竞态
// 4. 异步发起新请求 -> 成功写入缓存，失败清除 loading
```

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
- **`VirtualList`**: 虚拟滚动列表（新增），只渲染可视区域 + 缓冲区项目

通过 `easycom` 自动导入机制，`app-*` 前缀组件无需手动注册。

### 5.6 HTTP 拦截器架构

`src/common/http.interceptor.ts`（388 行）实现了完整的请求/响应拦截链：

```
请求拦截:
  ├── 注入 X-Tenant-ID（租户头）
  ├── 注入 X-Org-Id（组织头）
  ├── 注入 Authorization Token（区分客户/员工）
  └── 显示 Loading

响应拦截:
  ├── 关闭 Loading
  ├── HTTP 状态码错误处理 (非 200)
  │   ├── 401 -> 尝试刷新 Token -> 失败则登出
  │   └── 其他 -> toast 提示
  ├── 业务状态码错误处理 (code !== 200)
  │   ├── 401 -> 尝试刷新 Token -> 失败则登出
  │   └── 其他 -> toast 提示
  └── 成功 -> 返回 res.data

文件上传:
  ├── 前端校验（扩展名白名单 14 种 + 大小限制）
  ├── 构建 Auth Header
  └── 响应解析 normalizeUploadResponse
```

**Token 刷新机制**:
- `isRefreshing` 锁 + `refreshQueue` 请求队列
- 首个 401 触发 `tryRefreshToken()`，后续请求入队等待
- 刷新成功后队列中的请求自动携带新 Token 重发
- 刷新失败则清空队列并跳转登录页
- 刷新请求使用原始 `uni.request`，绕过拦截器避免递归

### 5.7 日志工具

`src/common/logger.ts`（75 行）实现生产环境日志降级：

| 方法 | 开发环境 | 生产环境 |
|------|---------|---------|
| `log/info/debug` | 正常输出 | 静默 |
| `warn` | 正常输出 | 保留但截断长参数（500 字符） |
| `error` | 正常输出 | 完整保留（用于错误监控） |

内置循环引用检测 (`safeStringify`) 和参数截断 (`truncateArg`)。

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

项目共注册 **68 页面**，分布如下：

| 模块 | 页面数 | 核心页面 |
|------|--------|---------|
| 门户 | 1 | `pages/index/index`（首页门户） |
| 认证 | 2 | `login`, `transfer` |
| 车抵贷 | ~35 | 工作台、进件、补件、审批、签约、贷后 |
| 点餐 | ~6 | 门店、商品、购物车、订单 |
| 征信 | 2 | 查询首页、查询结果 |
| 读书 | ~6 | 书架、书城、书籍详情、阅读器、下载管理 |
| 命理 | 6 | 首页、八字输入/结果、六爻摇卦/结果、历史记录 |
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
- 401 自动刷新 Token，刷新失败再跳转登录
- Token 过期自动刷新（并发请求排队）
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

### 9.4 命理模块纯前端实现

八字/六爻排盘完全在客户端计算，无需后端支持，降低了服务器负载，同时保护了用户隐私数据。

### 9.5 开发体验

- TypeScript 全量类型覆盖
- `useListPage` 等组合式函数减少重复代码
- UnoCSS 原子化样式
- 组件自动导入（easycom + vite-plugin-uni-components）
- Playwright E2E 测试
- 生产环境日志自动降级

---

## 十、代码质量改进记录

本次对移动端项目进行了深度分析并实施了以下改进：

### 10.1 Refresh Token 刷新机制 ✅

**文件**: `src/common/http.interceptor.ts`

**问题**: Token 过期后直接跳转登录页，用户体验中断。

**改进**: 实现了 `isRefreshing` 锁 + 请求队列机制。当 401 发生时：
- 首个请求触发 `refreshToken`，期间所有后续请求入队等待
- 刷新成功后，队列中的请求自动携带新 Token 重发
- 刷新失败时，清空队列并跳转登录页

### 10.2 文件上传前端校验 ✅

**文件**: `src/common/http.interceptor.ts`

**问题**: `uploadFile` / `uploadFileWithData` 上传前无任何校验，大文件或错误类型直接上传浪费带宽。

**改进**: 新增 `validateFileBeforeUpload()` 函数：
- 文件大小限制（默认 10MB）
- 文件类型白名单校验（jpg/png/pdf 等 14 种）
- 校验失败时通过 `uni.showToast` 提示用户
- 支持 `onValidationFail` 回调自定义处理

### 10.3 字典数据缓存 ✅

**文件**: `src/stores/dict.ts`

**问题**: 每次使用字典数据都发起 HTTP 请求，重复请求多。

**改进**: 实现了基于 Pinia 的字典缓存 Store：
- `loadDict(dictType)` 自动缓存，重复调用直接返回缓存值
- `getDictSync(dictType)` 同步获取已缓存数据
- `clearCache(dictType?)` 支持清除单个/全部缓存
- 缓存有效期 10 分钟，过期自动刷新
- 并发请求去重（同一 dictType 同时只发一次请求）

### 10.4 长列表虚拟滚动 ✅

**文件**: `src/components/virtual-list/VirtualList.vue`（新增）

**问题**: 订单列表、线索列表等场景数据量大时，DOM 节点过多导致卡顿。

**改进**: 创建了通用虚拟滚动组件：
- 只渲染可视区域 + 缓冲区的项目（默认前后各 5 项）
- 通过 `translateY` 偏移实现平滑滚动
- 支持受控 `scrollTop` 和 `@scroll` / `@reachBottom` 事件
- 支持自定义 `keyField` 和 `itemHeight`
- 兼容 uni-app `scroll-view` 组件

### 10.5 API 返回类型补全 ✅

**文件**: `src/api/carloan.ts`

**问题**: 部分接口缺少泛型标注，返回 `unknown` 或隐式 `any`。

**改进**: 为以下接口补充了完整泛型：
- `addOrUpdateContact` -> `ApiResponse<ContactInfo>`
- `getContacts` -> `ApiResponse<ContactInfo[]>`
- `deleteContact` -> `ApiResponse<{ id: number }>`
- `getProductList` -> `ApiResponse<Record<string, unknown>[]>`
- `getDictDataList` -> `ApiResponse<Record<string, unknown>[]>`
- `authorizeSign` -> `ApiResponse<{ signRecordId: number; status: string }>`（同时消除了 `any`）

### 10.6 生产环境日志剥离 ✅

**文件**: `src/common/logger.ts`（新增）

**问题**: 全项目散布大量 `console.log/warn/error`，生产环境暴露调试信息且影响性能。

**改进**: 创建了统一的日志工具：
- `logger.log/info/debug`：生产环境静默
- `logger.warn`：生产环境保留但截断长参数（500 字符）
- `logger.error`：生产环境完整保留（用于错误监控）
- `logIf(condition, level, ...)`：条件性日志输出
- 内置循环引用检测和安全的 JSON 序列化

**使用方式**:
```typescript
import { logger } from "@/common/logger";
logger.info("调试信息"); // 生产环境自动跳过
logger.error("错误信息"); // 生产环境保留
```

### 10.7 命理模块新增 ✅

**文件**: `src/common/mingli/bazi.ts`、`src/common/mingli/liuyao.ts`、`src/pages/mingli/*`

**功能**: 完整的八字排盘和六爻摇卦功能，纯前端算法实现，包含：
- 八字四柱排盘（年月日时柱 + 十神 + 纳音 + 五行统计 + 大运）
- 六爻排盘（摇卦 + 纳甲 + 六亲 + 六神 + 世应 + 变卦）
- 64 卦完整数据（卦名、全名、卦辞、世应、宫位）
- 历史记录本地存储

### 10.8 待改进项

| 改进项 | 现状 | 建议 | 优先级 |
|--------|------|------|--------|
| 拆分 `videoFaceSign.vue` | 1169 行，逻辑过于集中 | 拆为 `useVideoSign` composable + `FaceSignDialog` + `ContractSignDialog` 子组件 | 高 |
| 六爻日干推算 | `liuYaoPaiPan()` 中硬编码为 `'甲'` | 根据实际日期推算日干支 | 高 |
| 八字时区处理 | `getDayZhu()` 使用本地时区 | 输入前转换为东八区真太阳时 | 中 |
| 大运起运年龄 | 简化为 `i * 10` | 精确到天数折算 | 中 |
| 爻辞数据补全 | `Gua64.yaoCi` 为空数组 | 补充 64 卦 384 爻辞 | 中 |
| 存储逻辑统一 | `local.ts` 中混用 localStorage 和 sessionStorage | 统一为 `useStorage()` 适配器，兼容小程序环境 | 低 |
| 历史记录上限 | `mingli_history` 无数量限制 | 添加最大 100 条限制，超出自动删除最早记录 | 低 |

---

## 十一、总结

`saas-mobile` 是一个功能完善的跨平台 SaaS 移动端应用，核心业务为车抵贷全流程管理，同时集成了点餐、征信、读书、命理等多个业务模块。项目采用 uni-app + Vue 3 + TypeScript 的现代技术栈，通过模块化架构实现多租户配置驱动的业务隔离。

**核心优势**:
- 完整的车贷业务闭环（线索 → 预审 → 补件 → 审批 → 签约 → 贷后）
- 跨平台一致性（H5 / 小程序 / App）
- 纯前端命理算法模块（八字 + 六爻）
- 完善的 HTTP 拦截与 Token 刷新机制
- TypeScript 全量类型覆盖 + 组合式函数复用

**技术债务**:
- `videoFaceSign.vue`（1169 行）需拆分重构
- 命理模块算法存在简化处理（日干硬编码、时区偏差、大运计算）
