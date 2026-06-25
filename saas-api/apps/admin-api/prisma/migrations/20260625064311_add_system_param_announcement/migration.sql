-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "childrenNum" INTEGER,
ADD COLUMN     "degree" TEXT,
ADD COLUMN     "dwellingCondition" TEXT,
ADD COLUMN     "liveCity" TEXT,
ADD COLUMN     "liveDetailedAddress" TEXT,
ADD COLUMN     "liveDistrict" TEXT,
ADD COLUMN     "liveProvince" TEXT,
ADD COLUMN     "workingCity" TEXT,
ADD COLUMN     "workingDetailedAddress" TEXT,
ADD COLUMN     "workingDistrict" TEXT,
ADD COLUMN     "workingProvince" TEXT,
ADD COLUMN     "workingTelephone" TEXT;

-- AlterTable
ALTER TABLE "Disbursement" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SignRecord" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SystemParam" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "group" VARCHAR(50),
    "name" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'STRING',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "remark" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SystemParam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT,
    "type" VARCHAR(20) NOT NULL DEFAULT 'NOTICE',
    "level" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "expireAt" TIMESTAMP(3),
    "topFlag" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "remark" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemParam_tenantId_idx" ON "SystemParam"("tenantId");

-- CreateIndex
CREATE INDEX "SystemParam_group_idx" ON "SystemParam"("group");

-- CreateIndex
CREATE INDEX "SystemParam_status_idx" ON "SystemParam"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SystemParam_tenantId_key_key" ON "SystemParam"("tenantId", "key");

-- CreateIndex
CREATE INDEX "Announcement_tenantId_idx" ON "Announcement"("tenantId");

-- CreateIndex
CREATE INDEX "Announcement_status_idx" ON "Announcement"("status");

-- CreateIndex
CREATE INDEX "Announcement_type_idx" ON "Announcement"("type");

-- CreateIndex
CREATE INDEX "Announcement_publishAt_idx" ON "Announcement"("publishAt");

-- AddForeignKey
ALTER TABLE "SystemParam" ADD CONSTRAINT "SystemParam_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
