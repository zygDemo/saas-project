UPDATE "Menu"
SET "component" = CASE "name"
    WHEN 'User' THEN '/system/user'
    WHEN 'Role' THEN '/system/role'
    WHEN 'Menus' THEN '/system/menu'
    ELSE "component"
  END,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "name" IN ('User', 'Role', 'Menus');
