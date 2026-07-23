# 业务流程文档

## 1. 车抵贷申请流程

```
客户线索 → 客户录入 → 车辆录入 → 征信查询 → 申请提交 → 审批 → 签约 → 放款 → 还款
   ↓         ↓         ↓         ↓         ↓       ↓       ↓       ↓       ↓
 lead    customer   vehicle    credit   application approval signing disbursement repayment
```

### 1.1 流程节点说明

| 节点 | current_node | 状态 | 说明 |
|------|-------------|------|------|
| 身份证录入 | 1100 | - | 客户身份信息录入 |
| 车辆录入 | 1110 | - | 车辆信息、评估价录入 |
| 征信/申请 | 1200 | - | 征信查询、申请提交 |
| 审批 | 1300 | 1=成功/2=失败/3=补件/4=处理中 | 风控审批 |
| 签约 | 1400 | - | 电子签约 |
| 放款 | 1500 | - | 放款操作 |
| 还款 | 1600 | - | 还款计划 |

### 1.2 关键接口

- `GET /saas/api/application/list` - 申请列表
- `GET /saas/api/application/:id` - 申请详情
- `POST /saas/api/application` - 创建申请
- `POST /saas/api/application/:id/approve` - 审批通过
- `POST /saas/api/application/:id/reject` - 审批拒绝
- `POST /saas/api/application/:id/supplement` - 要求补件
- `POST /saas/api/application/:id/signing` - 发起签约
- `POST /saas/api/application/:id/disburse` - 放款

---

## 2. 客户管理流程

```
线索导入 → 客户转化 → 客户信息维护 → 联系人管理 → 跟进记录
   ↓        ↓           ↓             ↓           ↓
 lead    customer    customer      contact    follow-up
```

### 2.1 关键接口

- `GET /saas/api/customer/list` - 客户列表
- `GET /saas/api/customer/:id` - 客户详情
- `POST /saas/api/customer` - 创建客户
- `PUT /saas/api/customer/:id` - 更新客户
- `GET /saas/api/customer/:id/contacts` - 联系人列表
- `POST /saas/api/customer/:id/contacts` - 添加联系人

---

## 3. 产品管理流程

```
机构创建 → 产品配置 → 资方绑定 → 流程配置 → 上架
   ↓        ↓         ↓         ↓       ↓
 org    product    funder   flowconfig  ACTIVE
```

### 3.1 关键接口

- `GET /saas/api/product/list` - 产品列表
- `POST /saas/api/product` - 创建产品
- `PUT /saas/api/product/:id` - 更新产品
- `GET /saas/api/funder/list` - 资方列表
- `POST /saas/api/funder` - 创建资方

---

## 4. 审批流程

```
申请提交 → 初审 → 终审 → 签约 → 放款
   ↓        ↓      ↓      ↓      ↓
 application → approval → approval → signing → disbursement
```

### 4.1 审批状态

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 1 | 成功 | 审批通过 |
| 2 | 失败 | 审批拒绝 |
| 3 | 补件 | 要求补充材料 |
| 4 | 处理中 | 审批中 |

### 4.2 关键接口

- `GET /saas/api/approval/list` - 审批列表
- `POST /saas/api/approval/:id/approve` - 通过
- `POST /saas/api/approval/:id/reject` - 拒绝
- `POST /saas/api/approval/:id/supplement` - 补件

---

## 5. 签约流程

```
审批通过 → 生成合同 → 电子签约 → 签约完成
   ↓        ↓         ↓         ↓
 approval → signing → signrecord → 完成
```

### 5.1 关键接口

- `GET /saas/api/signing/list` - 签约列表
- `POST /saas/api/signing/:id/start` - 发起签约
- `GET /saas/api/signing/:id` - 签约详情

---

## 6. 放款流程

```
签约完成 → 放款审核 → 放款执行 → 还款计划生成
   ↓        ↓         ↓         ↓
 signing → disbursement → 完成 → repaymentPlan
```

### 6.1 关键接口

- `GET /saas/api/disbursement/list` - 放款列表
- `POST /saas/api/disbursement/:id/approve` - 放款审核
- `POST /saas/api/disbursement/:id/execute` - 执行放款

---

## 7. 还款流程

```
放款完成 → 还款计划 → 还款记录 → 提前还款
   ↓        ↓         ↓         ↓
 disbursement → repaymentPlan → repaymentRecord → earlyRepayment
```

### 7.1 还款状态

| 状态码 | 含义 |
|--------|------|
| 1 | 成功 |
| 2 | 失败 |
| 3 | 补件 |
| 4 | 处理中 |

---

## 8. 组织架构

```
组织 (Organization) → 部门 (Department) → 用户 (User)
                        ↓
                      角色 (Role) → 权限 (Permission) → 菜单 (Menu)
```

### 8.1 关键接口

- `GET /saas/api/org/list` - 机构列表
- `POST /saas/api/org` - 创建机构
- `GET /saas/api/dept/tree` - 部门树
- `GET /saas/api/roles/list` - 角色列表
- `GET /saas/api/menus/tree` - 菜单树

---

## 9. 实时通知流程

```
业务触发 (审批/签约/放款) → NotificationService.push → WebSocket Gateway → 在线用户实时接收
```

### 9.1 通知类型

- 审批通知
- 签约通知
- 放款通知
- 系统公告
- 工单通知

---

## 10. 移动端业务流程

```
登录 → 工作台 → 业务办理 → 提交 → 实时通知
  ↓      ↓        ↓        ↓       ↓
 auth → workbench → mobile-business → socket → notification
```

### 10.1 移动端模块

| 模块 | 说明 |
|------|------|
| 车抵贷 | 客户/车辆/征信/申请/签约 |
| 点餐 | 菜品浏览/购物车/下单 |
| 消息 | 公告/通知/待办 |
| 我的 | 个人中心/设置 |

---

## 11. 数据权限模型

- **租户隔离**: 所有业务数据自动注入 `tenantId`
- **数据范围**: 角色 `dataScope` 控制可见数据范围
  - `ALL` - 全部数据
  - `CUSTOM` - 自定义部门
  - `OWN` - 仅本人
  - `DEPT` - 本部门
  - `DEPT_AND_BELOW` - 本部门及下级
