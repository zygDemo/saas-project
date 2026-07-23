-- Food 系列 tenant 关系补 onDelete: Cascade
-- 与项目其他多租户模型（Customer/Product/Lead 等）保持一致
-- 当租户被删除时，级联删除该租户下的 Food 相关数据

ALTER TABLE "FoodCategory" DROP CONSTRAINT IF EXISTS "FoodCategory_tenantId_fkey";
ALTER TABLE "FoodCategory" ADD CONSTRAINT "FoodCategory_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

ALTER TABLE "FoodDish" DROP CONSTRAINT IF EXISTS "FoodDish_tenantId_fkey";
ALTER TABLE "FoodDish" ADD CONSTRAINT "FoodDish_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

ALTER TABLE "FoodOrder" DROP CONSTRAINT IF EXISTS "FoodOrder_tenantId_fkey";
ALTER TABLE "FoodOrder" ADD CONSTRAINT "FoodOrder_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;

ALTER TABLE "FoodCart" DROP CONSTRAINT IF EXISTS "FoodCart_tenantId_fkey";
ALTER TABLE "FoodCart" ADD CONSTRAINT "FoodCart_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE;
