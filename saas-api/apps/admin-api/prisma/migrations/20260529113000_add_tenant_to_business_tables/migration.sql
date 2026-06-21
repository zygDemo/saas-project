-- Add tenant isolation columns to business tables with existing data support.
-- Historical local/demo data is assigned to the default tenant. Child records
-- inherit tenantId from their parent business record where possible.

INSERT INTO "Tenant" ("id", "name", "code", "status", "createdAt", "updatedAt")
VALUES (1, 'Default Tenant', 'default', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

SELECT setval(
  pg_get_serial_sequence('"Tenant"', 'id'),
  GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "Tenant"), 1),
  true
);

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "Organization" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "Organization" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Organization"
  ADD CONSTRAINT "Organization_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Organization_tenantId_idx" ON "Organization"("tenantId");

ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "Department" dept
SET "tenantId" = org."tenantId"
FROM "Organization" org
WHERE dept."orgId" = org."id" AND dept."tenantId" IS NULL;
UPDATE "Department" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "Department" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Department"
  ADD CONSTRAINT "Department_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Department_tenantId_idx" ON "Department"("tenantId");

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "Product" product
SET "tenantId" = org."tenantId"
FROM "Organization" org
WHERE product."orgId" = org."id" AND product."tenantId" IS NULL;
UPDATE "Product" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Product"
  ADD CONSTRAINT "Product_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Product_tenantId_idx" ON "Product"("tenantId");

ALTER TABLE "Funder" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "Funder" funder
SET "tenantId" = org."tenantId"
FROM "Organization" org
WHERE funder."orgId" = org."id" AND funder."tenantId" IS NULL;
UPDATE "Funder" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "Funder" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Funder"
  ADD CONSTRAINT "Funder_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Funder_tenantId_idx" ON "Funder"("tenantId");

ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "Lead" lead
SET "tenantId" = org."tenantId"
FROM "Organization" org
WHERE lead."orgId" = org."id" AND lead."tenantId" IS NULL;
UPDATE "Lead" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "Lead" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Lead_tenantId_idx" ON "Lead"("tenantId");

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "Customer" customer
SET "tenantId" = org."tenantId"
FROM "Organization" org
WHERE customer."orgId" = org."id" AND customer."tenantId" IS NULL;
UPDATE "Customer" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "Customer" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Customer_tenantId_idx" ON "Customer"("tenantId");

ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "Application" app
SET "tenantId" = org."tenantId"
FROM "Organization" org
WHERE app."orgId" = org."id" AND app."tenantId" IS NULL;
UPDATE "Application" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "Application" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Application"
  ADD CONSTRAINT "Application_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Application_tenantId_idx" ON "Application"("tenantId");

ALTER TABLE "ApprovalRecord" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "ApprovalRecord" approval
SET "tenantId" = app."tenantId"
FROM "Application" app
WHERE approval."applicationId" = app."id" AND approval."tenantId" IS NULL;
UPDATE "ApprovalRecord" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "ApprovalRecord" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ApprovalRecord"
  ADD CONSTRAINT "ApprovalRecord_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "ApprovalRecord_tenantId_idx" ON "ApprovalRecord"("tenantId");

ALTER TABLE "SignRecord" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "SignRecord" sign_record
SET "tenantId" = app."tenantId"
FROM "Application" app
WHERE sign_record."applicationId" = app."id" AND sign_record."tenantId" IS NULL;
UPDATE "SignRecord" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "SignRecord" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "SignRecord"
  ADD CONSTRAINT "SignRecord_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "SignRecord_tenantId_idx" ON "SignRecord"("tenantId");

ALTER TABLE "Disbursement" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "Disbursement" disbursement
SET "tenantId" = app."tenantId"
FROM "Application" app
WHERE disbursement."applicationId" = app."id" AND disbursement."tenantId" IS NULL;
UPDATE "Disbursement" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "Disbursement" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Disbursement"
  ADD CONSTRAINT "Disbursement_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Disbursement_tenantId_idx" ON "Disbursement"("tenantId");

ALTER TABLE "RepaymentPlan" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "RepaymentPlan" plan
SET "tenantId" = app."tenantId"
FROM "Application" app
WHERE plan."applicationId" = app."id" AND plan."tenantId" IS NULL;
UPDATE "RepaymentPlan" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "RepaymentPlan" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RepaymentPlan"
  ADD CONSTRAINT "RepaymentPlan_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "RepaymentPlan_tenantId_idx" ON "RepaymentPlan"("tenantId");

ALTER TABLE "RepaymentRecord" ADD COLUMN IF NOT EXISTS "tenantId" INTEGER;
UPDATE "RepaymentRecord" record
SET "tenantId" = plan."tenantId"
FROM "RepaymentPlan" plan
WHERE record."planId" = plan."id" AND record."tenantId" IS NULL;
UPDATE "RepaymentRecord" SET "tenantId" = 1 WHERE "tenantId" IS NULL;
ALTER TABLE "RepaymentRecord" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "RepaymentRecord"
  ADD CONSTRAINT "RepaymentRecord_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "RepaymentRecord_tenantId_idx" ON "RepaymentRecord"("tenantId");
