-- Simplify business sidebar to the six major order phases.
UPDATE "Menu" AS m
SET "hidden" = TRUE
FROM "Menu" AS parent
WHERE m."tenantId" = parent."tenantId"
  AND m."parentId" = parent."id"
  AND parent."name" = 'Business'
  AND m."name" NOT IN (
    'BusinessPrecheck',
    'BusinessSupplement',
    'BusinessRiskApproval',
    'BusinessFunderFinal',
    'BusinessSigning',
    'BusinessDisbursement'
  );

WITH business AS (
  SELECT "tenantId", "id" AS "parentId"
  FROM "Menu"
  WHERE "name" = 'Business'
),
phase_menus("path", "name", "title", "icon", "sort") AS (
  VALUES
    ('precheck', 'BusinessPrecheck', '预审阶段', 'ri:file-search-line', 61),
    ('supplement', 'BusinessSupplement', '补件阶段', 'ri:folder-upload-line', 62),
    ('risk-approval', 'BusinessRiskApproval', '风控审批', 'ri:shield-check-line', 63),
    ('funder-final', 'BusinessFunderFinal', '资方终审', 'ri:bank-line', 64),
    ('signing', 'BusinessSigning', '客户签约', 'ri:contract-line', 65),
    ('disbursement', 'BusinessDisbursement', '请款放款', 'ri:money-cny-circle-line', 66)
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
  phase_menus."path",
  phase_menus."name",
  '/business/common-list',
  phase_menus."title",
  phase_menus."icon",
  phase_menus."sort",
  TRUE,
  FALSE,
  FALSE,
  FALSE,
  NOW(),
  NOW()
FROM business
CROSS JOIN phase_menus
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
