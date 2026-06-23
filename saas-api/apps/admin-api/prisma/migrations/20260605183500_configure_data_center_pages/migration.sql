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
