-- 角色级移动端模块配置
ALTER TABLE "Role" ADD COLUMN "mobileModules" JSONB;
ALTER TABLE "Role" ADD COLUMN "mobileMultiModule" BOOLEAN NOT NULL DEFAULT false;

-- 用户级移动端模块配置
ALTER TABLE "User" ADD COLUMN "mobileModules" JSONB;
ALTER TABLE "User" ADD COLUMN "mobileMultiModule" BOOLEAN NOT NULL DEFAULT false;
