# 项目架构文档

> 本文档整合后端模块说明、部署架构和业务流程设计。
> 最后更新：2026-07-24

---

## 1. 项目总览

```
saas-project/
├── saas-api/                 # NestJS 后端
│   ├── apps/admin-api/       # 后台管理 + 业务 API
│   ├── apps/new-api/         # 新 API 服务
│   └── packages/shared/      # 共享类型/工具
├── saas-web/                 # Vue 3 后台管理系统
├── saas-mobile/              # uni-app 移动端（予艺助手）
├── docs/                     # 项目文档
│   ├── ARCHITECTURE.md       # 本文件：架构总览
│   ├── BUSINESS_PROCESS.md   # 业务流程与状态机
│   ├── car-loan-flow-design.md # 车抵贷详细设计
│   └── saas-web-menu-structure.md # 菜单结构
└── .github/workflows/        # CI/CD
```

---

## 2. 技术栈

### 2.1 后端 (saas-api)

| 技术 | 用途 |
|------|------|
| NestJS 10 | 框架主体 |
| Prisma 6.2 | ORM (59 模型) |
| PostgreSQL 16 | 主数据库 |
| Redis 7 | 缓存/会话 |
| BullMQ | 任务队列 |
| 原生 WebSocket (`ws`) | WebSocket 实时推送 |
| Passport + JWT | 认证 |
| Helmet + Throttler | 安全/限流 |
| Swagger 8 | API 文档 |

### 2.2 前端 (saas-web)

| 技术 | 用途 |
|------|------|
| Vue 3.5 + Vite | 框架/构建 |
| Element Plus | UI 组件 |
| Tailwind CSS 4 | 工具类样式 |
| Pinia | 状态管理 |
| Vue Router | 路由 |
| 原生 WebSocket Client | WebSocket |
| Vue I18n | 国际化 |

### 2.3 移动端 (saas-mobile)

| 技术 | 用途 |
|------|------|
| uni-app 3.0 | 跨平台框架 |
| Vue 3.4 | 框架 |
| Pinia | 状态管理 |
| uView Pro | UI 组件 |
| 原生 WebSocket Client | WebSocket |

---

## 3. 后端模块说明

### 3.1 核心业务模块

| 模块 | 职责 | 关键模型 |
|------|------|----------|
| application | 车抵贷申请管理 | Application, ApprovalRecord, SignRecord, Disbursement |
| customer | 客户管理 | Customer, CustomerContact |
| approval | 审批流程 | ApprovalRecord |
| signing | 签约管理 | SignRecord |
| disbursement | 放款管理 | Disbursement |
| repayment | 还款管理 | RepaymentPlan, RepaymentRecord |
| product | 产品管理 | Product |
| funder | 资方管理 | Funder |
| lead | 线索管理 | Lead, LeadFollowUp |
| flow-config | 流程配置 | FlowConfig |

### 3.2 系统管理模块

| 模块 | 职责 |
|------|------|
| auth | JWT 认证、邮箱验证码 |
| users | 用户管理 |
| roles | 角色权限 |
| menus | 动态菜单树 |
| dept | 部门管理 |
| org | 组织架构 |
| dict | 字典管理 |
| system-param | 系统参数 |
| file | 文件上传管理 |

### 3.3 辅助功能模块

| 模块 | 职责 |
|------|------|
| notification | WebSocket 实时推送 |
| announcement | 通知公告 |
| article | 文章/评论系统 |
| work-order | 运营工单 |
| food | 小程序点餐 |
| reading | 读书模块 |
| crawler | 爬虫服务 |
| ocr | OCR 识别 |
| email | 邮件服务 |
| monitor | 系统监控 |
| msg-template | 消息模板 |
| package-plan | 套餐方案 |
| product-template | 产品模板 |
| third-party-service | 第三方服务 |
| platform-supervision | 平台监管 |
| mobile-business | 移动端业务接口 |
| mobile-config | 移动端配置 |

### 3.4 基础设施模块

| 模块 | 职责 |
|------|------|
| prisma | 租户注入、软删除、生命周期 |
| redis | 缓存服务 (get/set/del/getOrSet) |
| queue | BullMQ 任务队列 |
| db-ops | 数据库运维 (migration/seed/sync) |

---

## 4. 数据模型

### 4.1 租户隔离

所有业务表通过 `tenantId` 实现多租户隔离，PrismaService 使用 Proxy 模式自动注入。

### 4.2 软删除

软删除模型通过 `deletedAt` 字段标记删除，查询自动过滤已删除记录。

### 4.3 核心关系

```
Organization (机构)
  ├── Department (部门)
  ├── Product (产品)
  ├── Funder (资方)
  ├── Customer (客户)
  └── Application (申请)

User (用户)
  ├── UserRole (用户角色)
  ├── Role (角色)
  │     ├── RoleMenu (角色菜单)
  │     └── RolePermission (角色权限)
  └── Department (所属部门)

Application (申请)
  ├── Customer (客户)
  ├── Vehicle (车辆)
  ├── ApprovalRecord (审批记录)
  ├── SignRecord (签约记录)
  ├── Disbursement (放款记录)
  ├── RepaymentPlan (还款计划)
  └── ApplicationFile (申请文件)
```

---

## 5. 部署架构

### 5.1 生产环境

```
┌─────────────────────────────────────────┐
│           Nginx (80/443)                │
│  / -> 现有 H5                           │
│  /saas -> SaaS web (8080)               │
│  /saas/api/* -> SaaS API (3001)         │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│ saas-web      │       │ saas-api      │
│ (Vue 3)       │       │ (NestJS)      │
│ :8080         │       │ :3001         │
└───────────────┘       └───────┬───────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌─────────┐ ┌─────────┐ ┌─────────┐
              │ Postgres│ │  Redis  │ │ BullMQ  │
              │ :5432   │ │ :16379  │ │ (async) │
              └─────────┘ └─────────┘ └─────────┘
```

### 5.2 Docker 编排

生产环境使用 Docker Compose 编排：
- `postgres` - PostgreSQL 16 主库
- `redis` - Redis 7 缓存
- `api` - NestJS API 服务
- `web` - Vue 3 前端服务

环境配置通过 `env/.env.production` 文件挂载。

---

## 6. 业务流程

### 6.1 车抵贷主流程

```
线索 → 客户 → 车辆 → 征信 → 申请 → 审批 → 签约 → 放款 → 还款
```

详细状态机与接口文档见 [BUSINESS_PROCESS.md](./BUSINESS_PROCESS.md)。

### 6.2 实时通知流程

```
业务触发 → NotificationService → WebSocket Gateway → 在线用户实时推送
```

---

## 7. 安全设计

| 层级 | 机制 |
|------|------|
| 认证 | JWT + Passport + 刷新令牌 |
| 权限 | RBAC (角色-权限-菜单) |
| 数据隔离 | 多租户 tenantId 自动注入 |
| 接口安全 | Helmet + Throttler 限流 |
| 文件安全 | OSS 上传 + 类型校验 |

---

## 8. 测试策略

- **单元测试**: 已恢复并修复多份 Service 单测，持续补齐 auth、flow-config、用户/角色等核心链路
- **E2E 测试**: Playwright (saas-web)
- **接口测试**: Swagger 文档覆盖主要控制器与刷新令牌接口

---

## 9. 相关文档

| 文档 | 说明 |
|------|------|
| [BUSINESS_PROCESS.md](./BUSINESS_PROCESS.md) | 业务流程与状态机 |
| [car-loan-flow-design.md](./car-loan-flow-design.md) | 车抵贷详细设计 |
| [saas-web-menu-structure.md](./saas-web-menu-structure.md) | 后台菜单结构 |
| [DEPLOY.md](./DEPLOY.md) | 部署指南 |
