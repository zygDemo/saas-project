-- 高严重级别修复：补齐软删除字段 + Application 外键 onDelete: Restrict

-- 1. BankCard 补 deletedAt
ALTER TABLE "BankCard" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "BankCard_deletedAt_idx" ON "BankCard"("deletedAt");

-- 2. LeadFollowUp 补 deletedAt
ALTER TABLE "LeadFollowUp" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "LeadFollowUp_deletedAt_idx" ON "LeadFollowUp"("deletedAt");

-- 3. RepaymentRecord 补 deletedAt
ALTER TABLE "RepaymentRecord" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "RepaymentRecord_deletedAt_idx" ON "RepaymentRecord"("deletedAt");

-- 4. CollectionRecord 补 deletedAt
ALTER TABLE "CollectionRecord" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "CollectionRecord_deletedAt_idx" ON "CollectionRecord"("deletedAt");

-- 5. Application 外键显式 onDelete: Restrict（防误删导致数据不一致）
ALTER TABLE "Application" DROP CONSTRAINT IF EXISTS "Application_customerId_fkey";
ALTER TABLE "Application" ADD CONSTRAINT "Application_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT;

ALTER TABLE "Application" DROP CONSTRAINT IF EXISTS "Application_productId_fkey";
ALTER TABLE "Application" ADD CONSTRAINT "Application_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT;

ALTER TABLE "Application" DROP CONSTRAINT IF EXISTS "Application_funderId_fkey";
ALTER TABLE "Application" ADD CONSTRAINT "Application_funderId_fkey" FOREIGN KEY ("funderId") REFERENCES "Funder"("id") ON DELETE RESTRICT;

ALTER TABLE "Application" DROP CONSTRAINT IF EXISTS "Application_creatorId_fkey";
ALTER TABLE "Application" ADD CONSTRAINT "Application_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT;
