# SaaS Deployment

This setup keeps the existing H5 site at `/` and mounts the new SaaS app under `/saas`.

```text
https://www.yugui.store/           -> existing H5
https://www.yugui.store/saas       -> SaaS web
https://www.yugui.store/saas/api/* -> SaaS API
```

## 1. Server Prerequisites

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
docker compose -f docker-compose.prod.yml exec admin-api pnpm exec tsx prisma/seed.ts
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
