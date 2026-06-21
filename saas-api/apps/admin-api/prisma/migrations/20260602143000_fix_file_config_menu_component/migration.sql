UPDATE "Menu"
SET "component" = '/system/file-config',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" = 'FileConfig'
  AND "path" = 'file-config';
