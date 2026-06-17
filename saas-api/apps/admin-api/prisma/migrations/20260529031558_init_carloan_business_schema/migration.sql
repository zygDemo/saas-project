-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('PENDING_ASSIGN', 'PENDING_FOLLOW', 'FOLLOWING', 'CONVERTED', 'INVALID', 'DORMANT', 'PUBLIC_POOL');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_FIRST_REVIEW', 'FIRST_REVIEW_PASSED', 'FIRST_REVIEW_REJECTED', 'PENDING_SUPPLEMENT', 'PENDING_FINAL_REVIEW', 'FINAL_REVIEW_PASSED', 'FINAL_REVIEW_REJECTED', 'PENDING_FUNDER_REVIEW', 'FUNDER_REVIEW_PASSED', 'FUNDER_REVIEW_REJECTED', 'PENDING_SIGN', 'SIGNED', 'PENDING_DISBURSEMENT', 'DISBURSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('PASS', 'REJECT', 'SUPPLEMENT', 'TRANSFER', 'RETURN', 'REMARK');

-- CreateEnum
CREATE TYPE "SignStatus" AS ENUM ('PENDING', 'SENT', 'SIGNED', 'VIDEO_INTERVIEW_DONE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisbursementStatus" AS ENUM ('PENDING_APPLICATION', 'PENDING_APPROVAL', 'GPS_INSTALLED', 'MORTGAGE_DONE', 'DISBURSED', 'FAILED');

-- CreateEnum
CREATE TYPE "RepaymentStatus" AS ENUM ('NOT_DUE', 'PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'SETTLED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "dataScope" TEXT NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deptId" INTEGER;

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "creditCode" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "status" "OrgStatus" NOT NULL DEFAULT 'ACTIVE',
    "packageType" TEXT,
    "expireAt" TIMESTAMP(3),
    "apiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "name" TEXT NOT NULL,
    "managerId" INTEGER,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "minRate" DECIMAL(5,4) NOT NULL,
    "maxRate" DECIMAL(5,4) NOT NULL,
    "minAmount" DECIMAL(15,2) NOT NULL,
    "maxAmount" DECIMAL(15,2) NOT NULL,
    "minTerm" INTEGER NOT NULL,
    "maxTerm" INTEGER NOT NULL,
    "repaymentMethod" TEXT NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "maxCarAge" INTEGER,
    "maxMileage" INTEGER,
    "ltvLimit" DECIMAL(5,4),
    "minDownPayment" DECIMAL(5,4),
    "regions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "fileChecklist" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funder" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "funderType" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "apiConfig" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Funder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "idCard" TEXT,
    "carBrand" TEXT,
    "carModel" TEXT,
    "loanAmount" DECIMAL(15,2),
    "remark" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'PENDING_ASSIGN',
    "assigneeId" INTEGER,
    "nextFollowAt" TIMESTAMP(3),
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFollowUp" (
    "id" SERIAL NOT NULL,
    "leadId" INTEGER NOT NULL,
    "followType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "nextFollowAt" TIMESTAMP(3),
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "idCard" TEXT,
    "gender" "Gender" NOT NULL DEFAULT 'UNKNOWN',
    "birthDate" TIMESTAMP(3),
    "maritalStatus" TEXT,
    "education" TEXT,
    "occupation" TEXT,
    "companyName" TEXT,
    "monthlyIncome" DECIMAL(15,2),
    "address" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerContact" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "vin" TEXT,
    "plateNumber" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "year" INTEGER,
    "mileage" INTEGER,
    "purchasePrice" DECIMAL(15,2),
    "estimateValue" DECIMAL(15,2),
    "isMortgaged" BOOLEAN NOT NULL DEFAULT false,
    "mortgageInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankCard" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "bankName" TEXT NOT NULL,
    "cardNo" TEXT NOT NULL,
    "cardType" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER,
    "funderId" INTEGER,
    "applicationNo" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "term" INTEGER NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "repaymentMethod" TEXT NOT NULL,
    "purpose" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "creatorId" INTEGER NOT NULL,
    "sourceLeadId" INTEGER,
    "supplementReason" TEXT,
    "supplementDeadline" TIMESTAMP(3),
    "approvedAmount" DECIMAL(15,2),
    "approvedTerm" INTEGER,
    "approvedRate" DECIMAL(5,4),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationFile" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "ocrResult" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRecord" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "approverId" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "opinion" TEXT,
    "amount" DECIMAL(15,2),
    "term" INTEGER,
    "rate" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignRecord" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "status" "SignStatus" NOT NULL DEFAULT 'PENDING',
    "contractUrl" TEXT,
    "signedAt" TIMESTAMP(3),
    "videoUrl" TEXT,
    "expiredAt" TIMESTAMP(3),
    "cancelledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disbursement" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "status" "DisbursementStatus" NOT NULL DEFAULT 'PENDING_APPLICATION',
    "gpsDeviceNo" TEXT,
    "gpsInstallImg" TEXT,
    "gpsInstallAt" TIMESTAMP(3),
    "mortgageStatus" TEXT,
    "mortgageImg" TEXT,
    "mortgageAt" TIMESTAMP(3),
    "disburseAmount" DECIMAL(15,2),
    "disburseAccount" TEXT,
    "disburseAt" TIMESTAMP(3),
    "transactionNo" TEXT,
    "voucherUrl" TEXT,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepaymentPlan" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "principal" DECIMAL(15,2) NOT NULL,
    "interest" DECIMAL(15,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paidPrincipal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidInterest" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "RepaymentStatus" NOT NULL DEFAULT 'NOT_DUE',
    "overdueDays" INTEGER NOT NULL DEFAULT 0,
    "penaltyAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepaymentRecord" (
    "id" SERIAL NOT NULL,
    "planId" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "principal" DECIMAL(15,2) NOT NULL,
    "interest" DECIMAL(15,2) NOT NULL,
    "penalty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paymentMethod" TEXT NOT NULL,
    "transactionNo" TEXT,
    "voucherUrl" TEXT,
    "remark" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER,
    "userId" INTEGER,
    "userName" TEXT,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "requestData" JSONB,
    "responseData" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_creditCode_key" ON "Organization"("creditCode");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "Department_orgId_idx" ON "Department"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_orgId_name_key" ON "Department"("orgId", "name");

-- CreateIndex
CREATE INDEX "Product_orgId_idx" ON "Product"("orgId");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Funder_orgId_idx" ON "Funder"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Funder_orgId_code_key" ON "Funder"("orgId", "code");

-- CreateIndex
CREATE INDEX "Lead_orgId_idx" ON "Lead"("orgId");

-- CreateIndex
CREATE INDEX "Lead_phone_idx" ON "Lead"("phone");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_assigneeId_idx" ON "Lead"("assigneeId");

-- CreateIndex
CREATE INDEX "LeadFollowUp_leadId_idx" ON "LeadFollowUp"("leadId");

-- CreateIndex
CREATE INDEX "Customer_orgId_idx" ON "Customer"("orgId");

-- CreateIndex
CREATE INDEX "Customer_idCard_idx" ON "Customer"("idCard");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_orgId_phone_key" ON "Customer"("orgId", "phone");

-- CreateIndex
CREATE INDEX "CustomerContact_customerId_idx" ON "CustomerContact"("customerId");

-- CreateIndex
CREATE INDEX "Vehicle_customerId_idx" ON "Vehicle"("customerId");

-- CreateIndex
CREATE INDEX "Vehicle_vin_idx" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "BankCard_customerId_idx" ON "BankCard"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationNo_key" ON "Application"("applicationNo");

-- CreateIndex
CREATE INDEX "Application_orgId_idx" ON "Application"("orgId");

-- CreateIndex
CREATE INDEX "Application_customerId_idx" ON "Application"("customerId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_creatorId_idx" ON "Application"("creatorId");

-- CreateIndex
CREATE INDEX "Application_applicationNo_idx" ON "Application"("applicationNo");

-- CreateIndex
CREATE INDEX "ApplicationFile_applicationId_idx" ON "ApplicationFile"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationFile_fileType_idx" ON "ApplicationFile"("fileType");

-- CreateIndex
CREATE INDEX "ApprovalRecord_applicationId_idx" ON "ApprovalRecord"("applicationId");

-- CreateIndex
CREATE INDEX "ApprovalRecord_approverId_idx" ON "ApprovalRecord"("approverId");

-- CreateIndex
CREATE INDEX "ApprovalRecord_stage_idx" ON "ApprovalRecord"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "SignRecord_applicationId_key" ON "SignRecord"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Disbursement_applicationId_key" ON "Disbursement"("applicationId");

-- CreateIndex
CREATE INDEX "RepaymentPlan_applicationId_idx" ON "RepaymentPlan"("applicationId");

-- CreateIndex
CREATE INDEX "RepaymentPlan_status_idx" ON "RepaymentPlan"("status");

-- CreateIndex
CREATE INDEX "RepaymentPlan_dueDate_idx" ON "RepaymentPlan"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "RepaymentPlan_applicationId_period_key" ON "RepaymentPlan"("applicationId", "period");

-- CreateIndex
CREATE INDEX "RepaymentRecord_planId_idx" ON "RepaymentRecord"("planId");

-- CreateIndex
CREATE INDEX "OperationLog_orgId_idx" ON "OperationLog"("orgId");

-- CreateIndex
CREATE INDEX "OperationLog_userId_idx" ON "OperationLog"("userId");

-- CreateIndex
CREATE INDEX "OperationLog_module_idx" ON "OperationLog"("module");

-- CreateIndex
CREATE INDEX "OperationLog_createdAt_idx" ON "OperationLog"("createdAt");

-- CreateIndex
CREATE INDEX "User_deptId_idx" ON "User"("deptId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_deptId_fkey" FOREIGN KEY ("deptId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funder" ADD CONSTRAINT "Funder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankCard" ADD CONSTRAINT "BankCard_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_funderId_fkey" FOREIGN KEY ("funderId") REFERENCES "Funder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationFile" ADD CONSTRAINT "ApplicationFile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRecord" ADD CONSTRAINT "ApprovalRecord_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignRecord" ADD CONSTRAINT "SignRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disbursement" ADD CONSTRAINT "Disbursement_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepaymentPlan" ADD CONSTRAINT "RepaymentPlan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepaymentRecord" ADD CONSTRAINT "RepaymentRecord_planId_fkey" FOREIGN KEY ("planId") REFERENCES "RepaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
