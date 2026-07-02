-- CreateTable
CREATE TABLE "CollectionRecord" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "collectorId" INTEGER,
    "collectType" TEXT NOT NULL DEFAULT 'PHONE',
    "content" TEXT NOT NULL,
    "result" TEXT,
    "nextAction" TEXT,
    "nextDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarlyRepayment" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "repayType" TEXT NOT NULL DEFAULT 'FULL',
    "amount" DECIMAL(15,2) NOT NULL,
    "principal" DECIMAL(15,2) NOT NULL,
    "interest" DECIMAL(15,2) NOT NULL,
    "penalty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "repayStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EarlyRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectionRecord_tenantId_idx" ON "CollectionRecord"("tenantId");

-- CreateIndex
CREATE INDEX "CollectionRecord_applicationId_idx" ON "CollectionRecord"("applicationId");

-- CreateIndex
CREATE INDEX "CollectionRecord_createdAt_idx" ON "CollectionRecord"("createdAt");

-- CreateIndex
CREATE INDEX "EarlyRepayment_tenantId_idx" ON "EarlyRepayment"("tenantId");

-- CreateIndex
CREATE INDEX "EarlyRepayment_applicationId_idx" ON "EarlyRepayment"("applicationId");

-- CreateIndex
CREATE INDEX "EarlyRepayment_repayStatus_idx" ON "EarlyRepayment"("repayStatus");

-- AddForeignKey
ALTER TABLE "CollectionRecord" ADD CONSTRAINT "CollectionRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRecord" ADD CONSTRAINT "CollectionRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarlyRepayment" ADD CONSTRAINT "EarlyRepayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarlyRepayment" ADD CONSTRAINT "EarlyRepayment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
