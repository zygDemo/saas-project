-- Add target column to announcements
ALTER TABLE "Announcement" ADD COLUMN IF NOT EXISTS "target" VARCHAR(100);

-- Create message template table
CREATE TABLE IF NOT EXISTS "MessageTemplate" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "channel" VARCHAR(30) NOT NULL DEFAULT 'SMS',
    "scene" VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    "title" VARCHAR(200),
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "remark" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "MessageTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MessageTemplate_tenantId_code_key" ON "MessageTemplate"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "MessageTemplate_tenantId_idx" ON "MessageTemplate"("tenantId");
CREATE INDEX IF NOT EXISTS "MessageTemplate_channel_idx" ON "MessageTemplate"("channel");
CREATE INDEX IF NOT EXISTS "MessageTemplate_scene_idx" ON "MessageTemplate"("scene");
CREATE INDEX IF NOT EXISTS "MessageTemplate_status_idx" ON "MessageTemplate"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessageTemplate_tenantId_fkey'
  ) THEN
    ALTER TABLE "MessageTemplate" ADD CONSTRAINT "MessageTemplate_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
