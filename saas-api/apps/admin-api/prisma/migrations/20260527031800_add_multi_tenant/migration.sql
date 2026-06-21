-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

-- Insert default tenant
INSERT INTO "Tenant" ("name", "code", "status", "createdAt", "updatedAt")
VALUES ('Default Tenant', 'default', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- User: add tenantId, migrate data, add constraints
ALTER TABLE "User" ADD COLUMN "tenantId" INTEGER;
UPDATE "User" SET "tenantId" = 1;
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX "User_userName_key";
DROP INDEX "User_email_key";
CREATE UNIQUE INDEX "User_tenantId_userName_key" ON "User"("tenantId", "userName");
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- Role: add tenantId, migrate data, add constraints
ALTER TABLE "Role" ADD COLUMN "tenantId" INTEGER;
UPDATE "Role" SET "tenantId" = 1;
ALTER TABLE "Role" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX "Role_code_key";
CREATE UNIQUE INDEX "Role_tenantId_code_key" ON "Role"("tenantId", "code");
CREATE INDEX "Role_tenantId_idx" ON "Role"("tenantId");

-- Menu: add tenantId, migrate data, add constraints
ALTER TABLE "Menu" ADD COLUMN "tenantId" INTEGER;
UPDATE "Menu" SET "tenantId" = 1;
ALTER TABLE "Menu" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX "Menu_name_key";
CREATE UNIQUE INDEX "Menu_tenantId_name_key" ON "Menu"("tenantId", "name");
CREATE INDEX "Menu_tenantId_idx" ON "Menu"("tenantId");

-- Permission: add tenantId, migrate data, add constraints
ALTER TABLE "Permission" ADD COLUMN "tenantId" INTEGER;
UPDATE "Permission" SET "tenantId" = 1;
ALTER TABLE "Permission" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX "Permission_menuId_authMark_key";
CREATE UNIQUE INDEX "Permission_tenantId_menuId_authMark_key" ON "Permission"("tenantId", "menuId", "authMark");
CREATE INDEX "Permission_tenantId_idx" ON "Permission"("tenantId");
