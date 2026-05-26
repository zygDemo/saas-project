# Deployment

This is the simplest single-server production setup for the SaaS project.

## 1. Server prerequisites

Install Docker and Docker Compose on the cloud server, then open ports `80` and `443` in the cloud firewall.

## 2. Production environment

Edit `saas-api/apps/admin-api/env/.env.production` before deployment:

```env
FRONTEND_ORIGIN=http://your-domain-or-server-ip
JWT_ACCESS_SECRET=replace-with-a-long-random-string
JWT_REFRESH_SECRET=replace-with-another-long-random-string
```

Create a root `.env` file for Docker Compose:

```env
POSTGRES_PASSWORD=replace-with-a-strong-password
```

## 3. Build and start

Run from the repository root:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 4. Initialize the database

Run migrations and seed data inside the API container:

```bash
docker compose -f docker-compose.prod.yml exec admin-api pnpm exec prisma migrate deploy --schema prisma/schema.prisma
docker compose -f docker-compose.prod.yml exec admin-api pnpm exec tsx prisma/seed.ts
```

## 5. Check services

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f admin-api
```

Visit:

```text
http://your-server-ip
http://your-server-ip/api/health
```

## 6. HTTPS

For HTTPS, put Caddy, Nginx with Certbot, or a cloud load balancer in front of this stack and forward traffic to the `web` container.
