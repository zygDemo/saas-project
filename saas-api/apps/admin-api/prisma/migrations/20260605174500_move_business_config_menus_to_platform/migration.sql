-- Move configuration-oriented menus out of Business and into Platform.
WITH target_parent AS (
  SELECT "tenantId", "id" AS "parentId"
  FROM "Menu"
  WHERE "name" = 'Platform'
  UNION ALL
  SELECT s."tenantId", s."id" AS "parentId"
  FROM "Menu" s
  WHERE s."name" = 'System'
    AND NOT EXISTS (
      SELECT 1
      FROM "Menu" p
      WHERE p."tenantId" = s."tenantId"
        AND p."name" = 'Platform'
    )
)
UPDATE "Menu" AS m
SET
  "parentId" = target_parent."parentId",
  "hidden" = FALSE,
  "hiddenTab" = FALSE,
  "updatedAt" = NOW()
FROM target_parent
WHERE m."tenantId" = target_parent."tenantId"
  AND m."name" IN ('Org', 'Dept', 'Product', 'Funder', 'FlowConfig', 'OrgConfig');

-- Keep paths/components aligned after moving under Platform/System.
UPDATE "Menu"
SET
  "path" = CASE "name"
    WHEN 'Org' THEN 'org'
    WHEN 'Dept' THEN 'dept'
    WHEN 'Product' THEN 'product'
    WHEN 'Funder' THEN 'funder'
    WHEN 'FlowConfig' THEN 'flow-config'
    WHEN 'OrgConfig' THEN 'org-config'
    ELSE "path"
  END,
  "component" = CASE "name"
    WHEN 'FlowConfig' THEN '/business/flow-config'
    ELSE '/business/common-list'
  END,
  "sort" = CASE "name"
    WHEN 'Org' THEN 67
    WHEN 'Dept' THEN 68
    WHEN 'Product' THEN 69
    WHEN 'Funder' THEN 70
    WHEN 'FlowConfig' THEN 71
    WHEN 'OrgConfig' THEN 72
    ELSE "sort"
  END,
  "updatedAt" = NOW()
WHERE "name" IN ('Org', 'Dept', 'Product', 'Funder', 'FlowConfig', 'OrgConfig');

-- If a role can see a moved child menu, grant the new parent too so the tree can render it.
INSERT INTO "RoleMenu" ("roleId", "menuId")
SELECT DISTINCT rm."roleId", parent."id"
FROM "RoleMenu" rm
JOIN "Menu" child ON child."id" = rm."menuId"
JOIN "Menu" parent ON parent."tenantId" = child."tenantId"
  AND parent."id" = child."parentId"
WHERE child."name" IN ('Org', 'Dept', 'Product', 'Funder', 'FlowConfig', 'OrgConfig')
  AND NOT EXISTS (
    SELECT 1
    FROM "RoleMenu" existed
    WHERE existed."roleId" = rm."roleId"
      AND existed."menuId" = parent."id"
  );
