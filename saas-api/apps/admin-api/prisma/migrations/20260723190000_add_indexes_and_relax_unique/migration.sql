-- 中优先级修复：复合索引 + Customer 部分唯一索引 + UserBookshelf 唯一约束改普通索引

-- 1. Customer: [orgId, idCard] 复合索引 + 部分唯一索引（防重复建档，仅约束未删除记录）
CREATE INDEX "Customer_orgId_idCard_idx" ON "Customer"("orgId", "idCard");
CREATE UNIQUE INDEX "Customer_orgId_idCard_active_idx" ON "Customer"("orgId", "idCard") WHERE "deletedAt" IS NULL;

-- 2. NotificationLog: [userId, readAt] 复合索引优化未读计数查询
CREATE INDEX "NotificationLog_userId_readAt_idx" ON "NotificationLog"("userId", "readAt");

-- 3. OperationLog: [tenantId, createdAt] 复合索引优化统计查询
CREATE INDEX "OperationLog_tenantId_createdAt_idx" ON "OperationLog"("tenantId", "createdAt");

-- 4. UserBookshelf: 唯一约束改普通索引（兼容软删除后重新添加同一本书）
DROP INDEX IF EXISTS "UserBookshelf_userId_bookId_key";
CREATE INDEX "UserBookshelf_userId_bookId_idx" ON "UserBookshelf"("userId", "bookId");
