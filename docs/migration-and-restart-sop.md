# saas-api Prisma 迁移与服务重启 SOP

> 适用范围：`saas-api/apps/admin-api`
> 目的：规范 Prisma 迁移执行流程，避免因 schema 缓存导致的`移动端进件字段尚未初始化`等运行时错误。

---

## 1. 核心原则

1. **开发环境用 `migrate deploy`，不用 `migrate dev`**
   - `migrate dev` 会检测 drift，可能提示 reset，容易误删数据。
   - `migrate deploy` 只应用 pending migrations，安全可重复执行。

2. **迁移后必须重新生成 Prisma Client**
   - `prisma generate` 会根据最新 schema 生成 TypeScript 类型和查询引擎。

3. **生成后必须重启 Node 服务**
   - 已运行的 Node 进程会缓存旧的 `@prisma/client`，不重启仍会报字段不存在。

---

## 2. 本地开发标准流程

```bash
# 1. 进入 saas-api workspace
cd D:\zygProject\GitHub\saas-project\saas-api

# 2. 应用迁移
pnpm --filter @saas/admin-api prisma:migrate:deploy:dev

# 3. 重新生成 Prisma Client
pnpm --filter @saas/admin-api prisma:generate

# 4. 重启服务
# 方式 A：停止旧终端后重新运行
pnpm --filter @saas/admin-api start:dev

# 方式 B：使用一键启动脚本（已配置 start:with-migrate）
pnpm --filter @saas/admin-api start:with-migrate
```

---

## 3. 生产部署标准流程

生产镜像构建时已包含 `prisma generate`，容器启动时应先执行迁移再启动服务。

```bash
# Dockerfile 或启动脚本中使用
pnpm --filter @saas/admin-api start:with-migrate
```

该脚本等价于：

```bash
prisma migrate deploy && node dist/main.js
```

> 注意：生产环境数据库用户需要有 `CREATE` 权限以执行迁移。

---

## 4. 常用诊断命令

### 4.1 查看迁移状态

```bash
cd D:\zygProject\GitHub\saas-project\saas-api
pnpm --filter @saas/admin-api exec dotenv -e env/.env.development -- prisma migrate status
```

### 4.2 查看数据库实际字段

```bash
cd D:\zygProject\GitHub\saas-project\saas-api
pnpm --filter @saas/admin-api exec dotenv -e env/.env.development -- tsx prisma/check-mobile-fields.ts
```

> `prisma/check-mobile-fields.ts` 为可选诊断脚本，用于快速校验 `Customer` / `Vehicle` 表是否包含移动端进件所需字段。

---

## 5. 问题排查速查表

| 现象 | 可能原因 | 解决方案 |
|------|----------|----------|
| 字段已迁移但仍报`移动端进件字段尚未初始化` | 服务未重启 | 停止旧 Node 进程，重新启动 |
| 编译时报类型错误 `Property 'xxx' does not exist` | Prisma Client 未重新生成 | 执行 `prisma:generate` |
| `prisma migrate status` 显示 drift | 有人直接改了数据库 | 仅生产用 `migrate deploy`，不用 `migrate dev` |
| `No projects matched the filters` | 在根目录执行了 filter 命令 | 必须 cd 到 `saas-api` 目录 |

---

## 6. 相关脚本说明

| 脚本 | 作用 |
|------|------|
| `prisma:migrate:deploy:dev` | 开发环境安全应用迁移 |
| `prisma:migrate:sit` | SIT 环境应用迁移 |
| `prisma:migrate:prod` | 生产环境应用迁移 |
| `prisma:generate` | 重新生成 Prisma Client |
| `start:with-migrate` | 迁移后启动服务（生产推荐） |

---

## 7. 注意事项

- 不要直接在数据库里手动增删字段，应通过 Prisma migration 管理。
- 新增字段后，如果旧代码不需要立即使用，也建议同步迁移，避免运行时 schema 不一致。
- 多人协作时，提交代码应同时提交 migration 文件，否则他人拉取后数据库会落后。
