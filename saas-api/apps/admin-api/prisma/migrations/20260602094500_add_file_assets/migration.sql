CREATE TABLE "FileAsset" (
  "id" SERIAL NOT NULL,
  "tenantId" INTEGER NOT NULL,
  "orgId" INTEGER,
  "businessType" TEXT,
  "businessId" INTEGER,
  "categoryCode" TEXT NOT NULL,
  "categoryName" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "objectKey" TEXT,
  "mimeType" TEXT,
  "fileExt" TEXT,
  "fileSize" INTEGER,
  "storageType" TEXT NOT NULL DEFAULT 'LOCAL',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "uploadedBy" INTEGER,
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FileAsset_tenantId_idx" ON "FileAsset"("tenantId");
CREATE INDEX "FileAsset_orgId_idx" ON "FileAsset"("orgId");
CREATE INDEX "FileAsset_businessType_businessId_idx" ON "FileAsset"("businessType", "businessId");
CREATE INDEX "FileAsset_categoryCode_idx" ON "FileAsset"("categoryCode");
CREATE INDEX "FileAsset_status_idx" ON "FileAsset"("status");
CREATE INDEX "FileAsset_uploadedBy_idx" ON "FileAsset"("uploadedBy");

ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
