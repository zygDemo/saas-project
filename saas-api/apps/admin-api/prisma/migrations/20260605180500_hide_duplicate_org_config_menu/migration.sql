-- Keep a single organization entry. "Org" is the canonical management menu.
UPDATE "Menu"
SET
  "hidden" = TRUE,
  "hiddenTab" = TRUE,
  "updatedAt" = NOW()
WHERE "name" = 'OrgConfig';
