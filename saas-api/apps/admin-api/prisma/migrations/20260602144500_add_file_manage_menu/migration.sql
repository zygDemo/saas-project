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
  "updatedAt"
)
SELECT
  tenant."id",
  system_menu."id",
  'file',
  'FileManage',
  '/system/file',
  '文件管理',
  'ri:file-list-3-line',
  46,
  TRUE,
  FALSE,
  FALSE,
  CURRENT_TIMESTAMP
FROM "Tenant" tenant
JOIN "Menu" system_menu
  ON system_menu."tenantId" = tenant."id"
 AND system_menu."name" = 'System'
ON CONFLICT ("tenantId", "name") DO UPDATE
SET "parentId" = EXCLUDED."parentId",
    "path" = EXCLUDED."path",
    "component" = EXCLUDED."component",
    "title" = EXCLUDED."title",
    "icon" = EXCLUDED."icon",
    "sort" = EXCLUDED."sort",
    "keepAlive" = EXCLUDED."keepAlive",
    "hidden" = EXCLUDED."hidden",
    "hiddenTab" = EXCLUDED."hiddenTab",
    "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "Menu"
SET "sort" = CASE "name"
    WHEN 'FileConfig' THEN 47
    WHEN 'MsgTemplate' THEN 48
    WHEN 'SysParam' THEN 49
    WHEN 'Notice' THEN 50
    WHEN 'UserCenter' THEN 51
    ELSE "sort"
  END,
  "component" = CASE
    WHEN "name" = 'FileConfig' THEN '/system/file-config'
    ELSE "component"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN ('FileConfig', 'MsgTemplate', 'SysParam', 'Notice', 'UserCenter');

INSERT INTO "RoleMenu" ("roleId", "menuId")
SELECT role."id", file_menu."id"
FROM "Role" role
JOIN "Menu" file_menu
  ON file_menu."tenantId" = role."tenantId"
 AND file_menu."name" = 'FileManage'
WHERE role."code" IN ('R_SUPER', 'R_ADMIN')
ON CONFLICT ("roleId", "menuId") DO NOTHING;

INSERT INTO "Permission" ("tenantId", "menuId", "title", "authMark", "updatedAt")
SELECT file_menu."tenantId", file_menu."id", permission_mark."title", permission_mark."authMark", CURRENT_TIMESTAMP
FROM "Menu" file_menu
CROSS JOIN (
  VALUES
    ('Add', 'add'),
    ('Edit', 'edit'),
    ('Delete', 'delete')
) AS permission_mark("title", "authMark")
WHERE file_menu."name" = 'FileManage'
ON CONFLICT ("tenantId", "menuId", "authMark") DO UPDATE
SET "title" = EXCLUDED."title",
    "updatedAt" = CURRENT_TIMESTAMP;
