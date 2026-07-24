# SaaS Deployment

> 架构总览见 [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

This setup keeps the existing H5 site at `/` and mounts the new SaaS app under `/saas`.

```text
https://www.yugui.store/           -> existing H5
https://www.yugui.store/saas       -> SaaS web
https://www.yugui.store/saas/api/* -> SaaS API
```

## 1. 环境要求

| 工具 | 推荐版本 | 说明 |
|------|----------|------|
| Node.js | `>=20.19.0` | 前端构建与本地调试兼容基线 |
| pnpm | `9.x` | 根 workspace 统一管理依赖 |
| Docker / Docker Compose | 最新稳定版 | 本地数据库、服务编排与发布验证 |
| Git | 最新稳定版 | 建议开启 `core.autocrlf=false` |

### Windows 排障提示

- 如 `pnpm` 触发 shell 兼容错误，先执行：
  - `pnpm config set shell-emulator false`
- 本地优先使用 `127.0.0.1`，避免 `localhost` 的 IPv6/代理映射问题
- 遇到端口占用时先清理占用的 `3001` / `5173` / `8080` 等端口

## 2. Server Prerequisites

Install Docker and Docker Compose on the cloud server. Keep ports `80` and `443` open for the existing host Nginx.

The Docker stack binds only to localhost:

```text
127.0.0.1:8080 -> SaaS web container
127.0.0.1:3001 -> SaaS API container
```

## 2. Production Environment

Edit `saas-api/apps/admin-api/env/.env.production` before deployment:

```env
FRONTEND_ORIGIN=https://www.yugui.store
JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_REFRESH_SECRET=replace-with-another-long-random-string
```

Create a root `.env` file for Docker Compose:

```env
POSTGRES_PASSWORD=replace-with-a-strong-password
FRONTEND_ORIGIN=https://www.yugui.store
SAAS_WEB_PORT=8080
SAAS_API_PORT=3001
```

## 3. Build And Start

Run from the repository root:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 4. Initialize The Database

Run migrations, seed data, and menu sync inside the API container:

```bash
docker compose -f docker-compose.prod.yml exec admin-api pnpm exec prisma migrate deploy --schema prisma/schema.prisma
docker compose -f docker-compose.prod.yml exec admin-api pnpm exec tsx prisma/scripts/seed.ts
docker compose -f docker-compose.prod.yml exec admin-api pnpm exec tsx prisma/scripts/seed-reading.ts
docker compose -f docker-compose.prod.yml exec admin-api pnpm run db:sync-roles:prod
```

### Manual post-deploy menu sync / 发版后手动菜单同步

If the API image is already deployed and you only need to manually sync the latest menu / role-menu / button-permission definitions to production, run:

如果 API 镜像已经发版完成，但你只需要把最新的菜单、角色菜单、按钮权限定义手动同步到生产环境，请执行下面这组命令：

```bash
cd /opt/saas/api
docker compose run --rm --no-deps api pnpm run db:sync-roles:prod
docker compose up -d api
```

This is the manual post-deploy command set for forcing production menu sync after deployment.

中文说明：以上命令用于“发版后手动补同步生产菜单”。其中 `db:sync-roles:prod` 会把后台菜单结构、角色菜单关联、按钮权限配置同步到生产数据库；随后执行 `docker compose up -d api`，确保 API 服务以最新同步结果继续运行。

## 5. Host Nginx

Add the locations from `deploy/nginx-yugui-saas.conf` to the existing HTTPS `server` block for `www.yugui.store`. Do not replace the current `/` location for the existing H5 site.

Then reload Nginx:

```bash
nginx -t
systemctl reload nginx
```

## 6. Check Services

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f admin-api
curl http://127.0.0.1:8080/saas/
curl http://127.0.0.1:3001/saas/api/health
```

Visit:

```text
https://www.yugui.store/saas/
https://www.yugui.store/saas/api/health
https://www.yugui.store/saas/api/docs
```


## 2.1. Local Production Mode

Use start:prod:local to run the API locally with production environment variables
(connecting to Alibaba Cloud RDS) while keeping hot-reload for development:

    cd saas-api/apps/admin-api
    pnpm run start:prod:local

Script Reference

    start:dev        env/.env.development    Local dev (local DB)
    start:prod:local env/.env.production     Local with production DB (hot-reload)
    start:prod       System env vars         Production deployment (requires build first)

Important Notes

- Ensure your local public IP is whitelisted in Alibaba Cloud RDS security group
- Be careful when operating against production database
- saas-web and saas-mobile do not need changes — they connect to localhost:3001


## 7. CI / 发版工作流说明

当前仓库采用独立子项目部署模式：

- `saas-web`：通过根目录 `pnpm-workspace.yaml` 纳入 workspace，由 `deploy-web.yml` 在仓库根目录安装并构建
- `saas-mobile`：保持子项目本地安装与构建，由 `deploy-mobile.yml` 在 `saas-mobile/` 内执行
- `saas-api`：通过 Docker 镜像发布，由 `deploy-api.yml` 负责构建、推送镜像并远程部署

### web 发版

```bash
# 本地验证 web 构建（根目录）
pnpm install --frozen-lockfile
pnpm --filter art-design-pro run build
```

当前 `deploy-web.yml` 使用根目录 workspace + 根目录 lockfile 执行：

```yaml
run: pnpm install --frozen-lockfile
run: pnpm --filter art-design-pro run build
```

### mobile 发版

```bash
# 本地验证 mobile 构建（子项目目录）
cd saas-mobile
pnpm install --frozen-lockfile
pnpm build:h5
```

当前 `deploy-mobile.yml` 使用 `saas-mobile/pnpm-lock.yaml` 作为缓存依赖，并在 `saas-mobile/` 内执行安装与构建。

### 注意事项

1. 根目录新增了 `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`，主要用于统一 web 发版流程  
2. `saas-mobile`、`saas-api` 仍然保持各自独立构建模式，避免互相影响  
3. `build-errors.txt` 是历史记录，不代表当前构建状态


## 8. 本地 Prisma 类型生成注意事项

当 `saas-api/pnpm-lock.yaml` 中 `@prisma/client` 版本发生变化后，本地 TypeScript 可能会报大量 Prisma 类型缺失错误，例如：

- `Prisma.XxxWhereInput` 不存在
- `Prisma.XxxGetPayload` 不存在
- `@prisma/client` 的枚举（如 `ApplicationStatus`、`LeadStatus`）导不出来
- `PrismaClientKnownRequestError` 不存在

这种情况通常不是代码损坏，而是本地没有重新生成 Prisma Client。

### 解决方式

```bash
cd saas-api/apps/admin-api
pnpm prisma:generate
cd ../..
pnpm build
```

### 为什么 CI / Docker 发版不受影响

`saas-api/apps/admin-api/Dockerfile` 中已经包含：

```dockerfile
RUN pnpm --filter @saas/shared build   && pnpm --filter @saas/admin-api exec prisma generate --schema prisma/schema.prisma   && pnpm --filter @saas/admin-api build
```

因此：

- Docker 发版流程无需额外补 `prisma generate`
- GitHub Actions 部署 API 的流程无需修改
- 只有**本地开发环境**在 lockfile 升级后需要手动执行一次 `prisma:generate`
