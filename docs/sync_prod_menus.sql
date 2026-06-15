-- Sync production roles, menus, role-menu grants, and button permissions.
-- Safe to rerun. It keeps existing Role ids and UserRole relations by upserting roles by code.

DO $sync$
DECLARE
  v_tenant_id integer;
  v_role_id integer;
  v_parent_id integer;
  v_menu_id integer;
  v_menu_name text;
  v_component text;
  v_keep_alive boolean;
  v_hidden boolean;
  v_hidden_tab boolean;
  v_auth_mark text;
  v_role_code text;
  v_menu_names jsonb;
  v_role jsonb;
  v_menu jsonb;
BEGIN
  SELECT id INTO v_tenant_id
  FROM "Tenant"
  WHERE code = 'default';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Default tenant(code=default) not found. Seed Tenant before syncing menus.';
  END IF;

  CREATE TEMP TABLE IF NOT EXISTS "_sync_menu_map" (
    name text PRIMARY KEY,
    id integer NOT NULL
  ) ON COMMIT DROP;
  TRUNCATE TABLE "_sync_menu_map";

  FOR v_role IN
    SELECT * FROM jsonb_array_elements($json$
      [
        {"code":"R_SUPER","name":"Super Admin","description":"平台超级管理员，全平台管理","dataScope":"ALL"},
        {"code":"R_OPERATION","name":"Platform Operator","description":"平台运营","dataScope":"ALL"},
        {"code":"R_ADMIN","name":"Admin","description":"机构管理员","dataScope":"ALL"},
        {"code":"R_SALES_MANAGER","name":"Sales Manager","description":"部门经理/团队负责人","dataScope":"DEPT"},
        {"code":"R_SALES","name":"Sales","description":"业务员/客户经理","dataScope":"SELF"},
        {"code":"R_APPROVER","name":"Approver","description":"风控审批员","dataScope":"ALL"},
        {"code":"R_FINANCE","name":"Finance","description":"财务人员","dataScope":"ALL"},
        {"code":"R_CS_COLLECTION","name":"CS & Collection","description":"客服/催收","dataScope":"ALL"},
        {"code":"R_USER","name":"User","description":"普通用户，仅移动端操作权限","dataScope":"SELF"}
      ]
    $json$::jsonb)
  LOOP
    INSERT INTO "Role" (name, code, description, enabled, "tenantId", "dataScope", "createdAt", "updatedAt")
    VALUES (
      v_role->>'name',
      v_role->>'code',
      v_role->>'description',
      true,
      v_tenant_id,
      v_role->>'dataScope',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("tenantId", code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      enabled = true,
      "dataScope" = EXCLUDED."dataScope",
      "updatedAt" = CURRENT_TIMESTAMP;
  END LOOP;

  FOR v_menu IN
    SELECT * FROM jsonb_array_elements($json$
      [
        {"path":"/dashboard","name":"Dashboard","component":"/index/index","title":"仪表盘","icon":"ri:dashboard-line","sort":10},
        {"parentKey":"Dashboard","path":"console","name":"Console","component":"/dashboard/console","title":"工作台","icon":"ri:computer-line","sort":11,"keepAlive":true},
        {"parentKey":"Dashboard","path":"analysis","name":"Analysis","component":"/dashboard/analysis","title":"分析页","icon":"ri:line-chart-line","sort":12,"keepAlive":true},
        {"path":"/platform","name":"Platform","title":"平台管理","icon":"ri:global-line","sort":20},
        {"parentKey":"Platform","path":"tenant","name":"TenantMgmt","title":"租户机构管理","icon":"ri:building-2-line","sort":21,"keepAlive":true},
        {"parentKey":"Platform","path":"package-billing","name":"PackageBilling","title":"套餐与计费","icon":"ri:money-dollar-circle-line","sort":22,"keepAlive":true},
        {"parentKey":"Platform","path":"product-template","name":"ProductTemplate","title":"产品与资方模板","icon":"ri:file-copy-line","sort":23,"keepAlive":true},
        {"parentKey":"Platform","path":"supervision","name":"PlatformSupervision","title":"平台业务监管","icon":"ri:eye-line","sort":24,"keepAlive":true},
        {"parentKey":"Platform","path":"third-party","name":"ThirdPartyService","title":"第三方服务管理","icon":"ri:plug-line","sort":25,"keepAlive":true},
        {"parentKey":"Platform","path":"work-order","name":"WorkOrder","title":"运营工单中心","icon":"ri:customer-service-2-line","sort":26,"keepAlive":true},
        {"path":"/datacenter","name":"DataCenter","title":"数据中心","icon":"ri:bar-chart-box-line","sort":30},
        {"parentKey":"DataCenter","path":"stats","name":"DataStats","title":"数据统计","icon":"ri:bar-chart-line","sort":31,"keepAlive":true},
        {"parentKey":"DataCenter","path":"audit-log","name":"AuditLog","title":"日志审计","icon":"ri:file-list-3-line","sort":32,"keepAlive":true},
        {"path":"/system","name":"System","title":"系统管理","icon":"ri:settings-3-line","sort":40},
        {"parentKey":"System","path":"user","name":"User","component":"/system/user","title":"用户管理","icon":"ri:user-line","sort":41,"keepAlive":true},
        {"parentKey":"System","path":"role","name":"Role","component":"/system/role","title":"角色管理","icon":"ri:user-settings-line","sort":42,"keepAlive":true},
        {"parentKey":"System","path":"menu","name":"Menus","component":"/system/menu","title":"菜单管理","icon":"ri:menu-line","sort":43,"keepAlive":true},
        {"parentKey":"System","path":"dict","name":"DictMgmt","component":"/system/dict","title":"字典管理","icon":"ri:book-open-line","sort":44,"keepAlive":true},
        {"parentKey":"System","path":"region","name":"RegionMgmt","title":"地区管理","icon":"ri:map-pin-line","sort":45,"keepAlive":true},
        {"parentKey":"System","path":"file","name":"FileManage","component":"/system/file","title":"文件管理","icon":"ri:file-list-3-line","sort":46,"keepAlive":true},
        {"parentKey":"System","path":"file-config","name":"FileConfig","component":"/system/file-config","title":"文件存储配置","icon":"ri:hard-drive-2-line","sort":47,"keepAlive":true},
        {"parentKey":"System","path":"msg-template","name":"MsgTemplate","title":"消息模板","icon":"ri:mail-send-line","sort":48,"keepAlive":true},
        {"parentKey":"System","path":"sys-param","name":"SysParam","title":"系统参数","icon":"ri:settings-line","sort":49,"keepAlive":true},
        {"parentKey":"System","path":"notice","name":"Notice","title":"公告管理","icon":"ri:notification-line","sort":50,"keepAlive":true},
        {"parentKey":"System","path":"user-center","name":"UserCenter","title":"用户中心","icon":"ri:user-line","sort":51,"keepAlive":true,"hidden":true,"hiddenTab":true},
        {"path":"/business","name":"Business","title":"业务管理","icon":"ri:briefcase-line","sort":60},
        {"parentKey":"Business","path":"precheck","name":"BusinessPrecheck","title":"预审阶段","icon":"ri:file-search-line","sort":61,"keepAlive":true},
        {"parentKey":"Business","path":"supplement","name":"BusinessSupplement","title":"补件阶段","icon":"ri:folder-upload-line","sort":62,"keepAlive":true},
        {"parentKey":"Business","path":"risk-approval","name":"BusinessRiskApproval","title":"风控审批","icon":"ri:shield-check-line","sort":63,"keepAlive":true},
        {"parentKey":"Business","path":"funder-final","name":"BusinessFunderFinal","title":"资方终审","icon":"ri:bank-line","sort":64,"keepAlive":true},
        {"parentKey":"Business","path":"signing","name":"BusinessSigning","title":"客户签约","icon":"ri:contract-line","sort":65,"keepAlive":true},
        {"parentKey":"Business","path":"disbursement","name":"BusinessDisbursement","title":"请款放款","icon":"ri:money-cny-circle-line","sort":66,"keepAlive":true}
      ]
    $json$::jsonb)
  LOOP
    v_parent_id := NULL;
    IF v_menu ? 'parentKey' THEN
      SELECT id INTO v_parent_id FROM "_sync_menu_map" WHERE name = v_menu->>'parentKey';
      IF v_parent_id IS NULL THEN
        SELECT id INTO v_parent_id FROM "Menu" WHERE "tenantId" = v_tenant_id AND name = v_menu->>'parentKey';
      END IF;
    END IF;

    v_component := COALESCE(v_menu->>'component', CASE WHEN v_parent_id IS NULL THEN '/index/index' ELSE '/business/common-list' END);
    v_keep_alive := COALESCE((v_menu->>'keepAlive')::boolean, false);
    v_hidden := COALESCE((v_menu->>'hidden')::boolean, false);
    v_hidden_tab := COALESCE((v_menu->>'hiddenTab')::boolean, false);

    INSERT INTO "Menu" (
      "tenantId", "parentId", path, name, component, title, icon, sort,
      "keepAlive", hidden, "hiddenTab", link, iframe, "createdAt", "updatedAt"
    )
    VALUES (
      v_tenant_id,
      v_parent_id,
      v_menu->>'path',
      v_menu->>'name',
      v_component,
      v_menu->>'title',
      v_menu->>'icon',
      (v_menu->>'sort')::integer,
      v_keep_alive,
      v_hidden,
      v_hidden_tab,
      NULL,
      false,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("tenantId", name) DO UPDATE SET
      "parentId" = EXCLUDED."parentId",
      path = EXCLUDED.path,
      component = EXCLUDED.component,
      title = EXCLUDED.title,
      icon = EXCLUDED.icon,
      sort = EXCLUDED.sort,
      "keepAlive" = EXCLUDED."keepAlive",
      hidden = EXCLUDED.hidden,
      "hiddenTab" = EXCLUDED."hiddenTab",
      link = EXCLUDED.link,
      iframe = EXCLUDED.iframe,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING id INTO v_menu_id;

    INSERT INTO "_sync_menu_map" (name, id)
    VALUES (v_menu->>'name', v_menu_id)
    ON CONFLICT (name) DO UPDATE SET id = EXCLUDED.id;
  END LOOP;

  FOR v_role_code, v_menu_names IN
    SELECT key, value FROM jsonb_each($json$
      {
        "R_SUPER": ["*"],
        "R_OPERATION": ["Dashboard","Console","Analysis","Platform","TenantMgmt","PackageBilling","ProductTemplate","PlatformSupervision","ThirdPartyService","WorkOrder","DataCenter","DataStats","AuditLog","Notice","WorkOrder"],
        "R_ADMIN": ["Dashboard","Console","Analysis","System","User","Role","Menus","FileManage","UserCenter","Business","BusinessPrecheck","BusinessSupplement","BusinessRiskApproval","BusinessFunderFinal","BusinessSigning","BusinessDisbursement"],
        "R_SALES_MANAGER": ["Dashboard","Console","Analysis","Business","BusinessPrecheck","BusinessSupplement","BusinessFunderFinal","BusinessSigning","BusinessDisbursement"],
        "R_SALES": ["Dashboard","Console","Analysis","Business","BusinessPrecheck","BusinessSupplement","BusinessFunderFinal","BusinessSigning"],
        "R_APPROVER": ["Dashboard","Console","Analysis","Business","BusinessPrecheck","BusinessSupplement","BusinessRiskApproval","BusinessFunderFinal","BusinessSigning"],
        "R_FINANCE": ["Dashboard","Console","Analysis","Business","BusinessPrecheck","BusinessSupplement","BusinessFunderFinal","BusinessSigning","BusinessDisbursement"],
        "R_CS_COLLECTION": ["Dashboard","Console","Analysis"],
        "R_USER": ["Dashboard","Console","Analysis"]
      }
    $json$::jsonb)
  LOOP
    SELECT id INTO v_role_id
    FROM "Role"
    WHERE "tenantId" = v_tenant_id AND code = v_role_code;

    IF v_role_id IS NULL THEN
      CONTINUE;
    END IF;

    DELETE FROM "RoleMenu" WHERE "roleId" = v_role_id;

    IF v_menu_names = '["*"]'::jsonb THEN
      INSERT INTO "RoleMenu" ("roleId", "menuId")
      SELECT v_role_id, id FROM "_sync_menu_map"
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO "RoleMenu" ("roleId", "menuId")
      SELECT DISTINCT v_role_id, m.id
      FROM jsonb_array_elements_text(v_menu_names) AS menu_name(name)
      JOIN "_sync_menu_map" m ON m.name = menu_name.name
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  FOREACH v_menu_name IN ARRAY ARRAY[
    'TenantMgmt','PackageBilling','ProductTemplate','PlatformSupervision','ThirdPartyService','WorkOrder',
    'DataStats','AuditLog','BusinessPrecheck','BusinessSupplement','BusinessRiskApproval',
    'BusinessFunderFinal','BusinessSigning','BusinessDisbursement',
    'Menus','DictMgmt','RegionMgmt','FileManage','MsgTemplate','Notice'
  ]
  LOOP
    SELECT id INTO v_menu_id FROM "_sync_menu_map" WHERE name = v_menu_name;
    IF v_menu_id IS NULL THEN
      CONTINUE;
    END IF;

    FOREACH v_auth_mark IN ARRAY ARRAY['add','edit','delete']
    LOOP
      INSERT INTO "Permission" ("tenantId", "menuId", title, "authMark", "createdAt", "updatedAt")
      VALUES (
        v_tenant_id,
        v_menu_id,
        upper(left(v_auth_mark, 1)) || substring(v_auth_mark from 2),
        v_auth_mark,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("tenantId", "menuId", "authMark") DO UPDATE SET
        title = EXCLUDED.title,
        "updatedAt" = CURRENT_TIMESTAMP;
    END LOOP;
  END LOOP;

  SELECT id INTO v_parent_id
  FROM "Menu"
  WHERE "tenantId" = v_tenant_id AND name = 'Business';

  IF v_parent_id IS NOT NULL THEN
    UPDATE "Menu"
    SET hidden = true,
        "hiddenTab" = true,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "tenantId" = v_tenant_id
      AND "parentId" = v_parent_id
      AND name NOT IN (
        'BusinessPrecheck',
        'BusinessSupplement',
        'BusinessRiskApproval',
        'BusinessFunderFinal',
        'BusinessSigning',
        'BusinessDisbursement'
      );

    UPDATE "Menu"
    SET hidden = false,
        "hiddenTab" = false,
        sort = CASE name
          WHEN 'BusinessPrecheck' THEN 61
          WHEN 'BusinessSupplement' THEN 62
          WHEN 'BusinessRiskApproval' THEN 63
          WHEN 'BusinessFunderFinal' THEN 64
          WHEN 'BusinessSigning' THEN 65
          WHEN 'BusinessDisbursement' THEN 66
          ELSE sort
        END,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "tenantId" = v_tenant_id
      AND "parentId" = v_parent_id
      AND name IN (
        'BusinessPrecheck',
        'BusinessSupplement',
        'BusinessRiskApproval',
        'BusinessFunderFinal',
        'BusinessSigning',
        'BusinessDisbursement'
      );

    DELETE FROM "RoleMenu" rm
    USING "Menu" m, "Role" r
    WHERE rm."menuId" = m.id
      AND rm."roleId" = r.id
      AND r."tenantId" = v_tenant_id
      AND m."tenantId" = v_tenant_id
      AND m."parentId" = v_parent_id
      AND m.name NOT IN (
        'BusinessPrecheck',
        'BusinessSupplement',
        'BusinessRiskApproval',
        'BusinessFunderFinal',
        'BusinessSigning',
        'BusinessDisbursement'
      );
  END IF;
END
$sync$;
