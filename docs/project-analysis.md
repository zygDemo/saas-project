# saas-project 项目整体分析

> 生成时间：2026-07-23
> 项目路径：`d:/zygProject/GitHub/saas-project`

---

## 1. 项目定位

**予艺助手 — 车抵贷 SaaS 平台 Monorepo**，面向汽车金融/信贷业务，支持多租户、多角色权限、完整的车贷业务生命周期管理。

核心业务流：

```text
线索(Lead) → 客户(Customer) → 车辆(Vehicle) → 征信 → 申请(Application)
→ 审批(Approval) → 签约(Signing) → 放款(Disbursement) → 还款(Repayment)
```

---

## 2. 物理结构

```
saas-project/
├── saas-api/              # NestJS 后端 Monorepo
│   ├── apps/admin-api/    # 主业务 API（27+ 模块）
│   ├── apps/new-api/      # 新 API 服务（目前仅占位）
│   └── packages/shared/   # @saas/shared 共享包
├── saas-web/              # Vue 3 后台管理系统（Art Design Pro 模板）
├── saas-mobile/           # uni-app 移动端（予艺助手小程序/H5/App）
├── docs/                  # 业务流程、架构、菜单文档
├── deploy/                # Nginx 配置
├── docker-compose.prod.yml
└── .github/workflows/     # CI/CD
```

---

## 3. 技术栈

| 层级 | 技术 | 版本/说明 |
|------|------|-----------|
| 后端 | NestJS + TypeScript | ^10.4.15 |
| ORM | Prisma | ^6.2.1，59+ 模型 |
| 数据库 | PostgreSQL | 16 |
| 缓存/队列 | Redis + BullMQ | Redis 7 |
| 实时 | Socket.IO | WebSocket 通知 |
| 认证 | JWT + Passport | 双 Token |
| 前端 | Vue 3.5 + Vite 7 | Element Plus + Tailwind 4 |
| 移动端 | uni-app 3.0 + Vue 3.4 | uView Pro 0.6.1 |
| 部署 | Docker Compose | Nginx 反向代理 |

---

## 4. 后端（saas-api）分析

### 4.1 Monorepo 组织

- `apps/admin-api`：主服务，包含 `src/modules/` 下 **27+ 业务模块**
- `packages/shared`：共享响应结构、分页工具、类型定义
- `apps/new-api`：仅 README/docker-compose，无实际源码

### 4.2 业务模块

| 分类 | 模块 |
|------|------|
| 核心系统 | `auth` / `users` / `roles` / `menus` / `dept` / `dict` |
| 信贷业务 | `application` / `approval` / `signing` / `disbursement` / `repayment` |
| 业务实体 | `customer` / `lead` / `product` / `funder` / `org` / `vehicle` |
| 工具能力 | `crawler` / `ocr` / `file` / `flow-config` / `data-center` |
| 移动端专用 | `mobile-business` / `mobile-config` |
| 其他 | `notification` / `article` / `announcement` / `reading` / `food` / `mingli` / `work-order` |

### 4.3 架构特点

- 全局统一响应格式：`{ code, data, msg }`
- 统一分页格式：`{ list, meta: { page, pageSize, total, totalPages } }`，前后端 HTTP 层做了兼容转换
- 多租户：租户中间件 + `tenantId` 字段隔离
- 权限：RBAC（用户-角色-菜单-按钮权限）
- 工作流：审批流、状态机驱动业务节点

---

## 5. 前端（saas-web）分析

- 基于 **Art Design Pro** 模板，使用 Vue 3 Composition API + `<script setup>`
- 状态管理：Pinia + persistedstate
- UI：Element Plus + Tailwind CSS 4
- 路由：动态权限路由
- 特性：多标签页、明暗主题、国际化、Excel 导入导出、富文本、ECharts 仪表盘
- 业务视图在 `src/views/business/`、`system/`、`data-center/`、`reading/` 等

---

## 6. 移动端（saas-mobile）分析

- **uni-app** 跨端，目标微信小程序/H5/App
- UI 基于 **uView Pro 0.6.1**
- 页面集中在 `src/pages/carloan/`（44 个文件，车贷主流程）
- 其他模块：`credit/`、`home/`、`my/`、`auth/`、`reading/`、`food/`、`mingli/`
- 已配置 `@uview-pro/mcp` 用于查询组件 API
- 使用 `z-paging` 做下拉分页，`tesseract.js` 做 OCR

---

## 7. 部署与运维

### 生产部署

- Docker Compose：`docker-compose.prod.yml`
- Web 容器：`127.0.0.1:8080`
- API 容器：`127.0.0.1:3001`
- 宿主机 Nginx 反向代理：
  - `/saas` → Web
  - `/saas/api/*` → API

### 本地开发

```bash
cd saas-api
pnpm --filter @saas/admin-api start:dev

cd saas-web
pnpm dev

cd saas-mobile
pnpm dev:mp-weixin
```

支持 `start:prod:local` 连接阿里云 RDS 热重载。

### CI/CD

- `deploy-web.yml`：根 workspace 构建 web
- `deploy-api.yml`：Docker 镜像构建与远程部署
- `deploy-mobile.yml`：mobile 子项目独立构建

---

## 8. 风险与问题

### 8.1 架构/工程风险

| 问题 | 说明 | 影响 |
|------|------|------|
| pnpm workspace 配置割裂 | 根 `pnpm-workspace.yaml` 只包含 `saas-web`，`saas-api` 和 `saas-mobile` 各自独立 workspace | 跨项目命令容易跑错目录，filter 不匹配 |
| 依赖版本激进 | `vite@7`、`vitest@4`、`@vueuse/core@13`、`echarts@6` 等版本在公开 npm 中并非稳定主版本 | 安装/锁定风险，CI 可能失败 |
| mobile 依赖平台绑定 | `@oxc-parser/binding-win32-x64-msvc` 作为 devDep | 非 Windows 环境构建失败 |
| new-api 空置 | `apps/new-api` 无源码，仅外部镜像占位 | 架构冗余或未来迁移计划不明确 |
| 测试覆盖不足 | README 要求 Service 必须有单元测试，但实际测试文件少 | 回归风险高 |

### 8.2 数据/迁移风险

| 问题 | 说明 |
|------|------|
| 迁移历史与 schema 存在漂移 | 历史上 `NotificationLog` 表在 schema 中但 migration 缺失，已补 |
| 迁移后需手动重启服务 | Prisma Client 缓存旧 schema，已出现字段已迁移但服务未重启导致 400 |
| 生产漂移风险 | 本地 `migrate dev` 曾多次触发 drift/reset 警告，生产应严格用 `migrate deploy` |

### 8.3 代码/维护风险

| 问题 | 说明 |
|------|------|
| 前后端分页格式历史包袱 | 虽已统一为 `{ list, meta }`，但部分页面可能仍依赖旧字段，已通过 HTTP 层兼容 |
| 移动端进件字段保护逻辑 | `guardMobileEntryStorage` 用字符串匹配判断字段缺失，易误判或漏判 |
| 重复 migration 文件名 | `20260625120000_add_role_user_mobile_modules` 与 `20260625084059_add_role_user_mobile_modules` 内容可能重复 |
| 临时文件残留 | `test-file.txt`、`build-errors.txt`、playwright-report 等需清理/忽略 |

### 8.4 安全/运维

- `.env` 文件未提交，密钥配置依赖手动
- 生产部署后需手动执行 seed、菜单同步、迁移
- 未看到完整的健康检查/监控/日志聚合方案

---

## 9. 改进建议

### 近期（高优先级）

1. **统一 workspace 管理**
   - 考虑将 `saas-api` 和 `saas-mobile` 也纳入根 workspace，或在根目录提供清晰的命令文档

2. **建立迁移/重启 SOP**
   - 本地开发：`migrate deploy` → `prisma generate` → 重启服务
   - 生产部署：Docker 构建时已 generate，但容器启动后仍需确认 migration 已 apply

3. **清理冗余与临时文件**
   - 删除 `test-file.txt`
   - 将 `playwright-report/`、`test-results/` 加入 `.gitignore`
   - 检查重复 migration

### 中期

4. **补齐测试**
   - 为核心 Service（application/approval/repayment/disbursement）补充单元测试
   - 为 mobile-business 关键路径加 e2e

5. **版本收敛**
   - 将 `vite`、`vitest`、`echarts` 等锁定到稳定版本
   - 移除 `@oxc-parser/binding-win32-x64-msvc` 或改为 optional

6. **加强错误诊断**
   - 将 `guardMobileEntryStorage` 的字符串匹配改为更精确的 Prisma 错误码/字段校验
   - 增加迁移状态健康检查接口

### 长期

7. **new-api 规划**
   - 明确 `apps/new-api` 的定位，要么删除要么开始迁移

8. **监控与可观测性**
   - 增加 `/health` 详细检查（DB/Redis/Queue）
   - 接入日志收集与告警

---

## 10. 当前工作状态速览

- 最近完成：统一 API 响应结构 `{ code, data, msg }`、补齐 `NotificationLog` migration、统一分页格式、HTTP 层兼容转换
- 最新提交：`fedf668` — `feat(web,mobile): add paginated response compatibility layer at http level`
- 进行中：admin-api 服务重启后验证移动端进件接口
