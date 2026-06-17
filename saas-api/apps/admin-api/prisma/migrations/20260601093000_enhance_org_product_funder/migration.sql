-- Enhance product and funder configuration fields for PRD v1.3 base platform modules.
ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "applicableFunders" JSONB,
  ADD COLUMN IF NOT EXISTS "accessConditions" JSONB,
  ADD COLUMN IF NOT EXISTS "valuationDiscountRate" DECIMAL(5,4);

ALTER TABLE "Funder"
  ADD COLUMN IF NOT EXISTS "integrationMode" TEXT NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS "creditLimit" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "approvalRules" JSONB;
