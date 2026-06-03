FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin-api/package.json apps/admin-api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @saas/shared build \
  && pnpm --filter @saas/admin-api exec prisma generate --schema prisma/schema.prisma \
  && pnpm --filter @saas/admin-api build

WORKDIR /app/apps/admin-api

EXPOSE 3001

CMD ["node", "dist/main.js"]
