# saas-mobile 项目说明

## 1. 项目定位

`saas-mobile` 是一个基于 `uni-app + Vue 3 + TypeScript + Pinia + uview-pro` 的多端移动项目。

当前项目的主业务是车贷流程，核心页面集中在 `src/pages/carloan`。除此之外，还包含两个相对独立的辅助模块：

- `src/pages/food`：点餐演示模块
- `src/pages/credit`：征信查询演示模块

首页入口在 [src/pages/index/index.vue](d:/zygProject/GitHub/saas-project/saas-mobile/src/pages/index/index.vue)，登录后可进入车贷工作台、点餐、征信和“我的”页面。

## 2. 技术栈与运行方式

### 技术栈

- 框架：`uni-app`
- 前端：`Vue 3`
- 状态管理：`Pinia`
- UI 组件库：`uview-pro`
- 请求封装：`uview-pro httpPlugin + 自定义拦截器`
- 国际化：`vue-i18n`
- 构建工具：`Vite`

### 常用命令

项目根目录：`saas-mobile`

```bash
pnpm run dev:h5
pnpm run build:h5:dev
pnpm run type-check
```

当前状态：

- `pnpm run build:h5:dev` 可以通过
- `pnpm run type-check` 仍有报错，但错误来自 `node_modules/uview-pro/components/u-upload/u-upload.vue`，不是当前业务代码本身

## 3. 目录结构

核心目录如下：

- `src/pages`
  页面目录
- `src/pages/carloan`
  车贷主业务页面
- `src/pages/index`
  首页
- `src/pages/my`
  我的、设置、FAQ、协议
- `src/pages/auth`
  登录、扫码中转
- `src/api`
  接口封装
- `src/stores`
  本地登录态、扫码态、购物车等状态
- `src/common`
  环境变量、请求拦截器、token、OCR、上传等公共能力
- `src/components/app-form`
  表单通用组件，很多车贷页面共用

## 4. 页面结构

### 4.1 首页与导航

- [src/pages/index/index.vue](d:/zygProject/GitHub/saas-project/saas-mobile/src/pages/index/index.vue)
  首页，显示用户信息和业务入口
- [src/pages/layout/layout.vue](d:/zygProject/GitHub/saas-project/saas-mobile/src/pages/layout/layout.vue)
  一套自定义 tabbar 布局，当前首页、车贷工作台、订单页、我的页在用
- [src/components/app-page/app-page.vue](d:/zygProject/GitHub/saas-project/saas-mobile/src/components/app-page/app-page.vue)
  通用页面容器，用于非 tab 页和常规业务页

说明：

项目里其实存在两套页面容器和 tabbar 思路：

- `layout.vue`：当前主入口在用
- `app-page.vue + app-tabbar.vue + stores/tabbar.ts`：保留了一套旧结构

目前项目能运行，但这两套导航体系并没有完全统一，后续如果继续重构导航，建议择一保留。

### 4.2 车贷主流程

车贷相关页面都在 `src/pages/carloan`，大致可以按流程分成几类：

- 工作台与待办
  `workbench.vue`、`todoCenter.vue`、`messageCenter.vue`
- 线索
  `leadAdd.vue`、`leadList.vue`
- 进件资料
  `idInfo.vue`、`carInfo.vue`、`applyInfo.vue`
- 补件资料
  `idInfoSupplement.vue`、`carInfoSupplement.vue`、`orderInfoSupplement.vue`、`fileInfoSupplement.vue`
- 订单与详情
  `entryList.vue`、`entryDetail.vue`、`orderList.vue`、`applyListPage.vue`、`applyDetail.vue`
- 签约流程
  `signCenter.vue`、`signConfirmAmount.vue`、`signBindCard.vue`、`videoFaceSign.vue`、`signGpsAppointment.vue`、`signMortgage.vue`、`faceSignResult.vue`
- 补件/进度
  `supplementList.vue`、`supplementDetail.vue`、`applyProgress.vue`
- 质押模式
  `pawnMaterials.vue`、`pawnLoanInfo.vue`、`pawnApprovalList.vue`、`pawnApprovalDetail.vue`

### 4.3 其他模块

- 点餐模块：`src/pages/food`
- 征信模块：`src/pages/credit`
- 我的模块：`src/pages/my`

## 5. 接口分层

### 5.1 环境配置

环境变量读取在 [src/common/env.ts](d:/zygProject/GitHub/saas-project/saas-mobile/src/common/env.ts)。

关键变量：

- `VITE_API_BASE_URL` 或 `VITE_API_URL`
  API 基础地址
- `VITE_TENANT_ID`
  租户 ID
- `VITE_REQUEST_TIMEOUT`
  请求超时时间

### 5.2 请求入口

请求基础配置在 [src/common/http.interceptor.ts](d:/zygProject/GitHub/saas-project/saas-mobile/src/common/http.interceptor.ts)。

它做了这些事：

- 统一设置 `baseUrl`
- 自动注入 `X-Tenant-ID`
- 根据登录态自动注入 `Authorization`
- 如果本地有机构信息，注入 `X-Org-Id`
- 统一处理 loading
- 统一处理 HTTP / 业务错误
- 遇到 `401` 时清空登录态并跳转登录页

### 5.3 认证接口

[src/api/auth.ts](d:/zygProject/GitHub/saas-project/saas-mobile/src/api/auth.ts) 主要包含：

- `/auth/login`
  用户名密码登录
- `/user/info`
  拉取当前用户信息
- `/auth/logout`
  登出
- `/auth/sms/send`
  短信验证码
- `/m/getToken`
  扫码场景下，通过业务员 ID 获取客户 token

### 5.4 业务接口

[src/api/business.ts](d:/zygProject/GitHub/saas-project/saas-mobile/src/api/business.ts) 是车贷业务接口总入口，主要包括：

- 身份信息
  `addOrUpdateIdCardInfo`、`getUserBasic`
- 车辆信息
  `addOrUpdateVehicle`、`getVehicleInfo`
- 订单/进件
  `getCreditList`、`getOrderList`、`getCreditDetail`、`getCreditDetailByOrderId`
- 补件
  `getSupplementList`
- 文件上传与文件列表
  `uploadFile`、`uploadWithType`、`getFileList`、`getFileListByType`
- OCR / 车型 / 估价
  `getIdCardOcr`、`getVehicleOcr`、`requestVehicleModel`、`getVehiclePriceByVin`
- 线索
  `addSalesLead`、`addClueFollowUp`、`getClueFollowUpList`
- 签约
  `startFaceSign`、`startAuthContractSign`、`startContractSign`
- 统计
  `getStatisticsOverview`

## 6. 登录态与扫码态

### 6.1 本地登录态

[src/stores/local.ts](d:/zygProject/GitHub/saas-project/saas-mobile/src/stores/local.ts)

用于保存正式登录用户信息，核心字段有：

- `token`
- `refreshToken`
- `userInfo`
- `orgId`
- `deptId`
- `roles`
- `roleKeys`
- `permissions`
- `expireTime`

本地登录后：

1. 调用 `/auth/login`
2. 保存 token / refreshToken
3. 调用 `/user/info`
4. 写入 `local-store`

登录页在 [src/pages/auth/login.vue](d:/zygProject/GitHub/saas-project/saas-mobile/src/pages/auth/login.vue)。

### 6.2 扫码中转态

[src/stores/session.ts](d:/zygProject/GitHub/saas-project/saas-mobile/src/stores/session.ts)

用于处理客户扫码进入流程的临时会话，核心字段有：

- `transferToken`
- `transferInfo`
- `orderInfo`
- `loanBusinessNodes`

扫码页在 [src/pages/auth/transfer.vue](d:/zygProject/GitHub/saas-project/saas-mobile/src/pages/auth/transfer.vue)。

扫码进入的大致流程：

1. 从二维码参数解析 `path`、`salesmanId`、`uuid`、`creditOrderId` 等信息
2. 调用 `/m/getToken` 获取客户 token
3. 清理旧 session
4. 保存 `transferToken` 和 `transferInfo`
5. 跳转到目标车贷页面

### 6.3 请求时 token 选取规则

在 [src/common/http.interceptor.ts](d:/zygProject/GitHub/saas-project/saas-mobile/src/common/http.interceptor.ts) 里，token 的选取逻辑是：

- 如果 `sessionStore.transferInfo.roleTags` 里包含“客户”，优先使用 `sessionStore.transferToken`
- 否则使用 `localStore.token`

这意味着：

- 内部员工登录流程走 `localStore`
- 客户扫码流程走 `sessionStore`

## 7. 这次已经做过的修正

本次已处理两类问题：

- 把源码里的 `pages/business/*` 旧路径迁移到了现有的 `pages/carloan/*`
- 修复了 `carInfoSupplement.vue` 的 `AppForm v-model="reactive const"` 构建 warning，并顺手统一了车贷页同类写法

另外补了几处可运行性修正：

- 不存在的旧页名 `leadDetail`、`approvalDetail`、`approvalAudit` 已改成现有可落地页面
- 几处错误使用 `switchTab` 跳非 tab 页的地方已改为 `navigateTo` / `reLaunch`

## 8. 当前仍需注意的问题

### 8.1 第三方类型报错

`pnpm run type-check` 目前仍会报：

- `node_modules/uview-pro/components/u-upload/u-upload.vue`

这是第三方依赖的 TS 报错，不是当前业务代码直接导致。

### 8.2 导航体系仍有历史残留

项目里还有两套导航思路并存：

- `layout.vue`
- `app-page.vue + app-tabbar.vue + stores/tabbar.ts`

现在虽然能跑，但后续如果要继续稳定主导航，建议统一到一套实现。

### 8.3 静态资源警告

H5 构建时还有两个非阻塞 warning：

- `iconfont.woff`
- `iconfont.ttf`

提示是构建时未解析，运行时再解析。这个不会阻止构建，但如果后续图标字体在某些环境丢失，可以从 `src/static/iconfont.css` 和对应资源路径继续排查。

## 9. 建议的后续整理顺序

如果后面继续收项目，建议按这个顺序：

1. 统一主导航和 tabbar 方案
2. 跑一轮真机或 H5 手工点链路，重点测车贷主流程
3. 处理 `uview-pro` 的类型噪声或做类型检查豁免
4. 再整理页面编码和历史乱码问题
