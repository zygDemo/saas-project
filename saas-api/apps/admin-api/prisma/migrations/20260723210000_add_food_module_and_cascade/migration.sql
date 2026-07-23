-- 点餐(Food)模块建表 + tenant 级联删除
-- 原因：历史迁移未创建 Food 表，导致 tenant 级联迁移因表不存在失败。
-- 本迁移先 IF NOT EXISTS 建表，再统一为 tenant 外键设置 ON DELETE CASCADE。

-- ==================== FoodCategory ====================
CREATE TABLE IF NOT EXISTS "FoodCategory" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(50) NOT NULL,
  "icon" VARCHAR(100),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "tenantId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodCategory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FoodCategory_tenantId_idx" ON "FoodCategory"("tenantId");

ALTER TABLE "FoodCategory" DROP CONSTRAINT IF EXISTS "FoodCategory_tenantId_fkey";
ALTER TABLE "FoodCategory" ADD CONSTRAINT "FoodCategory_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==================== FoodDish ====================
CREATE TABLE IF NOT EXISTS "FoodDish" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500),
  "price" DECIMAL(10,2) NOT NULL,
  "originalPrice" DECIMAL(10,2),
  "imageUrl" VARCHAR(500),
  "categoryId" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "salesCount" INTEGER NOT NULL DEFAULT 0,
  "tenantId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodDish_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FoodDish_tenantId_idx" ON "FoodDish"("tenantId");
CREATE INDEX IF NOT EXISTS "FoodDish_categoryId_idx" ON "FoodDish"("categoryId");

ALTER TABLE "FoodDish" DROP CONSTRAINT IF EXISTS "FoodDish_tenantId_fkey";
ALTER TABLE "FoodDish" ADD CONSTRAINT "FoodDish_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FoodDish" DROP CONSTRAINT IF EXISTS "FoodDish_categoryId_fkey";
ALTER TABLE "FoodDish" ADD CONSTRAINT "FoodDish_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "FoodCategory"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- ==================== FoodOrder ====================
CREATE TABLE IF NOT EXISTS "FoodOrder" (
  "id" SERIAL NOT NULL,
  "orderNo" VARCHAR(32) NOT NULL,
  "status" INTEGER NOT NULL DEFAULT 1,
  "totalPrice" DECIMAL(10,2) NOT NULL,
  "remark" VARCHAR(500),
  "userId" INTEGER NOT NULL,
  "tenantId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FoodOrder_orderNo_key" ON "FoodOrder"("orderNo");
CREATE INDEX IF NOT EXISTS "FoodOrder_tenantId_idx" ON "FoodOrder"("tenantId");
CREATE INDEX IF NOT EXISTS "FoodOrder_userId_idx" ON "FoodOrder"("userId");
CREATE INDEX IF NOT EXISTS "FoodOrder_orderNo_idx" ON "FoodOrder"("orderNo");

ALTER TABLE "FoodOrder" DROP CONSTRAINT IF EXISTS "FoodOrder_tenantId_fkey";
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FoodOrder" DROP CONSTRAINT IF EXISTS "FoodOrder_userId_fkey";
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- ==================== FoodOrderItem ====================
CREATE TABLE IF NOT EXISTS "FoodOrderItem" (
  "id" SERIAL NOT NULL,
  "orderId" INTEGER NOT NULL,
  "dishId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "price" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FoodOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FoodOrderItem_orderId_idx" ON "FoodOrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "FoodOrderItem_dishId_idx" ON "FoodOrderItem"("dishId");

ALTER TABLE "FoodOrderItem" DROP CONSTRAINT IF EXISTS "FoodOrderItem_orderId_fkey";
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "FoodOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FoodOrderItem" DROP CONSTRAINT IF EXISTS "FoodOrderItem_dishId_fkey";
ALTER TABLE "FoodOrderItem" ADD CONSTRAINT "FoodOrderItem_dishId_fkey"
  FOREIGN KEY ("dishId") REFERENCES "FoodDish"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- ==================== FoodCart ====================
CREATE TABLE IF NOT EXISTS "FoodCart" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "dishId" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "tenantId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FoodCart_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FoodCart_userId_dishId_key" ON "FoodCart"("userId", "dishId");
CREATE INDEX IF NOT EXISTS "FoodCart_tenantId_idx" ON "FoodCart"("tenantId");

ALTER TABLE "FoodCart" DROP CONSTRAINT IF EXISTS "FoodCart_tenantId_fkey";
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FoodCart" DROP CONSTRAINT IF EXISTS "FoodCart_userId_fkey";
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "FoodCart" DROP CONSTRAINT IF EXISTS "FoodCart_dishId_fkey";
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_dishId_fkey"
  FOREIGN KEY ("dishId") REFERENCES "FoodDish"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
