-- Make menu visibility and data-center routes match the current frontend.
WITH business AS (
  SELECT "tenantId", "id" AS "parentId"
  FROM "Menu"
  WHERE "name" = 'Business'
)
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
  "iframe",
  "createdAt",
  "updatedAt"
)
SELECT
  business."tenantId",
  business."parentId",
  'order-query',
  'BusinessOrderQuery',
  '/business/common-list',
  '综合查询',
  'ri:search-eye-line',
  67,
  TRUE,
  FALSE,
  FALSE,
  FALSE,
  NOW(),
  NOW()
FROM business
ON CONFLICT ("tenantId", "name") DO UPDATE SET
  "parentId" = EXCLUDED."parentId",
  "path" = EXCLUDED."path",
  "component" = EXCLUDED."component",
  "title" = EXCLUDED."title",
  "icon" = EXCLUDED."icon",
  "sort" = EXCLUDED."sort",
  "keepAlive" = TRUE,
  "hidden" = FALSE,
  "hiddenTab" = FALSE,
  "iframe" = FALSE,
  "updatedAt" = NOW();

WITH platform AS (
  SELECT "tenantId", "id" AS "parentId"
  FROM "Menu"
  WHERE "name" = 'Platform'
)
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
  "iframe",
  "createdAt",
  "updatedAt"
)
SELECT
  platform."tenantId",
  platform."parentId",
  'flow-config',
  'FlowConfig',
  '/business/flow-config',
  '流程与规则',
  'ri:git-branch-line',
  71,
  TRUE,
  FALSE,
  FALSE,
  FALSE,
  NOW(),
  NOW()
FROM platform
ON CONFLICT ("tenantId", "name") DO UPDATE SET
  "parentId" = EXCLUDED."parentId",
  "path" = EXCLUDED."path",
  "component" = EXCLUDED."component",
  "title" = EXCLUDED."title",
  "icon" = EXCLUDED."icon",
  "sort" = EXCLUDED."sort",
  "keepAlive" = TRUE,
  "hidden" = FALSE,
  "hiddenTab" = FALSE,
  "iframe" = FALSE,
  "updatedAt" = NOW();

UPDATE "Menu"
SET
  "component" = '/data-center/stats',
  "hidden" = FALSE,
  "hiddenTab" = FALSE,
  "updatedAt" = NOW()
WHERE "name" = 'DataStats';

UPDATE "Menu"
SET
  "component" = '/data-center/audit-log',
  "hidden" = FALSE,
  "hiddenTab" = FALSE,
  "updatedAt" = NOW()
WHERE "name" = 'AuditLog';

UPDATE "Menu" AS menu
SET
  "hidden" = FALSE,
  "hiddenTab" = FALSE,
  "updatedAt" = NOW()
WHERE menu."name" IN ('Business', 'BusinessOrderQuery', 'Platform', 'FlowConfig');

WITH target_menus AS (
  SELECT "id", "tenantId", "name"
  FROM "Menu"
  WHERE "name" IN ('Business', 'BusinessOrderQuery')
),
target_roles AS (
  SELECT "id" AS "roleId", "tenantId"
  FROM "Role"
  WHERE "code" IN (
    'R_SUPER',
    'R_ADMIN',
    'R_SALES_MANAGER',
    'R_SALES',
    'R_APPROVER',
    'R_FINANCE'
  )
)
INSERT INTO "RoleMenu" ("roleId", "menuId")
SELECT target_roles."roleId", target_menus."id"
FROM target_roles
JOIN target_menus ON target_menus."tenantId" = target_roles."tenantId"
ON CONFLICT DO NOTHING;

WITH target_menus AS (
  SELECT "id", "tenantId", "name"
  FROM "Menu"
  WHERE "name" IN ('Platform', 'FlowConfig')
),
target_roles AS (
  SELECT "id" AS "roleId", "tenantId"
  FROM "Role"
  WHERE "code" IN (
    'R_SUPER',
    'R_OPERATION',
    'R_ADMIN',
    'R_SALES_MANAGER'
  )
)
INSERT INTO "RoleMenu" ("roleId", "menuId")
SELECT target_roles."roleId", target_menus."id"
FROM target_roles
JOIN target_menus ON target_menus."tenantId" = target_roles."tenantId"
ON CONFLICT DO NOTHING;
