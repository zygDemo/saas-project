-- Add per-section supplement completion status flags.
ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "isSupplementCustomer" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isSupplementVehicle" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isSupplementOrder" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isSupplementFile" INTEGER DEFAULT 0;
