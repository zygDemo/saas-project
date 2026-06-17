# saas-api 后端模块说明与接口映射

## 1. 项目概览

`saas-api` 是一个基于 `pnpm workspace` 的 NestJS Monorepo。

当前真正承载业务接口的应用主要是：

- `apps/admin-api`：后台管理接口 + 业务接口 + 移动端接口
- `packages/shared`：预留共享包，当前内容较少

根目录脚本基本都指向 `@saas/admin-api`，见 [package.json](../package.json)。

## 2. 目录结构

```text
saas-api/
  apps/
    admin-api/
      env/                    # 环境变量
      prisma/                 # Prisma schema / migration / seed
      src/
        common/               # 中间件、拦截器、工具、类型
        modules/              # 所有业务模块
        main.ts               # 启动入口
        app.module.ts         # 模块装配入口
    new-api/                  # 当前更偏部署/运行目录，不是完整源码服务
  packages/
    shared/
```

## 3. 启动与运行

常用命令：

```bash
cd saas-api
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

默认约定：

- 服务端口：`3001`
- API 前缀：`/saas/api`
- Swagger：`http://localhost:3001/saas/api/docs`

环境变量示例见 [apps/admin-api/env/.env.example](../apps/admin-api/env/.env.example)。

## 4. 核心技术与基础机制

### 4.1 技术栈

- NestJS 10
- Prisma
- PostgreSQL
- Redis
- BullMQ
- JWT
- Swagger

### 4.2 多租户机制

项目是租户隔离模式，核心中间件是
[apps/admin-api/src/common/tenant/tenant.middleware.ts](../apps/admin-api/src/common/tenant/tenant.middleware.ts)。

行为规则：

- 读取请求头 `X-Tenant-ID`
- 读取 JWT 中的 `tenantId`
- 两者不一致时直接返回 `403`
- 登录前通常也需要带 `X-Tenant-ID`

登录逻辑见
[apps/admin-api/src/modules/auth/auth.controller.ts](../apps/admin-api/src/modules/auth/auth.controller.ts) 和
[apps/admin-api/src/modules/auth/auth.service.ts](../apps/admin-api/src/modules/auth/auth.service.ts)。

## 5. 模块分层

### 5.1 平台基础模块

- `auth`：登录、JWT
- `users`：用户管理、当前用户信息
- `roles`：角色管理、角色菜单和按钮权限绑定
- `menus`：菜单树和菜单权限
- `dict`：字典管理
- `file`：后台文件管理
- `ocr`：OCR 能力封装
- `redis`：Redis 客户端
- `queue`：BullMQ 队列
- `health`：健康检查

### 5.2 车贷业务后台模块

- `org`：机构管理
- `dept`：部门管理
- `product`：产品配置
- `funder`：资方配置
- `flow-config`：流程与规则
- `lead`：线索管理
- `customer`：客户管理
- `application`：订单主流程
- `approval`：审批记录
- `signing`：签约记录
- `disbursement`：放款记录
- `repayment`：还款计划与还款记录
- `data-center`：数据中心

### 5.3 移动端模块

- `mobile-business`：移动端客户录入、车辆录入、授信申请、OCR、文件、统计、流程配置读取

## 6. 数据表主关系

核心表定义见
[apps/admin-api/prisma/schema.prisma](../apps/admin-api/prisma/schema.prisma)。

### 6.1 平台权限相关

- `Tenant`：租户
- `User`：用户
- `Role`：角色
- `UserRole`：用户角色关联
- `Menu`：菜单
- `RoleMenu`：角色菜单关联
- `Permission`：按钮权限
- `RolePermission`：角色权限关联

### 6.2 组织与配置

- `Organization`：机构
- `Department`：部门
- `Product`：产品
- `Funder`：资方
- `FlowConfig`：流程规则

### 6.3 业务主链路

- `Lead`：线索
- `LeadFollowUp`：线索跟进
- `Customer`：客户
- `CustomerContact`：客户联系人
- `Vehicle`：车辆
- `BankCard`：银行卡
- `Application`：订单 / 申请主表
- `ApplicationFile`：订单材料
- `ApprovalRecord`：审批记录
- `SignRecord`：签约记录
- `Disbursement`：放款记录
- `RepaymentPlan`：还款计划
- `RepaymentRecord`：还款登记
- `OperationLog`：操作日志 / 审计日志
- `FileAsset`：统一文件资产表

### 6.4 业务主链路关系图

```text
Tenant
  ├─ User ── UserRole ── Role ── RoleMenu ── Menu
  │                          └─ RolePermission ── Permission
  ├─ Organization ── Department
  │              ├─ Product
  │              ├─ Funder
  │              ├─ FlowConfig
  │              ├─ Lead ── LeadFollowUp
  │              ├─ Customer ── Vehicle / BankCard / CustomerContact
  │              └─ Application ── ApplicationFile / ApprovalRecord / SignRecord / Disbursement / RepaymentPlan
  └─ OperationLog / FileAsset / DictType / DictData
```

## 7. 关键模块与接口映射

### 7.1 登录与当前用户

#### 登录

- 控制器：`POST /auth/login`
- 文件：
  - [auth.controller.ts](../apps/admin-api/src/modules/auth/auth.controller.ts)
  - [auth.service.ts](../apps/admin-api/src/modules/auth/auth.service.ts)
- 主要表：
  - `User`
  - `UserRole`
  - `Role`

说明：

- 登录必须能解析到租户
- 用户名按当前租户下查询
- 返回 `token` 和 `refreshToken`

#### 当前用户信息

- 控制器：`GET /user/info`
- 文件：
  - [users.controller.ts](../apps/admin-api/src/modules/users/users.controller.ts)
  - [users.service.ts](../apps/admin-api/src/modules/users/users.service.ts)
- 主要表：
  - `User`
  - `UserRole`
  - `Role`
  - `RolePermission`
  - `Permission`

返回重点：

- `roles`
- `buttons`
- `userName`
- `email`
- `avatar`

这个接口决定了前端当前用户的角色和按钮权限。

### 7.2 用户、角色、菜单

#### 用户管理

- 控制器前缀：`/user`
- 文件：
  - [users.controller.ts](../apps/admin-api/src/modules/users/users.controller.ts)
  - [users.service.ts](../apps/admin-api/src/modules/users/users.service.ts)
- 主要表：
  - `User`
  - `Department`
  - `Organization`
  - `UserRole`
  - `Role`

常用接口：

- `GET /user/list`
- `POST /user/create`
- `POST /user/:id`
- `POST /user/:id/delete`

#### 角色管理

- 控制器前缀：`/role`
- 文件：
  - [roles.controller.ts](../apps/admin-api/src/modules/roles/roles.controller.ts)
  - [roles.service.ts](../apps/admin-api/src/modules/roles/roles.service.ts)
- 主要表：
  - `Role`
  - `RoleMenu`
  - `RolePermission`
  - `Menu`
  - `Permission`

常用接口：

- `GET /role/list`
- `POST /role/create`
- `POST /role/:id`
- `POST /role/:id/delete`
- `GET /role/:id/permissions`
- `POST /role/:id/permissions`

#### 菜单管理与菜单树

- 控制器前缀：`/v3/system/menus`
- 文件：
  - [menus.controller.ts](../apps/admin-api/src/modules/menus/menus.controller.ts)
  - [menus.service.ts](../apps/admin-api/src/modules/menus/menus.service.ts)
- 主要表：
  - `Menu`
  - `RoleMenu`
  - `Permission`
  - `RolePermission`

常用接口：

- `GET /v3/system/menus`
- `POST /v3/system/menus`
- `POST /v3/system/menus/:id`
- `POST /v3/system/menus/:id/delete`
- `POST /v3/system/menus/:menuId/permissions`

说明：

- `GET /v3/system/menus` 返回前端路由树
- 超级管理员返回全部菜单
- 普通角色按 `RoleMenu` 和 `RolePermission` 裁剪
- 前端侧边栏、标签页、按钮权限都依赖它

## 8. 菜单与后端模块对应关系

菜单初始化主要在
[apps/admin-api/prisma/seed.ts](../apps/admin-api/prisma/seed.ts)。

### 8.1 平台和系统管理

| 前端菜单 | 菜单标识 | 主要接口 | 主要数据表 |
| --- | --- | --- | --- |
| 用户管理 | `User` | `/user/*` | `User` `UserRole` `Department` |
| 角色管理 | `Role` | `/role/*` | `Role` `RoleMenu` `RolePermission` |
| 菜单管理 | `Menus` | `/v3/system/menus/*` | `Menu` `Permission` |
| 文件管理 | `FileManage` | `/file/*` | `FileAsset` / `ApplicationFile` |
| 流程与规则 | `FlowConfig` | `/flow-config/*` | `FlowConfig` `Organization` |
| 机构管理 | `Org` | `/org/*` | `Organization` |
| 部门管理 | `Dept` | `/dept/*` | `Department` |
| 产品配置 | `Product` | `/product/*` | `Product` |
| 资方配置 | `Funder` | `/funder/*` | `Funder` |

### 8.2 业务管理菜单

业务管理下很多页面并不是一个页面一个模块，而是多个菜单共用 `application` 模块，根据 `status`、`currentNode`、`currentStatus` 来区分。

| 前端菜单 | 菜单标识 | 主要接口 | 主要数据表 |
| --- | --- | --- | --- |
| 线索管理 | `Lead` | `/lead/*` | `Lead` `LeadFollowUp` |
| 预审阶段 | `PreReview` | `/application/flow-list` `/application/order-list` | `Application` `Customer` `Product` `Funder` |
| 补件阶段 | `Supplement` | `/application/flow-list` `/application/:id/complete-supplement` `/application/:id/supplement` | `Application` `ApplicationFile` |
| 风控审批 | `Approval` | `/application/flow-list` `/application/:id/approve` `/application/:id/reject` | `Application` `ApprovalRecord` |
| 资方终审 | `FunderReview` | `/application/flow-list` `/application/:id/funder-pass` `/application/:id/funder-reject` | `Application` `ApprovalRecord` |
| 客户签约 | `Signing` | `/application/flow-list` `/application/:id/start-signing` `/application/:id/complete-signing` | `Application` `SignRecord` |
| 请款放款 | `Disbursement` | `/application/flow-list` `/application/:id/request-disbursement` `/application/:id/confirm-disbursement` | `Application` `Disbursement` |
| 综合查询 | `BusinessOrderQuery` 或 `OrderQuery` | `/application/order-list` `/application/:id` | `Application` `Customer` `Vehicle` |
| 贷后阶段 | `PostLoan` / `Repayment` | `/application/order-list` `/application/repayment-plan/:planId/register` `/application/:id/settle` | `RepaymentPlan` `RepaymentRecord` `Application` |
| 报表统计 | `Reports` | 当前更多依赖 `/data-center/*`，也可能叠加订单查询 | `Application` `Disbursement` `RepaymentPlan` |

重点说明：

- 业务菜单的“分栏”本质上是订单状态切片
- 最核心的后台业务模块其实是 `application`
- `lead` 是线索入口
- `flow-config` 定义流程节点
- `file` / `ApplicationFile` / `FileAsset` 负责材料

### 8.3 关于综合查询

综合查询不是一个单独的数据域，更多是订单综合检索页，通常对应：

- `GET /application/order-list`
- `GET /application/:id`

涉及表：

- `Application`
- `Customer`
- `Vehicle`
- `Product`
- `Funder`

### 8.4 关于流程与规则

流程与规则菜单直接对应 `flow-config` 模块。

- 控制器：
  [flow-config.controller.ts](../apps/admin-api/src/modules/flow-config/flow-config.controller.ts)
- 服务：
  [flow-config.service.ts](../apps/admin-api/src/modules/flow-config/flow-config.service.ts)

关键接口：

- `GET /flow-config/list`
- `GET /flow-config/meta`
- `POST /flow-config/init-default`
- `GET /flow-config/:id`
- `POST /flow-config/:id`

主要表：

- `FlowConfig`
- `Organization`

它不是纯前端配置页，是真正驱动订单节点流转的规则表。

## 9. 数据中心对应关系

数据中心模块文件：

- [data-center.controller.ts](../apps/admin-api/src/modules/data-center/data-center.controller.ts)
- [data-center.service.ts](../apps/admin-api/src/modules/data-center/data-center.service.ts)

### 9.1 数据统计

- 接口：`GET /data-center/stats`
- 主要表：
  - `Application`
  - `Customer`
  - `Lead`
  - `Product`
  - `Funder`
  - `Disbursement`
  - `RepaymentPlan`

统计内容：

- 订单总量
- 客户总量
- 线索总量
- 在售产品 / 资方数量
- 放款笔数
- 拒绝笔数
- 申请金额 / 审批金额 / 放款金额
- 待还金额
- 阶段分布
- 状态分布
- 产品分布
- 资方分布
- 按天趋势

### 9.2 日志审计

- 接口：`GET /data-center/audit-logs`
- 主要表：
  - `OperationLog`

功能：

- 按模块、动作、用户名、关键字、时间区间筛选
- 返回审计日志分页列表

如果前端“数据中心页面显示不对”，优先排查：

1. `/data-center/stats` 返回结构是否匹配前端
2. 数据库中 `Application` / `Disbursement` / `RepaymentPlan` 是否有数据
3. 前端是否把阶段名称、状态映射写死了

## 10. 移动端对应关系

移动端主控制器文件：

- [mobile-business.controller.ts](../apps/admin-api/src/modules/mobile-business/mobile-business.controller.ts)
- [mobile-business.service.ts](../apps/admin-api/src/modules/mobile-business/mobile-business.service.ts)

移动端接口不是独立服务，而是直接挂在 `admin-api` 上。

### 10.1 文件上传与文件列表

接口前缀：`/m/file`

常用接口：

- `POST /m/file/upload`
- `POST /m/file/uploadWithType`
- `GET /m/file/getFileList`
- `GET /m/file/getFileListByType`
- `DELETE /m/file/deleteFile/:id`
- `GET /m/file/getProductFileList`

主要表：

- `FileAsset`
- 回退场景下可能读 `ApplicationFile`

说明：

- 移动端优先使用统一文件资产表 `FileAsset`
- 如果表不存在，某些逻辑会降级

### 10.2 客户基础信息

接口前缀：`/m/user`

常用接口：

- `POST /m/user/addOrUpdateUserBasic`
- `POST /m/user/addOrUpdateIdCardInfo`
- `GET /m/user/getUserBasic`
- `POST /m/user/getIdCardOcr`
- `GET /m/user/getUserList`

主要表：

- `Customer`
- `FileAsset`
- `Application`（勾选创建草稿单时）

说明：

- 客户录入可以顺手自动创建草稿订单
- 身份证图片会绑定到客户文件资产

### 10.3 车辆信息

接口前缀：`/m/vehicle`

常用接口：

- `POST /m/vehicle/addOrUpdateVehicle`
- `GET /m/vehicle/getVehicleInfo`
- `POST /m/vehicle/getVehicleOcr`

主要表：

- `Vehicle`
- `FileAsset`
- `Application`

说明：

- 上传车辆资料后，会尝试推动草稿单节点同步

### 10.4 授信申请

接口前缀：`/m/credit`

常用接口：

- `POST /m/credit/apply`
- `POST /m/credit/update`
- `GET /m/credit/getCreditList`
- `GET /m/credit/getCreditDetail/:id`
- `GET /m/credit/getCreditDetailByOrderId/:creditOrderId`

主要表：

- `Application`
- `Customer`
- `Product`
- `Funder`
- `ApplicationFile`

说明：

- 这是移动端最核心的一组接口
- 最终落点仍然是 `Application`

### 10.5 流程配置与业务节点枚举

接口前缀：`/m/enum`

常用接口：

- `GET /m/enum/loanBusinessNodes`
- `GET /m/enum/flow-steps/:nodeCode`
- `GET /m/enum/flow-config/:nodeCode`

主要表：

- `FlowConfig`

说明：

- 移动端的流程展示依赖这里
- 如果移动端流程节点不对，通常先看 `FlowConfig`

### 10.6 移动端统计

接口前缀：`/m/statistics`

常用接口：

- `GET /m/statistics/overview`

当前状态：

- 这里目前更像占位接口
- 返回值比较简单，真实统计能力还不强

## 11. 文件体系说明

项目当前实际上存在两套文件存储读取逻辑：

### 11.1 新逻辑：`FileAsset`

主要模块：

- 后台 `file`
- 移动端 `mobile-business`

优点：

- 支持统一业务类型绑定
- 可按 `businessType + businessId + categoryCode` 管理

### 11.2 旧逻辑：`ApplicationFile`

主要用于：

- 老订单材料
- `file` 模块中的兼容回退

结论：

- 新增能力尽量走 `FileAsset`
- 如果页面里文件显示不出来，要先确认当前读的是 `FileAsset` 还是 `ApplicationFile`

## 12. 菜单、数据中心、移动端排查建议

### 12.1 菜单不对

优先检查：

1. `prisma/seed.ts` 是否写入了目标菜单
2. `RoleMenu` 是否给当前角色绑定了菜单
3. `GET /v3/system/menus` 返回里是否有对应节点
4. 前端路由组件路径是否和菜单 `component` 一致

### 12.2 数据中心页面不对

优先检查：

1. `GET /data-center/stats`
2. `GET /data-center/audit-logs`
3. `Application` / `Disbursement` / `RepaymentPlan` 是否有测试数据
4. 前端图表字段名是否和后端返回一致

### 12.3 移动端流程不对

优先检查：

1. `FlowConfig` 是否初始化
2. `Application.status` / `currentNode` / `currentStatus`
3. `GET /m/enum/flow-config/:nodeCode`
4. `GET /m/enum/flow-steps/:nodeCode`

## 13. 当前项目的几个关键判断

1. `application` 是后台业务主中心，很多菜单只是它的不同筛选视图。
2. `flow-config` 决定流程与规则，不只是“配置展示页”。
3. `mobile-business` 本质上是在往 `Customer`、`Vehicle`、`Application` 三张主表写数据。
4. 菜单问题通常不是前端单点问题，而是 `Menu + RoleMenu + 用户角色` 三段一起看。
5. 数据中心问题通常不是一个单接口，而是统计 SQL、状态映射、测试数据三者叠加。

