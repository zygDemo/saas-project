# saas-project

> 予艺助手 — 车抵贷 SaaS 平台 Monorepo

## 项目结构

```
saas-project/
├── saas-api/              # NestJS 后端
│   ├── apps/admin-api/    # 后台管理 + 业务 API
│   ├── apps/new-api/      # 新 API 服务
│   └── packages/shared/   # 共享类型/工具
├── saas-web/              # Vue 3 后台管理系统
├── saas-mobile/           # uni-app 移动端（予艺助手）
├── docs/                  # 项目文档
└── .github/workflows/     # CI/CD
```

## 技术栈

### 后端 (saas-api)
- **框架**: NestJS 10 + TypeScript
- **ORM**: Prisma 6.2 (59 模型)
- **数据库**: PostgreSQL 16
- **缓存**: Redis 7 + ioredis
- **队列**: BullMQ
- **实时**: Socket.IO WebSocket
- **认证**: JWT + Passport
- **安全**: Helmet + Throttler
- **文档**: Swagger 8

### 前端 (saas-web)
- **框架**: Vue 3.5 + Vite
- **UI**: Element Plus + Tailwind CSS 4
- **状态**: Pinia
- **路由**: Vue Router
- **国际化**: Vue I18n
- **WebSocket**: Socket.IO Client

### 移动端 (saas-mobile)
- **框架**: uni-app 3.0 + Vue 3.4
- **UI**: uView Pro
- **状态**: Pinia
- **平台**: 微信小程序 / H5 / App

## 快速开始

### 后端
```bash
cd saas-api
pnpm install
pnpm --filter @saas/admin-api start:dev
```

### 前端
```bash
cd saas-web
pnpm install
pnpm dev
```

### 移动端
```bash
cd saas-mobile
pnpm install
pnpm dev:mp-weixin
```

## 测试

```bash
# 后端单元测试
cd saas-api
pnpm test

# 查看测试覆盖率
pnpm test:cov
```

## 部署

详见 [DEPLOY.md](./DEPLOY.md)

## 文档

| 文档 | 说明 |
|------|------|
| [docs/BUSINESS_PROCESS.md](./docs/BUSINESS_PROCESS.md) | 业务流程与状态机 |
| [docs/car-loan-flow-design.md](./docs/car-loan-flow-design.md) | 车抵贷流程详细设计 |
| [docs/saas-web-menu-structure.md](./docs/saas-web-menu-structure.md) | 后台菜单结构 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 架构总览与模块说明 |
| [DEPLOY.md](./DEPLOY.md) | 部署指南 |

## 业务模块

### 车抵贷核心流程
客户线索 → 客户录入 → 车辆录入 → 征信查询 → 申请提交 → 审批 → 签约 → 放款 → 还款

### 主要功能
- 客户管理 (customer)
- 车辆管理 (vehicle)
- 征信查询 (credit)
- 申请审批 (application/approval)
- 电子签约 (signing)
- 放款管理 (disbursement)
- 还款管理 (repayment)
- 产品/资方管理 (product/funder)
- 组织架构 (org/dept)
- 权限管理 (users/roles/menus)
- 实时通知 (notification)
- 文章/公告 (article/announcement)
- 小程序点餐 (food)
- 读书模块 (reading)
- 命理工具 (mingli)

## 开发规范

- 后端遵循 NestJS 最佳实践
- 前端使用 Composition API + `<script setup>`
- 所有 Service 必须有单元测试
- API 文档使用 Swagger 装饰器
- 代码提交遵循 Conventional Commits

## 贡献

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT
