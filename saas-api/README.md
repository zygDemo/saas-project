# saas-api

`saas-api` 是为 `saas-web` 配套的 NestJS 后端 Monorepo。当前版本先覆盖前端已经调用的接口，并预置 PostgreSQL、Redis、BullMQ 和 Prisma 的工程基础。

## 技术栈

- Monorepo: pnpm workspace
- API: NestJS 10 + TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Cache: Redis + ioredis
- Queue: BullMQ
- Auth: JWT + Passport
- Docs: Swagger, available at `/saas/api/docs`

## 目录结构

```text
saas-api/
  apps/admin-api/           # 后台管理 NestJS API 服务
    prisma/                 # Prisma schema 和 seed
    src/common/             # 通用拦截器、过滤器、守卫、类型
    src/modules/auth/       # 登录、JWT
    src/modules/users/      # 用户信息、用户列表
    src/modules/roles/      # 角色列表
    src/modules/menus/      # 动态菜单树
    src/modules/redis/      # Redis 客户端
    src/modules/queue/      # BullMQ 示例队列
    src/modules/health/     # 健康检查
  packages/shared/          # 预留共享契约包
```

## 已对齐 saas-web 的接口

| 前端调用 | 后端接口 | 说明 |
| --- | --- | --- |
| `fetchLogin` | `POST /saas/api/auth/login` | 返回 `token`、`refreshToken` |
| `fetchGetUserInfo` | `GET /saas/api/user/info` | 返回用户角色、按钮权限、基础资料 |
| `fetchGetUserList` | `GET /saas/api/user/list` | 返回 `records/current/size/total` |
| `fetchGetRoleList` | `GET /saas/api/role/list` | 返回角色分页 |
| `fetchGetMenuList` | `GET /saas/api/v3/system/menus` | 返回 `AppRouteRecord[]` 菜单树 |

所有接口都返回前端期望的统一格式：

```json
{
  "code": 200,
  "msg": "success",
  "data": {}
}
```

## 本地启动

1. 安装依赖

```bash
pnpm install
```

2. 启动 PostgreSQL 和 Redis

```bash
docker compose up -d
```

3. 配置环境变量

```bash
cp apps/admin-api/env/.env.example apps/admin-api/env/.env.development
```

4. 初始化数据库

```bash
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

5. 启动 API

```bash
pnpm dev
```

默认服务地址：`http://localhost:3001`。

## 预置账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| `Super` | `123456` | `R_SUPER` |
| `Admin` | `123456` | `R_ADMIN` |
| `User` | `123456` | `R_USER` |

## 前端代理建议

`saas-web/.env.development` 中将代理目标指向 API：

```env
VITE_API_URL=/saas/api
VITE_API_PROXY_URL=http://localhost:3001
```

前端会请求 `/saas/api/...`，Vite proxy 会转发到 NestJS。


查看实时日志
docker logs --tail=100 saas-api

重启后端
docker restart saas-api

接口文档
http://localhost:3001/saas/api/docs


## 下一步建议

- 为用户、角色、菜单补齐新增、编辑、删除接口。
- 增加 RBAC 权限守卫，让接口也按角色和按钮权限控制访问。
- 增加 Refresh Token 换发和退出登录的 Redis 黑名单。
- 为 BullMQ 增加业务任务，如导入导出、通知、审计日志异步写入。
