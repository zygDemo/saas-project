-- 为 Vehicle 模型补充软删除字段 deletedAt，与项目其他模型保持一致
-- 修复 mobile-file.service 中 linkApplicationFiles 引用 deletedAt 导致接口 400 的问题

ALTER TABLE "Vehicle" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "Vehicle_deletedAt_idx" ON "Vehicle"("deletedAt");
