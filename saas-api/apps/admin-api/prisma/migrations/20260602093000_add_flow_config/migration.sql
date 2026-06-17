CREATE TABLE "FlowConfig" (
  "id" SERIAL NOT NULL,
  "tenantId" INTEGER NOT NULL,
  "orgId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "businessType" TEXT NOT NULL,
  "nodeCode" TEXT NOT NULL,
  "nodeName" TEXT NOT NULL,
  "approveLevel" INTEGER NOT NULL DEFAULT 1,
  "amountLimit" DECIMAL(15,2),
  "timeoutHours" INTEGER,
  "requireMaterials" BOOLEAN NOT NULL DEFAULT false,
  "requireApproval" BOOLEAN NOT NULL DEFAULT true,
  "autoPass" BOOLEAN NOT NULL DEFAULT false,
  "ruleConfig" JSONB,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FlowConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FlowConfig_orgId_businessType_nodeCode_key" ON "FlowConfig"("orgId", "businessType", "nodeCode");
CREATE INDEX "FlowConfig_tenantId_idx" ON "FlowConfig"("tenantId");
CREATE INDEX "FlowConfig_orgId_idx" ON "FlowConfig"("orgId");
CREATE INDEX "FlowConfig_businessType_idx" ON "FlowConfig"("businessType");
CREATE INDEX "FlowConfig_nodeCode_idx" ON "FlowConfig"("nodeCode");
CREATE INDEX "FlowConfig_status_idx" ON "FlowConfig"("status");

ALTER TABLE "FlowConfig" ADD CONSTRAINT "FlowConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FlowConfig" ADD CONSTRAINT "FlowConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
