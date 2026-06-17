ALTER TABLE "OperationLog"
ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;

CREATE INDEX IF NOT EXISTS "OperationLog_tenantId_idx" ON "OperationLog"("tenantId");
