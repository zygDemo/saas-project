-- Baseline objects that existed in local databases but were missing from migration history.
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "PackagePlan" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "description" VARCHAR(500),
  "price" DECIMAL(10,2) NOT NULL,
  "maxUsers" INTEGER NOT NULL DEFAULT 0,
  "maxOrgs" INTEGER NOT NULL DEFAULT 0,
  "features" JSONB,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PackagePlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ProductTemplate" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "productType" VARCHAR(50) NOT NULL,
  "description" VARCHAR(500),
  "minRate" DECIMAL(5,4),
  "maxRate" DECIMAL(5,4),
  "minAmount" DECIMAL(15,2),
  "maxAmount" DECIMAL(15,2),
  "minTerm" INTEGER,
  "maxTerm" INTEGER,
  "repaymentMethod" VARCHAR(50),
  "accessConditions" JSONB,
  "fileChecklist" JSONB,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ProductTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ThirdPartyService" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "serviceType" VARCHAR(50) NOT NULL,
  "provider" VARCHAR(100) NOT NULL,
  "apiUrl" VARCHAR(500),
  "config" JSONB,
  "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  "lastTestAt" TIMESTAMP(3),
  "lastTestOk" BOOLEAN,
  "remark" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ThirdPartyService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "WorkOrder" (
  "id" SERIAL NOT NULL,
  "tenantId" INTEGER NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "content" TEXT,
  "orderType" VARCHAR(30) NOT NULL DEFAULT 'FEEDBACK',
  "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  "creatorId" INTEGER,
  "assigneeId" INTEGER,
  "resolvedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "remark" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ReadingNote" (
  "id" SERIAL NOT NULL,
  "tenantId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "bookId" INTEGER NOT NULL,
  "chapterId" INTEGER NOT NULL,
  "highlight" TEXT,
  "note" TEXT,
  "color" TEXT NOT NULL DEFAULT '#FFEB3B',
  "startPos" INTEGER NOT NULL DEFAULT 0,
  "endPos" INTEGER NOT NULL DEFAULT 0,
  "status" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "ReadingNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ReadingNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReadingNote_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ReadingNote_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "BookChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PackagePlan_code_key" ON "PackagePlan"("code");
CREATE INDEX IF NOT EXISTS "PackagePlan_status_idx" ON "PackagePlan"("status");

CREATE INDEX IF NOT EXISTS "ProductTemplate_status_idx" ON "ProductTemplate"("status");
CREATE INDEX IF NOT EXISTS "ProductTemplate_productType_idx" ON "ProductTemplate"("productType");

CREATE UNIQUE INDEX IF NOT EXISTS "ThirdPartyService_code_key" ON "ThirdPartyService"("code");
CREATE INDEX IF NOT EXISTS "ThirdPartyService_status_idx" ON "ThirdPartyService"("status");
CREATE INDEX IF NOT EXISTS "ThirdPartyService_serviceType_idx" ON "ThirdPartyService"("serviceType");

CREATE INDEX IF NOT EXISTS "WorkOrder_tenantId_idx" ON "WorkOrder"("tenantId");
CREATE INDEX IF NOT EXISTS "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX IF NOT EXISTS "WorkOrder_orderType_idx" ON "WorkOrder"("orderType");
CREATE INDEX IF NOT EXISTS "WorkOrder_priority_idx" ON "WorkOrder"("priority");
CREATE INDEX IF NOT EXISTS "WorkOrder_createdAt_idx" ON "WorkOrder"("createdAt");

CREATE INDEX IF NOT EXISTS "ReadingNote_tenantId_idx" ON "ReadingNote"("tenantId");
CREATE INDEX IF NOT EXISTS "ReadingNote_userId_idx" ON "ReadingNote"("userId");
CREATE INDEX IF NOT EXISTS "ReadingNote_bookId_idx" ON "ReadingNote"("bookId");
CREATE INDEX IF NOT EXISTS "ReadingNote_chapterId_idx" ON "ReadingNote"("chapterId");
