# saas-mobile 移动端项目深度分析报告（补充版）

> 本文档在 `MOBILE_ANALYSIS.md` 基础上，对源码实现进行逐层深入分析，聚焦架构模式、代码质量、安全机制、可维护性及改进建议。

---

## 一、项目整体架构总览

```
┌──────────────────────────────────────────────────────────────┐
│                     uni-app 跨平台运行时                       │
├──────────────────────────────────────────────────────────────┤
│  页面层 (pages/) ─── 60+ 页面，按业务模块组织                   │
│    ├── portal/  auth/  carloan/  food/  credit/  reading/  my/│
├──────────────────────────────────────────────────────────────┤
│  组合式函数 (composables/) ─── useListPage / useLang / ...     │
├──────────────────────────────────────────────────────────────┤
│  状态管理 (stores/) ─── local / carloan / session / food / ... │
├──────────────────────────────────────────────────────────────┤
│  API 层 (api/) ─── carloan.ts(655行) / auth / food / credit ...│
├──────────────────────────────────────────────────────────────┤
│  公共能力 (common/) ─── http拦截器 / 导航 / Token / 环境变量    │
├──────────────────────────────────────────────────────────────┤
│  UI 框架 ─── uView Pro + UnoCSS + 自定义组件(app-page等)       │
└──────────────────────────────────────────────────────────────┘
```

---

## 二、HTTP 请求层深度分析

### 2.1 请求拦截器架构 (`src/common/http.interceptor.ts`)

```
请求发起 → request拦截器 → 注入Token/Tenant/Org → uni.request
                                                          ↓
业务代码 ← response拦截器 ← 统一错误处理 ← HTTP响应
```

**核心设计：**

| 能力 | 实现方式 | 评价 |
|------|---------|------|
| Token 注入 | `getRequestToken()` 自动选择业务员Token或客户Token | ✅ 支持双角色场景 |
| 租户隔离 | `X-Tenant-ID` 头注入 | ✅ 多租户SaaS标准做法 |
| 机构隔离 | `X-Org-Id` 头注入 | ✅ 数据权限控制 |
| Loading | `uni.showLoading` / `uni.hideLoading` | ⚠️ 全局Loading可能遮挡 |
| 错误处理 | HTTP错误 + 业务错误分层处理 | ✅ 分层清晰 |
| 401处理 | 自动清除登录态 + `reLaunch` 跳登录 | ✅ 标准做法 |

**双角色 Token 机制：**

```typescript
function getRequestToken() {
  const roleTags = sessionStore.transferInfo?.roleTags;
  if (roleTags === "客户") {
    return sessionStore.transferToken;  // 客户端用中转Token
  }
  return localStore.token;              // 业务员用本地Token
}
```

> 这是为了支持「业务员生成二维码 → 客户扫码进入」的 C 端场景，客户使用临时 Token 操作，与业务员 Token 隔离。

### 2.2 API 层设计模式 (`src/api/carloan.ts`)

**工厂模式 + Hook 风格：**

```typescript
export function useCarloanApi() {
  return {
    addOrUpdateUserBasic: (data) => http.post("/m/user/addOrUpdateUserBasic", data),
    // ... 50+ 接口
  };
}
```

- ✅ **优点**：统一入口，调用简洁（`const api = useCarloanApi(); api.getIdCardInfo()`）
- ⚠️ **问题**：每次调用 `useCarloanApi()` 都创建新对象，虽然实际开销极小，但不符合 Vue 惯例的「use」前缀语义
- ⚠️ **类型安全**：部分接口返回类型为 `any` 或 `unknown`，如 `authorizeSign` 返回 `ApiResponse<any>`

**接口分类统计（50+ 接口）：**

| 领域 | 接口数 | 代表接口 |
|------|--------|---------|
| 用户/身份证 | 8 | `addOrUpdateUserBasic`, `getIdCardOcr` |
| 车辆 | 6 | `addOrUpdateVehicle`, `getVehicleOcr`, `getVehiclePriceByVin` |
| 文件管理 | 8 | `uploadFile`, `getFileList`, `deleteFile` |
| 授信/进件 | 8 | `creditApply`, `getCreditList`, `getCreditDetail` |
| 流程推进 | 5 | `submitApplication`, `completeSupplement` |
| 签约 | 8 | `startFaceSign`, `startContractSign`, `authorizeSign` |
| 贷后 | 5 | `confirmAmount`, `getRepaymentPlans`, `applyEarlyRepayment` |
| 统计/流程 | 3 | `getStatisticsOverview`, `getLifecycle` |
| 字典/枚举 | 4 | `getDictDataList`, `getLoanBusinessNodes` |
| 线索 | 4 | `addSalesLead`, `addClueFollowUp` |
| 银行卡 | 3 | `getBankCards`, `addBankCard`, `deleteBankCard` |

### 2.3 文件上传机制

```typescript
// 两种上传方式
uploadFile(filePath, url)           // 纯文件上传
uploadFileWithData(filePath, url, formData)  // 带 formData 的上传
```

- 使用 `uni.uploadFile` 原生能力，兼容多平台
- 响应通过 `normalizeUploadResponse()` 统一规范化
- ⚠️ 缺少上传进度回调，大文件场景体验不佳
- ⚠️ 缺少文件大小/类型前端校验（`UPLOAD_MAX_SIZE` 定义了但未在上传函数中使用）

---

## 三、状态管理深度分析

### 3.1 Store 架构

```
┌─────────────────────────────────────────────┐
│              Pinia Store 体系                 │
├──────────┬──────────┬───────────────────────┤
│ local    │ carloan  │ session               │
│ (持久化)  │ (会话级)  │ (会话级)               │
│ localStorage │ sessionStorage │ sessionStorage│
├──────────┴──────────┴───────────────────────┤
│ food / reading / tabbar / counter            │
│ (非持久化)                                    │
└─────────────────────────────────────────────┘
```

### 3.2 `local` Store — 全局认证与配置

**State 设计：**
```typescript
{
  token: "",           // 业务员Token
  refreshToken: "",    // 刷新Token
  userInfo: null,      // 用户完整信息(73个字段)
  orgId: "",           // 当前机构
  deptId: "",          // 当前部门
  roles: [],           // 角色列表
  roleKeys: [],        // 角色编码
  permissions: [],     // 权限标识
  currentSystem: "portal",  // 当前模块
  mobileConfig: null,  // 移动端模块配置
  loginTime: 0,        // 登录时间
  expireTime: 0,       // 过期时间
}
```

**权限判断：**
```typescript
hasRole(roleKey)      // 角色检查
hasPermission(perm)   // 权限检查（支持 *:*:* 通配）
isAuthenticated       // Token存在且未过期
isExpired             // 过期时间检查
```

> ✅ 权限模型完整，支持角色 + 权限标识双层控制
> ⚠️ `refreshToken` 已存储但拦截器中未实现自动刷新逻辑（Token 过期直接跳登录）

### 3.3 `carloan` Store — 车贷业务上下文

**页面上下文传递机制：**
```typescript
interface CarloanPageContext {
  uuid: string;           // 客户唯一编码
  creditOrderId: string;  // 授信订单ID
  customerName: string;   // 客户姓名
  customerPhone: string;  // 客户电话
  nodeCode: string;       // 当前节点
}
```

```typescript
// 从路由参数自动映射
syncFromRouteQuery(query) {
  creditOrderId: query.creditOrderId || query.orderNo,  // 兼容旧字段
  customerName: query.customerName || query.name,       // 兼容旧字段
  customerPhone: query.customerPhone || query.phone,    // 兼容旧字段
}
```

> ✅ 解决了 uni-app 页面间参数传递的痛点，通过 Store + 路由参数双重保障
> ✅ 支持草稿保存（`draftMap`），适合长表单场景
> ⚠️ `currentOrder` 与 `pageContext` 存在字段重叠，可能造成数据不一致

### 3.4 `session` Store — 客户中转会话

```typescript
{
  transferToken: "",      // 客户临时Token
  transferInfo: {         // 中转信息
    path, salesmanId, roleTags, orderId, uuid, ...
  },
  orderInfo: null,        // 订单上下文
  loanBusinessNodes: [],  // 业务节点枚举缓存
}
```

> 这是客户扫码场景的核心：业务员生成二维码 → 客户扫码进入 `transfer` 页 → 解析参数存入 session → 后续请求使用 `transferToken`

### 3.5 持久化适配器

```typescript
// 统一适配 uni 存储，兼容小程序环境
const localStorageAdapter = {
  getItem: (key) => uni.getStorageSync(key),
  setItem: (key, value) => uni.setStorageSync(key, value),
  removeItem: (key) => uni.removeStorageSync(key),
};
```

> ✅ 优雅解决 H5（localStorage）与小程序（uni.getStorageSync）的存储差异

---

## 四、路由与导航系统深度分析

### 4.1 路由常量体系 (`navigation.ts`)

```typescript
APP_ROUTES = {
  portal: { home },
  carloan: {
    home, orders, legacyWorkbench,
    portal: { workbench, messageCenter, todoCenter },
    precheck: { leadAdd, leadList, idInfo, carInfo, applyInfo, ... },
    supplement: { supplementList, idInfoSupplement, ... },
    approval: { approvalList, pawnApprovalList, ... },
    signing: { signCenter, videoFaceSign, authSign, ... },
    postloan: { loanConfirm, repaymentPlan },
  },
  food: { home, orders, cart },
  reading: { home, store, detail, reader, download },
  credit: { home },
  my: { home },
  auth: { login },
}
```

> ✅ 路由集中管理，避免硬编码字符串
> ✅ 层级化结构清晰反映业务模块

### 4.2 多作用域 TabBar 系统

```
5 种 TabBar 作用域，每套独立配置：

portal  → [首页, 我的]
carloan → [首页, 订单, 我的]
food    → [首页, 订单, 我的]
credit  → [首页, 我的]
reading → [书架, 书城, 我的]
```

**导航模式：**
```typescript
type NavigationMode = "switchTab" | "redirectTo" | "reLaunch";
```

- `switchTab`：用于 TabBar 页面间切换
- `reLaunch`：关闭所有页面重新打开（车贷首页）
- `redirectTo`：替换当前页（部分模块首页）

> ✅ 灵活的导航策略，适配不同平台的 TabBar 限制

### 4.3 模块动态启用机制

```typescript
function getInitialMobileEntry(config) {
  // 多模块 → 门户首页
  if (canSwitchMobileModule(config)) {
    return { route: portal.home, system: "portal" };
  }
  // 单模块 → 直达模块首页
  const preferredModule = config.defaultModule || enabledModules[0];
  return { route: MODULE_HOME_ROUTE_MAP[preferredModule], ... };
}
```

**角色到模块映射：**
```typescript
const ROLE_MODULE_MAP = {
  R_USER: carloan.home,
  R_SALES_MANAGER: carloan.home,
  // 可扩展其他角色
};
```

> ✅ SaaS 多租户标准做法：后端配置驱动 + 角色映射

### 4.4 回退导航

```typescript
function navigateBackOrFallback() {
  // 有历史页面 → navigateBack
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 });
    return;
  }
  // 无历史 → 根据当前路由推断模块首页
  const fallback = getFallbackRouteByPage();
  isSystemTabbarRoute(fallback) ? switchTab : reLaunch;
}
```

> ✅ 解决了 deeplink 直达页面后无法返回的问题

---

## 五、组合式函数分析

### 5.1 `useListPage<T>` — 通用列表逻辑

```typescript
function useListPage<T>(options: {
  fetchFn,         // 请求函数
  defaultParams,   // 默认参数
  pageSize,        // 每页条数
  getRows,         // 从响应提取列表
  getTotal,        // 从响应提取总数
})
```

**提供能力：**

| 功能 | 方法 | 说明 |
|------|------|------|
| 分页加载 | `fetchList(isRefresh)` | 支持首屏/刷新/加载更多 |
| 搜索 | `handleSearch()` | 自动区分手机号(7位+)和姓名 |
| 下拉刷新 | `onRefresh()` | 重置分页 |
| 上拉加载 | `loadMore()` | 追加数据 |
| 回到顶部 | `backToTop()` | 滚动控制 |
| 状态 | `loading`, `hasMore`, `isRefreshing` | 完整的加载状态 |

> ✅ 泛型设计，类型安全
> ✅ 智能搜索（手机号 vs 姓名）
> ⚠️ `hasMore` 判断基于 `list.length < total`，若后端返回重复数据可能出问题
> ⚠️ 缺少防抖/节流机制

### 5.2 其他 composables

- `useLang`：语言切换
- `useConfirm`：确认对话框封装
- `useCloseBrowser`：关闭浏览器/返回上一页

---

## 六、车贷业务流程深度分析

### 6.1 全生命周期流程

```
线索管理          预审阶段           补件阶段          签约阶段          贷后管理
  │                 │                  │                │                │
  ├─ 新增线索       ├─ 身份证信息(1100) ├─ 客户资料(1310) ├─ 额度确认(1610) ├─ 请款确认
  ├─ 线索列表       ├─ 车辆信息(1110)   ├─ 车辆资料(1320) ├─ 绑银行卡(1620) ├─ 还款计划
  ├─ 线索跟进       ├─ 申请信息(1120)   ├─ 订单资料(1330) ├─ 合同签署(1630) ├─ 提前还款
  │                 ├─ 签署授权书(1130) ├─ 文件资料(1340) ├─ GPS安装(1640)  │
  │                 │                  │                ├─ 抵押办理(1650)  │
  │                 │                  │                │                │
  └─────────────────┴──────────────────┴────────────────┴────────────────┘
                         ↑ nodeCode 驱动的状态机 ↑
```

### 6.2 工作台页面分析 (`workbench.vue`)

**功能模块：**
1. **顶部头部**：日期、用户名、在线状态、消息未读数
2. **快捷入口**：新增线索（绿色卡片）、进件（蓝色卡片），均支持二维码生成
3. **今日概览**：6 项统计指标（今日线索/进件/待补件/待签约/本月放款/审批通过率）
4. **业务节点网格**：按 4 个阶段（预审/补件/签约/贷后）展示，点击跳转对应节点订单列表
5. **二维码弹窗**：生成业务推广二维码，7天有效

**二维码生成机制：**
```typescript
const fullPath = `${baseUrl}/#/pages/auth/transfer?transferInfo=${encode({
  path: config.path,
  salesmanId,
  roleTags: "客户",
})}`;
qrImageUrl = await generateQRCode(fullPath);  // 7天有效期
```

### 6.3 表单页面通用模式

车贷业务页面（`idInfo.vue`、`carInfo.vue`、`applyInfo.vue` 等）遵循统一模式：

```
1. onLoad -> syncFromRouteQuery(query)  // 从路由提取上下文
2. onLoad -> fetchDetail()              // 加载已有数据
3. 用户编辑表单                          // 双向绑定
4. 保存 -> validate() -> save()         // 校验+提交
5. 保存成功 -> navigateTo(下一步)        // 流程推进
```

**关键设计点：**

| 设计 | 实现 | 说明 |
|------|------|------|
| 上下文传递 | `carloanStore.syncFromRouteQuery()` | 统一字段映射 |
| 草稿保存 | `carloanStore.saveDraft(pageKey, data)` | 防止数据丢失 |
| OCR 集成 | `getIdCardOcr()` / `getVehicleOcr()` | 拍照识别自动填充 |
| 文件上传 | `uploadFileWithData()` | 支持业务参数 |
| 表单校验 | uView `u-form` + `rules` | 组件级校验 |
| 流程推进 | `submitApplication()` + nodeCode | 状态机驱动 |

### 6.4 视频面签页面 (`videoFaceSign.vue`)

这是最复杂的页面之一，涉及：

1. **活体检测**：调用前端 SDK 进行人脸识别
2. **视频录制**：`uni.chooseVideo` / 自定义录制
3. **实时上传**：录制完成后自动上传
4. **状态轮询**：等待后端审核结果
5. **签名叠加**：视频上叠加电子签名

```typescript
// 核心流程
启动面签 -> 前端活体检测 -> 录制视频 -> 上传 -> 轮询结果 -> 完成/重试
```

> ⚠️ 视频文件可能较大，当前缺少分片上传和断点续传机制

### 6.5 签约中心流程

```
signCenter (节点路由)
  ├── nodeCode=1610 -> signConfirmAmount (额度确认)
  ├── nodeCode=1620 -> signBindCard (绑卡)
  ├── nodeCode=1630 -> authSign (合同签署)
  │                    ├── 视频面签
  │                    └── 电子签名
  ├── nodeCode=1640 -> signGpsAppointment (GPS安装预约)
  └── nodeCode=1650 -> signMortgage (抵押登记)
```

---

## 七、安全机制分析

### 7.1 认证安全

| 机制 | 实现 | 评价 |
|------|------|------|
| Token 存储 | localStorage（H5）/ uni.storage（小程序） | ⚠️ H5 存在 XSS 风险 |
| Token 传输 | `Authorization: Bearer xxx` 头 | ✅ 标准做法 |
| 过期处理 | `expireTime` 前端检查 + 401 被动处理 | ✅ 双重保障 |
| Refresh Token | 已存储但未启用自动刷新 | ⚠️ 未完成功能 |
| 退出登录 | 清除所有 Store 状态 + 跳转登录 | ✅ 完整清理 |

### 7.2 租户与数据隔离

```typescript
// 请求头注入
headers["X-Tenant-ID"] = TENANT_ID;   // 租户隔离
headers["X-Org-Id"] = orgId;          // 机构数据隔离
headers["X-Dept-Id"] = deptId;        // 部门数据隔离（部分接口）
```

> ✅ 多租户 + 多层级数据隔离设计完善

### 7.3 敏感信息处理

- 身份证号、手机号在列表页做了脱敏显示（`****`）
- 银行卡号仅显示后 4 位
- ⚠️ Token 以明文存储在 localStorage，建议考虑加密存储
- ⚠️ 二维码中 `transferInfo` 使用 Base64 编码（非加密），包含业务员 ID

### 7.4 CSRF 防护

> ⚠️ 未发现 CSRF Token 机制，但 API 使用 Bearer Token 认证，天然免疫 CSRF

---

## 八、性能与优化分析

### 8.1 打包与构建

```typescript
// vite.config.ts 关键配置
build: {
  target: "es2015",        // 兼容性
  cssCodeSplit: true,      // CSS 拆分
  chunkSizeWarningLimit: 500,
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['vue', 'pinia', 'vue-router'],
      }
    }
  }
}
```

### 8.2 图片优化

- 使用 `uni.getImageInfo` 获取图片信息
- 上传前通过 `uni.compressImage` 压缩
- ⚠️ 缺少懒加载和 WebP 自动适配

### 8.3 列表性能

- `useListPage` 实现了分页加载
- ⚠️ 长列表未使用虚拟滚动，大量数据时可能卡顿
- ⚠️ 图片列表未实现懒加载

### 8.4 缓存策略

| 数据 | 缓存方式 | 有效期 |
|------|---------|--------|
| Token/用户信息 | localStorage | Token 过期前 |
| 车贷业务上下文 | sessionStorage | 会话级 |
| 业务节点枚举 | session store | 会话级 |
| 移动端配置 | localStorage | 持久 |
| 字典数据 | ⚠️ 无缓存 | 每次请求 |

> ⚠️ 字典数据（如银行列表、车型列表）频繁请求，建议增加缓存层

---

## 九、代码质量与规范

### 9.1 TypeScript 使用

- ✅ 全项目使用 TypeScript，类型覆盖率高
- ✅ 接口类型定义完善（如 `UserInfo` 73 个字段全注释）
- ✅ 泛型应用（`useListPage<T>`、`ApiResponse<T>`）
- ⚠️ 部分接口返回类型为 `any`，如 `authorizeSign: ApiResponse<any>`
- ⚠️ `as unknown as` 类型断言较多，绕过了类型检查

### 9.2 代码组织

```
src/
├── api/              # 按领域分文件
├── common/           # 公共能力
├── components/       # 全局组件
├── composables/      # 组合式函数
├── pages/            # 按模块组织页面
├── static/           # 静态资源
├── stores/           # 状态管理
└── utils/            # 工具函数
```

> ✅ 目录结构清晰，职责分离
> ⚠️ `common/` 和 `utils/` 边界模糊，部分功能可整合

### 9.3 ESLint 与格式化

- ✅ 配置了 `eslint.config.js`
- ✅ 使用 Prettier 统一格式
- ✅ UnoCSS 原子化样式，减少 CSS 维护成本

### 9.4 测试覆盖

- ✅ 配置了 Playwright E2E 测试（`playwright.config.ts`）
- ⚠️ 缺少单元测试
- ⚠️ E2E 测试覆盖主要流程，但边缘场景覆盖不足

---

## 十、问题总结与改进建议

### 10.1 高优先级问题

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| 1 | **Refresh Token 未启用** | 用户体验差，Token 过期直接跳登录 | 在拦截器中实现 401 -> refresh -> retry 逻辑 |
| 2 | **文件上传无前端校验** | 可上传超大文件导致失败 | 在 `uploadFile` 中增加大小/类型校验 |
| 3 | **字典数据无缓存** | 每次进入页面重复请求 | 增加 TTL 缓存机制 |
| 4 | **长列表无虚拟滚动** | 大量数据时卡顿 | 引入虚拟列表组件 |
| 5 | **API 返回类型不完整** | 类型安全缺失 | 补充 `any` 类型的接口返回定义 |

### 10.2 中优先级问题

| # | 问题 | 建议 |
|---|------|------|
| 6 | `useCarloanApi()` 命名不符语义 | 改为 `carloanApi` 单例或 `createCarloanApi()` |
| 7 | `currentOrder` 与 `pageContext` 字段重叠 | 统一为单一数据源 |
| 8 | 全局 Loading 可能遮挡 | 支持自定义 Loading 遮罩 |
| 9 | 上传无进度回调 | 增加 `onProgress` 回调 |
| 10 | 二维码信息未加密 | 考虑加密或使用短链 |

### 10.3 低优先级优化

| # | 问题 | 建议 |
|---|------|------|
| 11 | `common/` 与 `utils/` 职责重叠 | 合并或明确边界 |
| 12 | 缺少单元测试 | 核心 utils 增加 Vitest 测试 |
| 13 | 图片未懒加载 | 列表图片使用懒加载 |
| 14 | 草稿数据无过期清理 | 增加 TTL 或手动清理时机 |
| 15 | 环境变量文档缺失 | 补充 `.env` 字段说明文档 |

---

## 十一、技术栈依赖分析

### 核心依赖

| 依赖 | 版本范围 | 用途 |
|------|---------|------|
| `uni-app` | ^3.0 | 跨平台框架 |
| `vue` | ^3.4 | 响应式框架 |
| `pinia` | ^2.1 | 状态管理 |
| `pinia-plugin-persistedstate` | ^3.2 | Store 持久化 |
| `uview-pro` | ^3.0 | UI 组件库 |
| `unocss` | ^0.58 | 原子化 CSS |
| `vite` | ^5.0 | 构建工具 |
| `typescript` | ^5.3 | 类型系统 |
| `qrcode` | ^1.5 | 二维码生成 |

### 环境配置

| 文件 | 用途 |
|------|------|
| `.env.development` | 开发环境 |
| `.env.sit` | SIT 测试环境 |
| `.env.production` | 生产环境 |

**关键环境变量：**

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_APP_ENV` | 环境标识 | development |
| `VITE_API_BASE_URL` | API 地址 | - |
| `VITE_TENANT_ID` | 租户 ID | 1 |
| `VITE_APP_NAME` | 应用名 | 予艺助手 |
| `VITE_UPLOAD_MAX_SIZE` | 上传限制(MB) | 10 |
| `VITE_REQUEST_TIMEOUT` | 请求超时(ms) | 30000 |
| `VITE_DEBUG` | 调试模式 | false |

---

## 十二、总结

### 项目优势

1. **架构清晰**：页面/组件/Store/API/工具 分层明确，职责清晰
2. **多租户 SaaS 设计**：租户隔离 + 机构隔离 + 模块动态启用，符合 SaaS 标准
3. **双角色认证**：业务员/客户双 Token 机制，支持扫码 C 端场景
4. **完整的车贷业务闭环**：从线索到贷后全流程覆盖，nodeCode 驱动的状态机
5. **TypeScript 全面应用**：类型安全，接口定义完善
6. **跨平台兼容**：通过 uni 存储适配器等机制优雅处理平台差异
7. **路由集中管理**：避免硬编码，支持多模块多 TabBar 作用域

### 待改进方向

1. **Token 刷新机制**：实现 Refresh Token 自动续期
2. **性能优化**：虚拟列表、图片懒加载、字典缓存
3. **类型完善**：补充 API 返回类型定义
4. **文件上传**：增加校验、进度、分片上传
5. **测试覆盖**：增加单元测试和 E2E 边缘场景
6. **安全加固**：Token 加密存储、二维码信息加密

### 整体评价

该项目是一个**成熟的 SaaS 车贷移动端应用**，架构设计规范，业务覆盖完整。代码质量整体较高，TypeScript 类型系统应用充分。主要改进方向集中在性能优化和安全加固上，不影响核心功能但影响用户体验和安全水位。
