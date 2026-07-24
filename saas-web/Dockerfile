FROM node:22-alpine AS builder

ARG VITE_API_URL=/saas
ARG VITE_BASE_URL=/saas/
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_BASE_URL=${VITE_BASE_URL}

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# 从根目录复制 workspace 配置和 lock 文件
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY saas-web/package.json saas-web/package.json

RUN pnpm install --frozen-lockfile --filter art-design-pro

COPY saas-web/ saas-web/
RUN pnpm --filter art-design-pro run build

FROM nginx:1.27-alpine

COPY saas-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/saas-web/dist /usr/share/nginx/html/saas

EXPOSE 80
