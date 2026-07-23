# 移动端多模块隔离 Checklist

> 范围：`saas-mobile` 多模块页面、API、Store、后端 controller/service  
> 模块：`carloan` / `food` / `reading` / `mingli` / `credit`

---

## carloan

| # | 检查项 | 页面/文件 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | 页面存在 | `pages/carloan/precheck/applyDetail.vue` | ✅ | |
| 2 | 页面存在 | `pages/carloan/precheck/applyInfo.vue` | ✅ | |
| 3 | 页面存在 | `pages/carloan/precheck/applyListPage.vue` | ✅ | |
| 4 | 页面存在 | `pages/carloan/precheck/applyProgress.vue` | ✅ | |
| 5 | 页面存在 | `pages/carloan/precheck/applyResult.vue` | ✅ | |
| 6 | 页面存在 | `pages/carloan/precheck/applySubmit.vue` | ✅ | |
| 7 | 页面存在 | `pages/carloan/precheck/carInfo.vue` | ✅ | |
| 8 | 页面存在 | `pages/carloan/precheck/entryDetail.vue` | ✅ | |
| 9 | 页面存在 | `pages/carloan/precheck/entryList.vue` | ✅ | |
| 10 | 页面存在 | `pages/carloan/precheck/idInfo.vue` | ✅ | |
| 11 | 页面存在 | `pages/carloan/precheck/leadAdd.vue` | ✅ | |
| 12 | 页面存在 | `pages/carloan/precheck/leadList.vue` | ✅ | |
| 13 | 页面存在 | `pages/carloan/signing/authSign.vue` | ✅ | |
| 14 | 页面存在 | `pages/carloan/signing/faceSignList.vue` | ✅ | |
| 15 | 页面存在 | `pages/carloan/signing/faceSignResult.vue` | ✅ | |
| 16 | 页面存在 | `pages/carloan/signing/signBindCard.vue` | ✅ | |
| 17 | 页面存在 | `pages/carloan/signing/signCenter.vue` | ✅ | |
| 18 | 页面存在 | `pages/carloan/signing/signConfirmAmount.vue` | ✅ | |
| 19 | 页面存在 | `pages/carloan/signing/signGpsAppointment.vue` | ✅ | |
| 20 | 页面存在 | `pages/carloan/signing/signMortgage.vue` | ✅ | |
| 21 | 页面存在 | `pages/carloan/signing/videoFaceSign.vue` | ✅ | |
| 22 | 页面存在 | `pages/carloan/supplement/carInfoSupplement.vue` | ✅ | |
| 23 | 页面存在 | `pages/carloan/supplement/fileInfoSupplement.vue` | ✅ | |
| 24 | 页面存在 | `pages/carloan/supplement/fileManage.vue` | ✅ | |
| 25 | 页面存在 | `pages/carloan/supplement/idInfoSupplement.vue` | ✅ | |
| 26 | 页面存在 | `pages/carloan/supplement/orderInfoSupplement.vue` | ✅ | |
| 27 | 页面存在 | `pages/carloan/supplement/supplementDetail.vue` | ✅ | |
| 28 | 页面存在 | `pages/carloan/supplement/supplementList.vue` | ✅ | |
| 29 | 页面存在 | `pages/carloan/postloan/earlyRepayment.vue` | ✅ | |
| 30 | 页面存在 | `pages/carloan/postloan/loanConfirm.vue` | ✅ | |
| 31 | 页面存在 | `pages/carloan/postloan/repaymentPlan.vue` | ✅ | |
| 32 | 页面存在 | `pages/carloan/approval/approvalList.vue` | ✅ | |
| 33 | 页面存在 | `pages/carloan/approval/pawnApprovalDetail.vue` | ✅ | |
| 34 | 页面存在 | `pages/carloan/approval/pawnApprovalList.vue` | ✅ | |
| 35 | 页面存在 | `pages/carloan/approval/pawnLoanInfo.vue` | ✅ | |
| 36 | 页面存在 | `pages/carloan/approval/pawnMaterials.vue` | ✅ | |
| 37 | 页面存在 | `pages/carloan/workbench/workbench.vue` | ✅ | |
| 38 | 页面存在 | `pages/carloan/order-list/orderList.vue` | ✅ | |
| 39 | 页面存在 | `pages/carloan/portal/messageCenter.vue` | ✅ | |
| 40 | 页面存在 | `pages/carloan/portal/todoCenter.vue` | ✅ | |
| 41 | Backend Controller | `saas-api/apps/admin-api/src/modules/application/application.controller.ts` | ✅ | |
| 42 | Backend Service | `saas-api/apps/admin-api/src/modules/application/application.service.ts` | ✅ | |

---

## food

| # | 检查项 | 页面/文件 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | 页面存在 | `pages/food/index/index.vue` | ✅ | |
| 2 | 页面存在 | `pages/food/goods/list.vue` | ✅ | |
| 3 | 页面存在 | `pages/food/order/cart.vue` | ✅ | |
| 4 | 页面存在 | `pages/food/order/list.vue` | ✅ | |
| 5 | Backend Controller | `saas-api/apps/admin-api/src/modules/food/food.controller.ts` | ✅ | |
| 6 | Backend Service | `saas-api/apps/admin-api/src/modules/food/food.service.ts` | ✅ | |

---

## reading

| # | 检查项 | 页面/文件 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | 页面存在 | `pages/reading/index/index.vue` | ✅ | |
| 2 | 页面存在 | `pages/reading/reader/index.vue` | ✅ | |
| 3 | 页面存在 | `pages/reading/store/detail.vue` | ✅ | |
| 4 | 页面存在 | `pages/reading/store/index.vue` | ✅ | |
| 5 | 页面存在 | `pages/reading/download/list.vue` | ✅ | |
| 6 | Backend Controller | `saas-api/apps/admin-api/src/modules/reading/reading.controller.ts` | ✅ | |
| 7 | Backend Service | `saas-api/apps/admin-api/src/modules/reading/reading.service.ts` | ✅ | |

---

## mingli

| # | 检查项 | 页面/文件 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | 页面存在 | `pages/mingli/index/index.vue` | ✅ | |
| 2 | 页面存在 | `pages/mingli/bazi/input.vue` | ✅ | |
| 3 | 页面存在 | `pages/mingli/bazi/result.vue` | ✅ | |
| 4 | 页面存在 | `pages/mingli/liuyao/result.vue` | ✅ | |
| 5 | 页面存在 | `pages/mingli/liuyao/shake.vue` | ✅ | |

---

## credit

| # | 检查项 | 页面/文件 | 状态 | 说明 |
|---|---|---|---|---|
| 1 | 页面存在 | `pages/credit/index/index.vue` | ✅ | |
| 2 | 页面存在 | `pages/credit/query/result.vue` | ✅ | |
| 3 | Backend Controller | `saas-api/apps/admin-api/src/modules/mobile-business/modules/credit/credit.controller.ts` | ✅ | |

---

## 通用隔离要求

| # | 检查项 | 当前状态 | 建议 |
|---|---|---|---|
| 1 | 数据隔离 | 各模块 service 已使用 `getCurrentTenantId()` | 查询条件增加 `userId` / `salesmanId` 数据权限 |
| 2 | 鉴权统一 | 移动端多为 `JwtAuthGuard` | `food` 等模块存在 `GetCurrentUserId` 语义不一致 |
| 3 | 模块开关缓存 | `mobile-config` 返回 resolved 配置 | 增加配置变更后的前端刷新机制 |
| 4 | 错误隔离 | 各模块独立页面/组件 | 增加模块级错误兜底，避免首页崩溃 |
| 5 | 接口权限 | `mobile-config` 写接口仅 JWT | 写接口增加 `@Roles` 或自定义权限装饰器 |

---

## 风险汇总

| 风险等级 | 数量 | 说明 |
|---|---|---|
| P0 | 3 | `mobile-config` 写接口无角色限制、`credit/user` 查询缺 `userId` 过滤、`food` 鉴权不一致 |
| P1 | 6 | 模块 API/Store 隔离、模块开关缓存、错误边界、数据权限细化 |
| P2 | 0 | |

检查项总数：68
