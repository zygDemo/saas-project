WITH default_nodes AS (
  SELECT *
  FROM (
    VALUES
      (1100, '预审进件-身份证信息', '身份证信息', 1, true, false, false, '{"nodeCode":1100,"phaseCode":1000,"phaseName":"预审进件","sort":1100,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":10,"toNode":1200}]}'::jsonb),
      (1200, '预审进件-车辆信息', '车辆信息', 1, true, false, false, '{"nodeCode":1200,"phaseCode":1000,"phaseName":"预审进件","sort":1200,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":10,"toNode":1300}]}'::jsonb),
      (1300, '预审进件-申请信息', '申请信息', 1, true, false, false, '{"nodeCode":1300,"phaseCode":1000,"phaseName":"预审进件","sort":1300,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":10,"toNode":1400}]}'::jsonb),
      (1400, '预审进件-签署授权书', '签署授权书', 1, true, false, false, '{"nodeCode":1400,"phaseCode":1000,"phaseName":"预审进件","sort":1400,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":10,"toNode":2000}]}'::jsonb),
      (2000, '风控模型预审-风控模型预审', '风控模型预审', 1, false, false, true, '{"nodeCode":2000,"phaseCode":2000,"phaseName":"风控模型预审","sort":2000,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":20,"toNode":3000}]}'::jsonb),
      (3000, '资方预审-资方预审', '资方预审', 1, false, true, false, '{"nodeCode":3000,"phaseCode":3000,"phaseName":"资方预审","sort":3000,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":20,"toNode":4000}]}'::jsonb),
      (4000, '资料补充-资料补充', '资料补充', 1, true, false, false, '{"nodeCode":4000,"phaseCode":4000,"phaseName":"资料补充","sort":4000,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":10,"toNode":5000,"condition":"REQUIRED_TASKS_COMPLETED"}]}'::jsonb),
      (4100, '资料补充-客户资料', '客户资料', 1, true, false, false, '{"nodeCode":4100,"phaseCode":4000,"phaseName":"资料补充","sort":4100,"parentNode":4000,"parallel":true,"required":true,"initialStatus":0,"transitions":[]}'::jsonb),
      (4200, '资料补充-车辆资料', '车辆资料', 1, true, false, false, '{"nodeCode":4200,"phaseCode":4000,"phaseName":"资料补充","sort":4200,"parentNode":4000,"parallel":true,"required":true,"initialStatus":0,"transitions":[]}'::jsonb),
      (4300, '资料补充-订单信息', '订单信息', 1, true, false, false, '{"nodeCode":4300,"phaseCode":4000,"phaseName":"资料补充","sort":4300,"parentNode":4000,"parallel":true,"required":true,"initialStatus":0,"transitions":[]}'::jsonb),
      (4400, '资料补充-文件信息', '文件信息', 1, true, false, false, '{"nodeCode":4400,"phaseCode":4000,"phaseName":"资料补充","sort":4400,"parentNode":4000,"parallel":true,"required":true,"initialStatus":0,"transitions":[]}'::jsonb),
      (5000, '风控初审-风控初审', '风控初审', 1, false, true, false, '{"nodeCode":5000,"phaseCode":5000,"phaseName":"风控初审","sort":5000,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":20,"toNode":6000}]}'::jsonb),
      (6000, '风控终审-风控终审', '风控终审', 2, false, true, false, '{"nodeCode":6000,"phaseCode":6000,"phaseName":"风控终审","sort":6000,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":20,"toNode":7000}]}'::jsonb),
      (7000, '请款资料-请款资料', '请款资料', 1, true, false, false, '{"nodeCode":7000,"phaseCode":7000,"phaseName":"请款资料","sort":7000,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":10,"toNode":8000}]}'::jsonb),
      (8000, '资方终审-资方终审', '资方终审', 1, false, true, false, '{"nodeCode":8000,"phaseCode":8000,"phaseName":"资方终审","sort":8000,"parallel":false,"required":false,"initialStatus":10,"transitions":[{"action":20,"toNode":9000}]}'::jsonb),
      (9000, '资方放款-资方放款', '资方放款', 1, false, false, false, '{"nodeCode":9000,"phaseCode":9000,"phaseName":"资方放款","sort":9000,"parallel":false,"required":false,"initialStatus":10,"transitions":[]}'::jsonb)
  ) AS node(
    "nodeCode",
    "name",
    "nodeName",
    "approveLevel",
    "requireMaterials",
    "requireApproval",
    "autoPass",
    "ruleConfig"
  )
)
INSERT INTO "FlowConfig" (
  "tenantId",
  "orgId",
  "name",
  "businessType",
  "nodeCode",
  "nodeName",
  "approveLevel",
  "requireMaterials",
  "requireApproval",
  "autoPass",
  "ruleConfig",
  "status",
  "createdAt",
  "updatedAt"
)
SELECT
  org."tenantId",
  org."id",
  node."name",
  'CAR_LOAN',
  node."nodeCode"::text,
  node."nodeName",
  node."approveLevel",
  node."requireMaterials",
  node."requireApproval",
  node."autoPass",
  node."ruleConfig",
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Organization" org
CROSS JOIN default_nodes node
ON CONFLICT ("orgId", "businessType", "nodeCode") DO UPDATE SET
  "name" = EXCLUDED."name",
  "nodeName" = EXCLUDED."nodeName",
  "approveLevel" = EXCLUDED."approveLevel",
  "requireMaterials" = EXCLUDED."requireMaterials",
  "requireApproval" = EXCLUDED."requireApproval",
  "autoPass" = EXCLUDED."autoPass",
  "ruleConfig" = EXCLUDED."ruleConfig",
  "status" = 'ACTIVE',
  "updatedAt" = CURRENT_TIMESTAMP;
