-- Add 综合查询 and restore 流程与规则 menu grants.
WITH business AS (
  SELECT "tenantId", "id" AS "parentId"
  FROM "Menu"
  WHERE "name" = 'Business'
),
upserted AS (
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
    "updatedAt" = NOW()
  RETURNING "id", "tenantId"
),
target_menu AS (
  SELECT "id", "tenantId" FROM upserted
  UNION
  SELECT "id", "tenantId"
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
SELECT target_roles."roleId", target_menu."id"
FROM target_roles
JOIN target_menu ON target_menu."tenantId" = target_roles."tenantId"
ON CONFLICT DO NOTHING;

INSERT INTO "Permission" ("tenantId", "menuId", "title", "authMark", "createdAt", "updatedAt")
SELECT
  target_menu."tenantId",
  target_menu."id",
  permission_def."title",
  permission_def."authMark",
  NOW(),
  NOW()
FROM (
  SELECT "id", "tenantId"
  FROM "Menu"
  WHERE "name" = 'BusinessOrderQuery'
) target_menu
CROSS JOIN (
  VALUES
    ('Add', 'add'),
    ('Edit', 'edit'),
    ('Delete', 'delete')
) AS permission_def("title", "authMark")
ON CONFLICT ("tenantId", "menuId", "authMark") DO UPDATE SET
  "title" = EXCLUDED."title",
  "updatedAt" = NOW();

WITH platform AS (
  SELECT "tenantId", "id" AS "parentId"
  FROM "Menu"
  WHERE "name" = 'Platform'
),
upserted_flow AS (
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
    "updatedAt" = NOW()
  RETURNING "id", "tenantId"
),
target_menus AS (
  SELECT "id", "tenantId" FROM upserted_flow
  UNION
  SELECT "id", "tenantId"
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

INSERT INTO "Permission" ("tenantId", "menuId", "title", "authMark", "createdAt", "updatedAt")
SELECT
  target_menu."tenantId",
  target_menu."id",
  permission_def."title",
  permission_def."authMark",
  NOW(),
  NOW()
FROM (
  SELECT "id", "tenantId"
  FROM "Menu"
  WHERE "name" = 'FlowConfig'
) target_menu
CROSS JOIN (
  VALUES
    ('Add', 'add'),
    ('Edit', 'edit'),
    ('Delete', 'delete')
) AS permission_def("title", "authMark")
ON CONFLICT ("tenantId", "menuId", "authMark") DO UPDATE SET
  "title" = EXCLUDED."title",
  "updatedAt" = NOW();
