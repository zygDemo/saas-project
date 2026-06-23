CREATE TABLE "DictType" (
  "id" SERIAL NOT NULL,
  "tenantId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DictType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DictData" (
  "id" SERIAL NOT NULL,
  "tenantId" INTEGER NOT NULL,
  "typeId" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "remark" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DictData_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DictType_tenantId_code_key" ON "DictType"("tenantId", "code");
CREATE INDEX "DictType_tenantId_idx" ON "DictType"("tenantId");
CREATE INDEX "DictType_status_idx" ON "DictType"("status");

CREATE UNIQUE INDEX "DictData_tenantId_typeId_value_key" ON "DictData"("tenantId", "typeId", "value");
CREATE INDEX "DictData_tenantId_idx" ON "DictData"("tenantId");
CREATE INDEX "DictData_typeId_idx" ON "DictData"("typeId");
CREATE INDEX "DictData_status_idx" ON "DictData"("status");

ALTER TABLE "DictType"
  ADD CONSTRAINT "DictType_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DictData"
  ADD CONSTRAINT "DictData_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DictData"
  ADD CONSTRAINT "DictData_typeId_fkey"
  FOREIGN KEY ("typeId") REFERENCES "DictType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
