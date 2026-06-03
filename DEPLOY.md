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

Run migrations and seed data inside the API container:

```bash
docker compose -f docker-compose.prod.yml exec admin-api pnpm exec prisma migrate deploy --schema prisma/schema.prisma
docker compose -f docker-compose.prod.yml exec admin-api pnpm exec tsx prisma/seed.ts
```

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
