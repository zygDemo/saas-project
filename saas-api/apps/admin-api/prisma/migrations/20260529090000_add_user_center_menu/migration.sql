-- Add personal center as a hidden menu route for every tenant.
INSERT INTO "Menu" (
  "tenantId",
  "parentId",
  "path",
  "name",
  "component",
  "title",
  "icon",
  "sort",
  "keepAlive",
  "hidden",
  "hiddenTab",
  "createdAt",
  "updatedAt"
)
SELECT
  tenant."id",
  system_menu."id",
  'user-center',
  'UserCenter',
  '/system/user-center',
  'menus.system.userCenter',
  'ri:user-line',
  24,
  true,
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Tenant" tenant
JOIN "Menu" system_menu
  ON system_menu."tenantId" = tenant."id"
 AND system_menu."name" = 'System'
WHERE NOT EXISTS (
  SELECT 1
  FROM "Menu" existed
  WHERE existed."tenantId" = tenant."id"
    AND existed."name" = 'UserCenter'
);

-- Grant the hidden route to all existing roles in the same tenant.
INSERT INTO "RoleMenu" ("roleId", "menuId")
SELECT role."id", user_center."id"
FROM "Role" role
JOIN "Menu" user_center
  ON user_center."tenantId" = role."tenantId"
 AND user_center."name" = 'UserCenter'
WHERE role."code" IN ('R_SUPER', 'R_ADMIN', 'R_USER')
ON CONFLICT ("roleId", "menuId") DO NOTHING;
