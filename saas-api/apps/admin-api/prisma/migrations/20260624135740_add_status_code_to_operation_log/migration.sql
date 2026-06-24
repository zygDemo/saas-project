-- AlterTable
ALTER TABLE "OperationLog" ADD COLUMN     "statusCode" INTEGER NOT NULL DEFAULT 200;

-- CreateIndex
CREATE INDEX "OperationLog_statusCode_idx" ON "OperationLog"("statusCode");
