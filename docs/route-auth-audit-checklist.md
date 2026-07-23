# 路由级鉴权复核 Checklist

> 范围：`saas-api/apps/admin-api/src/**/*.controller.ts`，共 47 个 controller。
> 说明：以下清单为静态初筛，标记为 `需复核` 的项需要进文件确认运行时 guards / roles / permissions / 数据权限是否真的生效。

---

## saas-api/apps/admin-api/src/modules/announcement/announcement.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | Public(class) | 数据权限/租户隔离 |
| 2 | `Get` | `'active'` | `getActive` | Public | 数据权限/租户隔离 |
| 3 | `Get` | `':id'` | `getById` | Public(class) | 数据权限/租户隔离 |
| 4 | `Post` | `'create'` | `create` | Public(class) | 数据权限/租户隔离 |
| 5 | `Post` | `':id'` | `update` | Public(class) | 数据权限/租户隔离 |
| 6 | `Post` | `':id/publish'` | `publish` | Public(class) | 数据权限/租户隔离 |
| 7 | `Post` | `':id/unpublish'` | `unpublish` | Public(class) | 数据权限/租户隔离 |
| 8 | `Post` | `':id/expire'` | `expire` | Public(class) | 数据权限/租户隔离 |
| 9 | `Post` | `':id/delete'` | `delete` | Public(class) | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/application/application.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'flow-list'` | `flowList` | JWT | 数据权限/租户隔离 |
| 3 | `Get` | `'order-list'` | `orderList` | JWT | 数据权限/租户隔离 |
| 4 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 7 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |
| 8 | `Post` | `':id/submit'` | `submit` | JWT | 数据权限/租户隔离 |
| 9 | `Post` | `':id/precheck-pass'` | `precheckPass` | JWT | 数据权限/租户隔离 |
| 10 | `Post` | `':id/risk-pre-pass'` | `riskPrePass` | JWT | 数据权限/租户隔离 |
| 11 | `Post` | `':id/risk-pre-reject'` | `riskPreReject` | JWT | 数据权限/租户隔离 |
| 12 | `Post` | `':id/risk-pre-return'` | `riskPreReturn` | JWT | 数据权限/租户隔离 |
| 13 | `Post` | `':id/funder-pre-pass'` | `funderPrePass` | JWT | 数据权限/租户隔离 |
| 14 | `Post` | `':id/funder-pre-reject'` | `funderPreReject` | JWT | 数据权限/租户隔离 |
| 15 | `Post` | `':id/complete-supplement'` | `completeSupplement` | JWT | 数据权限/租户隔离 |
| 16 | `Post` | `':id/approve'` | `async approve` | JWT | 数据权限/租户隔离 |
| 17 | `Post` | `':id/reject'` | `async reject` | JWT | 数据权限/租户隔离 |
| 18 | `Post` | `':id/supplement'` | `async requestSupplement` | JWT | 数据权限/租户隔离 |
| 19 | `Post` | `':id/submit-funder-review'` | `submitFunderReview` | JWT | 数据权限/租户隔离 |
| 20 | `Post` | `':id/funder-pass'` | `funderPass` | JWT | 数据权限/租户隔离 |
| 21 | `Post` | `':id/funder-reject'` | `funderReject` | JWT | 数据权限/租户隔离 |
| 22 | `Post` | `':id/start-signing'` | `startSigning` | JWT | 资金/业务敏感数据 |
| 23 | `Post` | `':id/complete-signing'` | `async completeSigning` | JWT | 资金/业务敏感数据 |
| 24 | `Post` | `':id/gps-installed'` | `completeGpsInstall` | JWT | 数据权限/租户隔离 |
| 25 | `Post` | `':id/mortgage-done'` | `completeMortgage` | JWT | 数据权限/租户隔离 |
| 26 | `Post` | `':id/request-disbursement'` | `requestDisbursement` | JWT | 资金/业务敏感数据 |
| 27 | `Post` | `':id/submit-loan-request'` | `submitLoanRequest` | JWT | 数据权限/租户隔离 |
| 28 | `Post` | `':id/approve-loan-request'` | `approveLoanRequest` | JWT | 数据权限/租户隔离 |
| 29 | `Post` | `':id/reject-loan-request'` | `rejectLoanRequest` | JWT | 数据权限/租户隔离 |
| 30 | `Post` | `':id/confirm-disbursement'` | `async confirmDisbursement` | JWT | 资金/业务敏感数据 |
| 31 | `Post` | `'repayment-plan/:planId/register'` | `registerRepayment` | JWT | 资金/业务敏感数据 |
| 32 | `Post` | `':id/register-repayment'` | `registerRepaymentByApplication` | JWT | 资金/业务敏感数据 |
| 33 | `Post` | `':id/settle'` | `settle` | JWT | 数据权限/租户隔离 |
| 34 | `Get` | `'repayment-plans/:id'` | `getRepaymentPlans` | JWT | 资金/业务敏感数据 |
| 35 | `Get` | `'overdue-list'` | `getOverdueList` | JWT | 数据权限/租户隔离 |
| 36 | `Post` | `':id/collection-record'` | `addCollectionRecord` | JWT | 数据权限/租户隔离 |
| 37 | `Get` | `':id/collection-records'` | `getCollectionRecords` | JWT | 数据权限/租户隔离 |
| 38 | `Post` | `':id/early-repayment'` | `applyEarlyRepayment` | JWT | 资金/业务敏感数据 |
| 39 | `Post` | `'early-repayment/:id/approve'` | `approveEarlyRepayment` | JWT | 资金/业务敏感数据 |
| 40 | `Post` | `'early-repayment/:id/complete'` | `completeEarlyRepayment` | JWT | 资金/业务敏感数据 |
| 41 | `Get` | `':id/early-repayments'` | `getEarlyRepayments` | JWT | 资金/业务敏感数据 |
| 42 | `Get` | `'lifecycle/:id'` | `getLifecycle` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/approval/approval.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/article/article.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `async getList` | 需复核 | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `async getById` | 需复核 | 数据权限/租户隔离 |
| 3 | `Post` | `` | `async create` | 需复核 | 数据权限/租户隔离 |
| 4 | `Put` | `':id'` | `async update` | 需复核 | 数据权限/租户隔离 |
| 5 | `Delete` | `':id'` | `async remove` | 需复核 | 数据权限/租户隔离 |
| 6 | `Post` | `':id/like'` | `async like` | 需复核 | 数据权限/租户隔离 |
| 7 | `Get` | `'type/list'` | `async getTypeList` | 需复核 | 数据权限/租户隔离 |
| 8 | `Get` | `'type/all'` | `async getAllTypes` | 需复核 | 数据权限/租户隔离 |
| 9 | `Post` | `'type'` | `async createType` | 需复核 | 数据权限/租户隔离 |
| 10 | `Put` | `'type/:id'` | `async updateType` | 需复核 | 数据权限/租户隔离 |
| 11 | `Delete` | `'type/:id'` | `async removeType` | 需复核 | 数据权限/租户隔离 |
| 12 | `Get` | `'comment/list'` | `async getComments` | 需复核 | 数据权限/租户隔离 |
| 13 | `Get` | `':id/comments'` | `async getCommentsByArticle` | 需复核 | 数据权限/租户隔离 |
| 14 | `Post` | `'comment'` | `async createComment` | 需复核 | 数据权限/租户隔离 |
| 15 | `Delete` | `'comment/:id'` | `async deleteComment` | 需复核 | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/auth/auth.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'login'` | `login` | Public | 数据权限/租户隔离 |
| 2 | `Post` | `'register'` | `register` | Public | 数据权限/租户隔离 |
| 3 | `Post` | `'email/send-code'` | `sendEmailCode` | Public | 通知发送权限 |
| 4 | `Post` | `'email/login'` | `emailLogin` | Public | 通知发送权限 |

## saas-api/apps/admin-api/src/modules/crawler/crawler.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'download'` | `async downloadNovel` | JWT | 文件下载/上传权限 |
| 2 | `Post` | `'download-async'` | `async downloadNovelAsync` | JWT | 文件下载/上传权限 |
| 3 | `Get` | `'progress/:taskId'` | `getProgress` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `'pause/:taskId'` | `pauseTask` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `'resume/:taskId'` | `resumeTask` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `'cancel/:taskId'` | `cancelTask` | JWT | 数据权限/租户隔离 |
| 7 | `Post` | `'clear/:taskId'` | `clearTask` | JWT | 数据权限/租户隔离 |
| 8 | `Post` | `'fanqie'` | `async downloadFanqie` | JWT | 文件下载/上传权限 |
| 9 | `Post` | `'fanqie-async'` | `async downloadFanqieAsync` | JWT | 文件下载/上传权限 |
| 10 | `Get` | `'fanqie-progress/:taskId'` | `getFanqieProgress` | JWT | 数据权限/租户隔离 |
| 11 | `Post` | `'fanqie-pause/:taskId'` | `pauseFanqie` | JWT | 数据权限/租户隔离 |
| 12 | `Post` | `'fanqie-resume/:taskId'` | `resumeFanqie` | JWT | 数据权限/租户隔离 |
| 13 | `Post` | `'fanqie-cancel/:taskId'` | `cancelFanqie` | JWT | 数据权限/租户隔离 |
| 14 | `Post` | `'fanqie-clear/:taskId'` | `clearFanqie` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/customer/customer.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/data-center/data-center.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'stats'` | `stats` | JWT | 平台级数据可见范围 |
| 2 | `Get` | `'heatmap'` | `heatmap` | JWT | 数据权限/租户隔离 |
| 3 | `Get` | `'audit-logs'` | `auditLogs` | JWT | 数据权限/租户隔离 |
| 4 | `Get` | `'audit-log/stats'` | `auditLogStats` | JWT | 平台级数据可见范围 |

## saas-api/apps/admin-api/src/modules/db-ops/db-ops.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'status'` | `async getStatus` | Roles(class) | 平台级数据可见范围 |
| 2 | `Post` | `'migrate'` | `async runMigrate` | Roles(class) | 数据权限/租户隔离 |
| 3 | `Post` | `'seed'` | `async runSeed` | Roles(class) | 数据权限/租户隔离 |
| 4 | `Post` | `'sync-roles'` | `async runSyncRoles` | Roles(class) | 权限配置接口 |
| 5 | `Post` | `'run-all'` | `async runAll` | Roles(class) | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/dept/dept.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'tree'` | `tree` | JWT | 数据权限/租户隔离 |
| 3 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/dict/dict.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'type/list'` | `typeList` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'options'` | `options` | JWT | 数据权限/租户隔离 |
| 3 | `Get` | `'options/:code'` | `optionsByCode` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `'type/create'` | `createType` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `'type/:id'` | `updateType` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `'type/:id/delete'` | `deleteType` | JWT | 数据权限/租户隔离 |
| 7 | `Get` | `'data/list'` | `dataList` | JWT | 数据权限/租户隔离 |
| 8 | `Post` | `'data/create'` | `createData` | JWT | 数据权限/租户隔离 |
| 9 | `Post` | `'data/:id'` | `updateData` | JWT | 数据权限/租户隔离 |
| 10 | `Post` | `'data/:id/delete'` | `deleteData` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/disbursement/disbursement.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `':applicationId/gps-install'` | `completeGpsInstall` | JWT | 资金/业务敏感数据 |
| 7 | `Post` | `':applicationId/mortgage'` | `completeMortgage` | JWT | 资金/业务敏感数据 |
| 8 | `Post` | `':applicationId/request'` | `requestDisbursement` | JWT | 资金/业务敏感数据 |
| 9 | `Post` | `':applicationId/confirm'` | `confirmDisbursement` | JWT | 资金/业务敏感数据 |

## saas-api/apps/admin-api/src/modules/file/file.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'business/list'` | `businessList` | JWT | 数据权限/租户隔离 |
| 3 | `Get` | `'business/categories'` | `businessCategories` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `'upload/image'` | `schema: {` | JWT | 文件下载/上传权限 |
| 5 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `'create'` | `create` | JWT | 数据权限/租户隔离 |
| 7 | `Post` | `'batch-delete'` | `batchRemove` | JWT | 数据权限/租户隔离 |
| 8 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 9 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/flow-config/flow-config.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'meta'` | `meta` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `'init-default'` | `initDefault` | JWT | 数据权限/租户隔离 |
| 4 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 7 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/food/food.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'category/list'` | `async getCategoryList` | 需复核 | 数据权限/租户隔离 |
| 2 | `Post` | `'category'` | `async createCategory` | 需复核 | 数据权限/租户隔离 |
| 3 | `Put` | `'category/:id'` | `async updateCategory` | 需复核 | 数据权限/租户隔离 |
| 4 | `Delete` | `'category/:id'` | `async deleteCategory` | 需复核 | 数据权限/租户隔离 |
| 5 | `Get` | `'dish/list'` | `async getDishList` | 需复核 | 数据权限/租户隔离 |
| 6 | `Get` | `'dish/:id'` | `async getDishById` | 需复核 | 数据权限/租户隔离 |
| 7 | `Post` | `'dish'` | `async createDish` | 需复核 | 数据权限/租户隔离 |
| 8 | `Put` | `'dish/:id'` | `async updateDish` | 需复核 | 数据权限/租户隔离 |
| 9 | `Delete` | `'dish/:id'` | `async deleteDish` | 需复核 | 数据权限/租户隔离 |
| 10 | `Get` | `'order/list'` | `async getOrderList` | 需复核 | 数据权限/租户隔离 |
| 11 | `Put` | `'order/:id/status'` | `async updateOrderStatus` | 需复核 | 平台级数据可见范围 |
| 12 | `Get` | `'m/menu'` | `async getMenuList` | 需复核 | 权限配置接口; 移动端数据隔离 |
| 13 | `Get` | `'m/cart'` | `async getCart` | 需复核 | 移动端数据隔离 |
| 14 | `Post` | `'m/cart'` | `async addToCart` | 需复核 | 移动端数据隔离 |
| 15 | `Put` | `'m/cart/:dishId'` | `async updateCartQuantity` | 需复核 | 移动端数据隔离 |
| 16 | `Delete` | `'m/cart'` | `async clearCart` | 需复核 | 移动端数据隔离 |
| 17 | `Post` | `'m/order'` | `async createOrder` | 需复核 | 移动端数据隔离 |
| 18 | `Get` | `'m/orders'` | `async getMyOrders` | 需复核 | 移动端数据隔离 |

## saas-api/apps/admin-api/src/modules/funder/funder.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/health/health.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `` | `check` | Public(class) | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/lead/lead.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `':id/assign'` | `assign` | JWT | 数据权限/租户隔离 |
| 7 | `Post` | `':id/follow-up'` | `addFollowUp` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/menus/menus.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `` | `findAll` | JWT | 数据权限/租户隔离 |
| 2 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':menuId/permissions'` | `createPermission` | JWT | 权限配置接口 |
| 6 | `Post` | `'permissions/:id'` | `updatePermission` | JWT | 权限配置接口 |
| 7 | `Post` | `'permissions/:id/delete'` | `deletePermission` | JWT | 权限配置接口 |

## saas-api/apps/admin-api/src/modules/mobile-business/modules/bank-card/bank-card.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `getList` | JWT | 数据权限/租户隔离 |
| 2 | `Post` | `'add'` | `add` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `'delete/:id'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/mobile-business/modules/contact/contact.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'addOrUpdateContact'` | `addOrUpdateContact` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'getContacts'` | `getContacts` | JWT | 数据权限/租户隔离 |
| 3 | `Delete` | `'deleteContact/:id'` | `deleteContact` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/mobile-business/modules/credit/credit.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'apply'` | `apply` | JWT | 数据权限/租户隔离 |
| 2 | `Post` | `'update'` | `update` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `'updateSupplementStatus'` | `updateSupplementStatus` | JWT | 平台级数据可见范围 |
| 4 | `Get` | `'getCreditList'` | `getCreditList` | JWT | 资金/业务敏感数据 |
| 5 | `Get` | `'getCreditDetail/:id'` | `getCreditDetail` | JWT | 资金/业务敏感数据 |
| 6 | `Get` | `'getCreditDetailByOrderId/:creditOrderId'` | `getCreditDetailByOrderId` | JWT | 资金/业务敏感数据 |
| 7 | `Get` | `'loanBusinessNodes'` | `getLoanBusinessNodes` | JWT | 数据权限/租户隔离 |
| 8 | `Get` | `'flow-steps/:nodeCode'` | `getFlowSteps` | JWT | 数据权限/租户隔离 |
| 9 | `Get` | `'flow-config/:nodeCode'` | `getFlowConfig` | JWT | 数据权限/租户隔离 |
| 10 | `Get` | `'flow-nodes'` | `getFlowNodes` | JWT | 数据权限/租户隔离 |
| 11 | `Get` | `'overview'` | `overview` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/mobile-business/modules/file/file.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'upload'` | `schema: {` | JWT | 文件下载/上传权限 |
| 2 | `Post` | `'uploadWithType'` | `uploadWithType` | JWT | 文件下载/上传权限 |
| 3 | `Get` | `'getFileList'` | `getFileList` | JWT | 文件下载/上传权限 |
| 4 | `Get` | `'getFileListByType'` | `getFileListByType` | JWT | 文件下载/上传权限 |
| 5 | `Delete` | `'deleteFile/:id'` | `deleteFile` | JWT | 文件下载/上传权限 |
| 6 | `Get` | `'getProductFileList'` | `getProductFileList` | JWT | 文件下载/上传权限 |

## saas-api/apps/admin-api/src/modules/mobile-business/modules/lead/lead.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'add'` | `add` | JWT | 数据权限/租户隔离 |
| 2 | `Post` | `'add'` | `add` | JWT | 数据权限/租户隔离 |
| 3 | `Get` | `'list/:uuid'` | `list` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/mobile-business/modules/post-loan/post-loan.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'confirm-amount'` | `confirmAmount` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'repayment-plans/:applicationId'` | `getRepaymentPlans` | JWT | 资金/业务敏感数据 |
| 3 | `Post` | `'early-repayment'` | `applyEarlyRepayment` | JWT | 资金/业务敏感数据 |
| 4 | `Get` | `'detail/:id'` | `getDetail` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `'register-repayment'` | `registerRepayment` | JWT | 资金/业务敏感数据 |

## saas-api/apps/admin-api/src/modules/mobile-business/modules/signing/signing.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'face/start'` | `startFaceSign` | JWT | 数据权限/租户隔离 |
| 2 | `Post` | `'contract/start'` | `startAuthContractSign` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `'loan/start'` | `startContractSign` | JWT | 数据权限/租户隔离 |
| 4 | `Get` | `'face/detail/:creditOrderId'` | `getFaceSignDetail` | JWT | 资金/业务敏感数据 |
| 5 | `Get` | `'contract/detail/:creditOrderId'` | `getAuthContractDetail` | JWT | 资金/业务敏感数据 |
| 6 | `Get` | `'loan/detail/:creditOrderId'` | `getContractDetail` | JWT | 资金/业务敏感数据 |

## saas-api/apps/admin-api/src/modules/mobile-business/modules/user/user.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'addOrUpdateUserBasic'` | `addOrUpdateUserBasic` | JWT | 权限配置接口 |
| 2 | `Post` | `'addOrUpdateIdCardInfo'` | `addOrUpdateIdCardInfo` | JWT | 数据权限/租户隔离 |
| 3 | `Get` | `'getUserBasic'` | `getUserBasic` | JWT | 权限配置接口 |
| 4 | `Post` | `'getIdCardInfo'` | `getIdCardInfo` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `'getIdCardOcr'` | `schema: {` | JWT | 数据权限/租户隔离 |
| 6 | `Get` | `'getUserList'` | `getUserList` | JWT | 权限配置接口 |

## saas-api/apps/admin-api/src/modules/mobile-business/modules/vehicle/vehicle.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'addOrUpdateVehicle'` | `addOrUpdateVehicle` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'getVehicleInfo'` | `getVehicleInfo` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `'getVehicleOcr'` | `schema: {` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/mobile-config/mobile-config.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'resolved'` | `getResolvedConfig` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `` | `getConfig` | JWT | 数据权限/租户隔离 |
| 3 | `Put` | `` | `updateConfig` | JWT | 数据权限/租户隔离 |
| 4 | `Get` | `'role/:roleId'` | `getRoleConfig` | JWT | 权限配置接口 |
| 5 | `Put` | `'role/:roleId'` | `updateRoleConfig` | JWT | 权限配置接口 |
| 6 | `Put` | `'role/:roleId/reset'` | `resetRoleConfig` | JWT | 权限配置接口 |
| 7 | `Get` | `'user/:userId'` | `getUserConfig` | JWT | 权限配置接口 |
| 8 | `Put` | `'user/:userId'` | `updateUserConfig` | JWT | 权限配置接口 |
| 9 | `Put` | `'user/:userId/reset'` | `resetUserConfig` | JWT | 权限配置接口 |

## saas-api/apps/admin-api/src/modules/monitor/monitor.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'logs'` | `logs` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'logs/:id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Get` | `'stats'` | `stats` | JWT | 平台级数据可见范围 |

## saas-api/apps/admin-api/src/modules/msg-template/msg-template.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/enable'` | `enable` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `':id/disable'` | `disable` | JWT | 数据权限/租户隔离 |
| 7 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/notification/notification.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'stats'` | `getStats` | JWT | 平台级数据可见范围 |
| 2 | `Get` | `'list'` | `getList` | JWT | 数据权限/租户隔离 |
| 3 | `Get` | `'unread-count'` | `getUnreadCount` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id/read'` | `markAsRead` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `'read-all'` | `markAllAsRead` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/ocr/ocr.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'health'` | `health` | JWT | 数据权限/租户隔离 |
| 2 | `Post` | `'upload'` | `upload` | JWT | 文件下载/上传权限 |
| 3 | `Post` | `'by-object-key'` | `byObjectKey` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `'vehicle'` | `vehicle` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `'id-card'` | `schema: {` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/org/org.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `':id/enable'` | `enable` | JWT | 数据权限/租户隔离 |
| 7 | `Post` | `':id/disable'` | `disable` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/package-plan/package-plan.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/platform-supervision/platform-supervision.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'stats'` | `stats` | JWT | 平台级数据可见范围 |
| 2 | `Get` | `'overview'` | `overview` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/product-template/product-template.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/product/product.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/queue/queue.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Post` | `'health-check'` | `async enqueueHealthCheck` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/reading/reading.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'categories'` | `async getCategories` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'categories/:id'` | `async getCategoryById` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `'categories'` | `async createCategory` | JWT | 数据权限/租户隔离 |
| 4 | `Put` | `'categories/:id'` | `async updateCategory` | JWT | 数据权限/租户隔离 |
| 5 | `Delete` | `'categories/:id'` | `async deleteCategory` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `'categories/batch-status'` | `async batchUpdateCategoryStatus` | JWT | 平台级数据可见范围 |
| 7 | `Get` | `'books'` | `async getBooks` | JWT | 数据权限/租户隔离 |
| 8 | `Get` | `'books/:id'` | `async getBookById` | JWT | 数据权限/租户隔离 |
| 9 | `Post` | `'books'` | `async createBook` | JWT | 数据权限/租户隔离 |
| 10 | `Post` | `'books/upload-txt'` | `FileInterceptor` | JWT | 文件下载/上传权限 |
| 11 | `Put` | `'books/:id'` | `async updateBook` | JWT | 数据权限/租户隔离 |
| 12 | `Delete` | `'books/:id'` | `async deleteBook` | JWT | 数据权限/租户隔离 |
| 13 | `Get` | `'chapters'` | `async getChapters` | JWT | 数据权限/租户隔离 |
| 14 | `Get` | `'chapters/lite'` | `async getChaptersLite` | JWT | 数据权限/租户隔离 |
| 15 | `Get` | `'chapters/:id'` | `async getChapterById` | JWT | 数据权限/租户隔离 |
| 16 | `Post` | `'chapters'` | `async createChapter` | JWT | 数据权限/租户隔离 |
| 17 | `Put` | `'chapters/:id'` | `async updateChapter` | JWT | 数据权限/租户隔离 |
| 18 | `Delete` | `'chapters/:id'` | `async deleteChapter` | JWT | 数据权限/租户隔离 |
| 19 | `Get` | `'bookshelf'` | `async getBookshelf` | JWT | 数据权限/租户隔离 |
| 20 | `Post` | `'bookshelf'` | `async addToBookshelf` | JWT | 数据权限/租户隔离 |
| 21 | `Delete` | `'bookshelf/:bookId'` | `async removeFromBookshelf` | JWT | 数据权限/租户隔离 |
| 22 | `Get` | `'progress/:bookId'` | `async getReadingProgress` | JWT | 数据权限/租户隔离 |
| 23 | `Post` | `'progress'` | `async saveReadingProgress` | JWT | 数据权限/租户隔离 |
| 24 | `Get` | `'reviews'` | `async getReviews` | JWT | 数据权限/租户隔离 |
| 25 | `Post` | `'reviews'` | `async createReview` | JWT | 数据权限/租户隔离 |
| 26 | `Put` | `'reviews/status'` | `async updateReviewStatus` | JWT | 平台级数据可见范围 |
| 27 | `Delete` | `'reviews/:id'` | `async deleteReview` | JWT | 数据权限/租户隔离 |
| 28 | `Get` | `'statistics'` | `async getStatistics` | JWT | 平台级数据可见范围 |
| 29 | `Get` | `'hot'` | `async getHotBooks` | JWT | 数据权限/租户隔离 |
| 30 | `Get` | `'recommend'` | `async getRecommendBooks` | JWT | 数据权限/租户隔离 |
| 31 | `Get` | `'notes'` | `async getNotes` | JWT | 数据权限/租户隔离 |
| 32 | `Get` | `'notes/chapter/:bookId/:chapterId'` | `async getNotesByChapter` | JWT | 数据权限/租户隔离 |
| 33 | `Post` | `'notes'` | `async createNote` | JWT | 数据权限/租户隔离 |
| 34 | `Put` | `'notes/:id'` | `async updateNote` | JWT | 数据权限/租户隔离 |
| 35 | `Delete` | `'notes/:id'` | `async deleteNote` | JWT | 数据权限/租户隔离 |
| 36 | `Post` | `'reviews/:id/like'` | `async likeReview` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/repayment/repayment.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |
| 6 | `Get` | `'plans/:applicationId'` | `getRepaymentPlans` | JWT | 资金/业务敏感数据 |
| 7 | `Post` | `'register/:applicationId'` | `registerRepaymentByApplication` | JWT | 资金/业务敏感数据 |
| 8 | `Post` | `'register-plan/:planId'` | `registerRepayment` | JWT | 资金/业务敏感数据 |
| 9 | `Get` | `'overdue/list'` | `getOverduePlans` | JWT | 数据权限/租户隔离 |
| 10 | `Post` | `'collection/:applicationId'` | `addCollectionRecord` | JWT | 资金/业务敏感数据 |
| 11 | `Get` | `'collection/:applicationId'` | `getCollectionRecords` | JWT | 资金/业务敏感数据 |
| 12 | `Post` | `'early-repayment/apply/:applicationId'` | `applyEarlyRepayment` | JWT | 资金/业务敏感数据 |
| 13 | `Post` | `'early-repayment/:id/approve'` | `approveEarlyRepayment` | JWT | 资金/业务敏感数据 |
| 14 | `Post` | `'early-repayment/:id/complete'` | `completeEarlyRepayment` | JWT | 资金/业务敏感数据 |
| 15 | `Get` | `'early-repayment/list/:applicationId'` | `getEarlyRepayments` | JWT | 资金/业务敏感数据 |

## saas-api/apps/admin-api/src/modules/roles/roles.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Post` | `'create'` | `create` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |
| 5 | `Get` | `':id/permissions'` | `getPermissions` | JWT | 权限配置接口 |
| 6 | `Post` | `':id/permissions'` | `savePermissions` | JWT | 权限配置接口 |
| 7 | `Get` | `':id/data-scope'` | `getDataScope` | JWT | 数据权限/租户隔离 |
| 8 | `Post` | `':id/data-scope'` | `saveDataScope` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/signing/signing.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |
| 6 | `Post` | `':id/authorize-sign'` | `authorizeSign` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/system-param/system-param.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Post` | `'create'` | `create` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id/delete'` | `delete` | JWT | 数据权限/租户隔离 |
| 5 | `Get` | `'by-keys'` | `getByKeys` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/third-party-service/third-party-service.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/users/users.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'info'` | `info` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `'create'` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |

## saas-api/apps/admin-api/src/modules/work-order/work-order.controller.ts

| # | Method | Path | Handler | 鉴权初筛 | 复核重点 |
| --- | --- | --- | --- | --- | --- |
| 1 | `Get` | `'list'` | `list` | JWT | 数据权限/租户隔离 |
| 2 | `Get` | `':id'` | `detail` | JWT | 数据权限/租户隔离 |
| 3 | `Post` | `` | `create` | JWT | 数据权限/租户隔离 |
| 4 | `Post` | `':id'` | `update` | JWT | 数据权限/租户隔离 |
| 5 | `Post` | `':id/delete'` | `remove` | JWT | 数据权限/租户隔离 |
