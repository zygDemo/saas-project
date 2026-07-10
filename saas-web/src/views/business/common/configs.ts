import type { PageConfig } from './types'
import {
  orgStatusOptions,
  activeStatusOptions,
  orgPackageOptions,
  leadStatusOptions,
  leadSourceOptions,
  genderOptions,
  signingStatusOptions,
  disbursementStatusOptions,
  repaymentStatusOptions,
  productTypeOptions,
  repaymentMethodOptions,
  funderTypeOptions,
  integrationModeOptions,
  flowBusinessTypeOptions,
  flowNodeOptions,
  applicationStatusOptions,
  commonStatusMap,
  tenantStatusOptions,
  packageBillingStatusOptions,
  productTemplateStatusOptions,
  thirdPartyServiceTypeOptions,
  thirdPartyStatusOptions,
  workOrderTypeOptions,
  workOrderPriorityOptions,
  workOrderStatusOptions,
  msgTemplateChannelOptions,
  msgTemplateSceneOptions,
  msgTemplateStatusOptions
} from './constants'
import { leadActions, applicationActions } from './actions'

export const configs: Record<string, PageConfig> = {
  org: {
    title: '机构管理',
    description: '统一维护合作机构的基础资料、服务套餐、API接入与业务规模。',
    api: 'org',
    keywordField: 'name',
    keywordParam: 'keyword',
    keywordPlaceholder: '机构名称/编码/联系人/电话',
    columns: [
      { prop: 'name', label: '机构信息', width: 220 },
      { prop: 'contactName', label: '联系人', width: 170 },
      { prop: 'packageType', label: '套餐与有效期', width: 190 },
      { prop: 'apiEnabled', label: 'API接入', width: 110 },
      { prop: 'businessScale', label: '业务配置', width: 210 },
      { prop: 'status', label: '状态', width: 110 }
    ],
    detailColumns: [
      { prop: 'name', label: '机构名称' },
      { prop: 'code', label: '机构编码' },
      { prop: 'creditCode', label: '统一社会信用代码' },
      { prop: 'contactName', label: '联系人' },
      { prop: 'contactPhone', label: '联系电话' },
      { prop: 'address', label: '办公地址' },
      { prop: 'packageType', label: '套餐类型' },
      { prop: 'expireAt', label: '有效期' },
      { prop: 'apiEnabled', label: 'API接入' },
      { prop: 'businessScale', label: '业务配置' },
      { prop: 'status', label: '状态' }
    ],
    formFields: [
      { prop: 'name', label: '机构名称', required: true, group: '基础信息' },
      { prop: 'code', label: '机构编码', required: true, placeholder: '建议使用英文或拼音缩写' },
      { prop: 'creditCode', label: '统一社会信用代码', placeholder: '18位统一社会信用代码' },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: orgStatusOptions,
        defaultValue: 'ACTIVE'
      },
      { prop: 'contactName', label: '联系人', group: '联系信息' },
      { prop: 'contactPhone', label: '联系电话' },
      { prop: 'address', label: '办公地址', type: 'textarea' },
      {
        prop: 'packageType',
        label: '套餐类型',
        type: 'select',
        options: orgPackageOptions,
        defaultValue: 'STANDARD',
        group: '服务配置'
      },
      { prop: 'expireAt', label: '到期时间', type: 'date', placeholder: '不填表示暂不限制' },
      { prop: 'apiEnabled', label: 'API接入', type: 'switch', defaultValue: true }
    ],
    actions: [
      {
        name: 'enable',
        label: '启用',
        path: (row) => `/org/${row.id}/enable`,
        visible: (row) => String(row.status) !== 'ACTIVE'
      },
      {
        name: 'disable',
        label: '停用',
        type: 'warning',
        path: (row) => `/org/${row.id}/disable`,
        visible: (row) => String(row.status) === 'ACTIVE'
      }
    ]
  },
  dept: {
    title: '部门管理',
    description: '维护机构下的部门层级和负责人。',
    api: 'dept',
    keywordField: 'name',
    columns: [
      { prop: 'name', label: '部门名称' },
      { prop: 'orgName', label: '所属机构', width: 160 },
      { prop: 'parentName', label: '上级部门', width: 160 },
      { prop: 'managerName', label: '负责人', width: 140 },
      { prop: 'managerPhone', label: '负责人电话', width: 140 }
    ],
    formFields: [
      {
        prop: 'orgId',
        label: '所属机构',
        type: 'select',
        required: true,
        remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
        placeholder: '请选择所属机构'
      },
      { prop: 'name', label: '部门名称', required: true },
      {
        prop: 'parentId',
        label: '上级部门',
        type: 'select',
        remoteOptions: { module: 'dept', params: (model) => ({ orgId: model.orgId }) },
        placeholder: '可不选，表示一级部门'
      },
      {
        prop: 'managerId',
        label: '负责人',
        type: 'select',
        remoteOptions: {
          module: 'user',
          labelField: 'nickName',
          params: (model) => ({ orgId: model.orgId })
        },
        placeholder: '请选择负责人'
      },
      { prop: 'sort', label: '排序', type: 'number', defaultValue: 0 }
    ],
    actions: []
  },
  product: {
    title: '产品管理',
    description: '维护车贷产品、利率、金额、期限与准入规则。',
    api: 'product',
    keywordField: 'name',
    columns: [
      { prop: 'name', label: '产品名称' },
      { prop: 'productType', label: '产品类型', width: 120 },
      { prop: 'minAmount', label: '最低金额', width: 120 },
      { prop: 'maxAmount', label: '最高金额', width: 120 },
      { prop: 'status', label: '状态', width: 100 }
    ],
    formFields: [
      {
        prop: 'orgId',
        label: '所属机构',
        type: 'select',
        required: true,
        remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
        placeholder: '请选择所属机构'
      },
      { prop: 'name', label: '产品名称', required: true },
      {
        prop: 'productType',
        label: '产品类型',
        type: 'select',
        options: productTypeOptions,
        defaultValue: 'CAR_LOAN',
        required: true
      },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: activeStatusOptions,
        defaultValue: 'ACTIVE'
      },
      {
        prop: 'minAmount',
        label: '最低金额',
        type: 'number',
        precision: 2,
        unit: '元',
        required: true,
        group: '授信范围'
      },
      {
        prop: 'maxAmount',
        label: '最高金额',
        type: 'number',
        precision: 2,
        unit: '元',
        required: true
      },
      { prop: 'minTerm', label: '最短期限', type: 'number', unit: '个月', required: true },
      { prop: 'maxTerm', label: '最长期限', type: 'number', unit: '个月', required: true },
      {
        prop: 'minRate',
        label: '最低年利率',
        type: 'number',
        precision: 2,
        unit: '%',
        transform: 'percent',
        defaultValue: 3.6,
        required: true
      },
      {
        prop: 'maxRate',
        label: '最高年利率',
        type: 'number',
        precision: 2,
        unit: '%',
        transform: 'percent',
        defaultValue: 12,
        required: true
      },
      {
        prop: 'repaymentMethod',
        label: '还款方式',
        type: 'select',
        options: repaymentMethodOptions,
        defaultValue: '等额本息',
        required: true
      },
      { prop: 'minAge', label: '最低年龄', type: 'number', unit: '岁', group: '准入条件' },
      { prop: 'maxAge', label: '最高年龄', type: 'number', unit: '岁' },
      { prop: 'maxCarAge', label: '最大车龄', type: 'number', unit: '年' },
      { prop: 'maxMileage', label: '最大里程', type: 'number', unit: '公里' },
      {
        prop: 'ltvLimit',
        label: '最高LTV',
        type: 'number',
        precision: 2,
        unit: '%',
        transform: 'percent'
      },
      {
        prop: 'minDownPayment',
        label: '最低首付比例',
        type: 'number',
        precision: 2,
        unit: '%',
        transform: 'percent'
      },
      { prop: 'regions', label: '适用区域', placeholder: '如：上海、苏州、杭州' }
    ],
    actions: []
  },
  funder: {
    title: '资方管理',
    description: '维护银行、消金、租赁、小贷等资金方信息。',
    api: 'funder',
    keywordField: 'name',
    columns: [
      { prop: 'name', label: '资方名称' },
      { prop: 'orgName', label: '所属机构', width: 160 },
      { prop: 'code', label: '资方编码', width: 140 },
      { prop: 'funderType', label: '类型', width: 120 },
      { prop: 'contactName', label: '联系人', width: 120 },
      { prop: 'status', label: '状态', width: 100 }
    ],
    formFields: [
      {
        prop: 'orgId',
        label: '所属机构',
        type: 'select',
        required: true,
        remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
        placeholder: '请选择所属机构'
      },
      { prop: 'name', label: '资方名称', required: true },
      { prop: 'code', label: '资方编码', required: true },
      {
        prop: 'funderType',
        label: '资方类型',
        type: 'select',
        options: funderTypeOptions,
        defaultValue: 'BANK',
        required: true
      },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: activeStatusOptions,
        defaultValue: 'ACTIVE'
      },
      { prop: 'contactName', label: '联系人', group: '联系信息' },
      { prop: 'contactPhone', label: '联系电话' },
      {
        prop: 'integrationMode',
        label: '对接方式',
        type: 'select',
        options: integrationModeOptions,
        defaultValue: 'MANUAL',
        group: '合作配置'
      },
      { prop: 'creditLimit', label: '授信额度', type: 'number', precision: 2, unit: '元' },
      { prop: 'priority', label: '优先级', type: 'number', defaultValue: 0 }
    ],
    actions: []
  },
  'flow-config': {
    title: '流程与规则',
    description: '维护各机构的业务流程节点、审批层级、资料要求、自动通过与超时规则。',
    api: 'flow-config',
    keywordField: 'name',
    columns: [
      { prop: 'name', label: '规则名称', width: 180 },
      { prop: 'orgName', label: '所属机构', width: 160 },
      { prop: 'businessType', label: '业务类型', width: 120 },
      { prop: 'nodeName', label: '流程节点', width: 120 },
      { prop: 'approveLevel', label: '审批层级', width: 100 },
      { prop: 'requireApproval', label: '需要审批', width: 100 },
      { prop: 'autoPass', label: '自动通过', width: 100 },
      { prop: 'status', label: '状态', width: 100 }
    ],
    detailColumns: [
      { prop: 'name', label: '规则名称' },
      { prop: 'orgName', label: '所属机构' },
      { prop: 'businessType', label: '业务类型' },
      { prop: 'nodeCode', label: '节点编码' },
      { prop: 'nodeName', label: '节点名称' },
      { prop: 'approveLevel', label: '审批层级' },
      { prop: 'amountLimit', label: '金额阈值' },
      { prop: 'timeoutHours', label: '超时时长(小时)' },
      { prop: 'requireMaterials', label: '要求资料' },
      { prop: 'requireApproval', label: '需要审批' },
      { prop: 'autoPass', label: '自动通过' },
      { prop: 'ruleConfig', label: '规则JSON' },
      { prop: 'remark', label: '备注' },
      { prop: 'status', label: '状态' }
    ],
    formFields: [
      {
        prop: 'orgId',
        label: '所属机构',
        type: 'select',
        required: true,
        remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
        placeholder: '请选择所属机构'
      },
      { prop: 'name', label: '规则名称', required: true },
      {
        prop: 'businessType',
        label: '业务类型',
        type: 'select',
        options: flowBusinessTypeOptions,
        defaultValue: 'CAR_LOAN',
        required: true
      },
      {
        prop: 'nodeCode',
        label: '流程节点',
        type: 'select',
        options: flowNodeOptions,
        defaultValue: '1100',
        required: true
      },
      { prop: 'nodeName', label: '节点名称', required: true },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: activeStatusOptions,
        defaultValue: 'ACTIVE'
      },
      {
        prop: 'approveLevel',
        label: '审批层级',
        type: 'number',
        defaultValue: 1,
        required: true,
        group: '审批规则'
      },
      { prop: 'amountLimit', label: '金额阈值', type: 'number', precision: 2, unit: '元' },
      { prop: 'timeoutHours', label: '超时时长', type: 'number', unit: '小时' },
      { prop: 'requireMaterials', label: '要求资料', type: 'switch', defaultValue: false },
      { prop: 'requireApproval', label: '需要审批', type: 'switch', defaultValue: true },
      { prop: 'autoPass', label: '自动通过', type: 'switch', defaultValue: false },
      {
        prop: 'ruleConfig',
        label: '规则JSON',
        type: 'json',
        placeholder: '{"minAmount": 10000, "roles": ["R_APPROVER"]}',
        group: '高级配置'
      },
      { prop: 'remark', label: '备注', type: 'textarea' }
    ],
    actions: []
  },
  lead: {
    title: '线索管理',
    description: '线索分配、跟进、转化和公海池。',
    api: 'lead',
    keywordField: 'name',
    statusMap: commonStatusMap,
    columns: [
      { prop: 'orgName', label: '所属机构', width: 160 },
      { prop: 'name', label: '客户姓名', width: 120 },
      { prop: 'phone', label: '手机号', width: 140 },
      { prop: 'source', label: '来源', width: 120 },
      { prop: 'assigneeName', label: '负责人', width: 120 },
      { prop: 'loanAmount', label: '意向金额', width: 120 },
      { prop: 'status', label: '状态', width: 120 }
    ],
    formFields: [
      {
        prop: 'orgId',
        label: '所属机构',
        type: 'select',
        required: true,
        remoteOptions: { module: 'org', params: { status: 'ACTIVE' } },
        placeholder: '请选择所属机构'
      },
      { prop: 'name', label: '客户姓名', required: true },
      { prop: 'phone', label: '手机号', required: true },
      {
        prop: 'source',
        label: '来源',
        type: 'select',
        options: leadSourceOptions,
        defaultValue: 'SELF',
        required: true
      },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: leadStatusOptions,
        defaultValue: 'PENDING_ASSIGN'
      },
      { prop: 'idCard', label: '身份证号' },
      {
        prop: 'assigneeId',
        label: '负责人',
        type: 'select',
        remoteOptions: {
          module: 'user',
          labelField: 'nickName',
          params: (model) => ({ orgId: model.orgId })
        },
        placeholder: '请选择负责人'
      },
      { prop: 'carBrand', label: '车辆品牌', group: '车辆意向' },
      { prop: 'carModel', label: '车型' },
      { prop: 'loanAmount', label: '意向金额', type: 'number', precision: 2, unit: '元' },
      { prop: 'nextFollowAt', label: '下次跟进时间', type: 'date', group: '跟进信息' },
      { prop: 'remark', label: '备注', type: 'textarea' }
    ],
    actions: leadActions
  },
  customer: {
    title: '客户管理',
    description: '客户基本信息、联系人、车辆、银行卡。',
    api: 'customer',
    keywordField: 'name',
    columns: [
      { prop: 'name', label: '客户姓名', width: 120 },
      { prop: 'phone', label: '手机号', width: 140 },
      { prop: 'gender', label: '性别', width: 80 },
      { prop: 'companyName', label: '单位', width: 160 },
      { prop: 'status', label: '状态', width: 100 }
    ],
    formFields: [
      { prop: 'orgId', label: '机构ID', type: 'number', required: true },
      { prop: 'name', label: '客户姓名', required: true },
      { prop: 'phone', label: '手机号', required: true },
      { prop: 'idCard', label: '身份证号' },
      {
        prop: 'gender',
        label: '性别',
        type: 'select',
        options: genderOptions,
        defaultValue: 'UNKNOWN'
      },
      { prop: 'companyName', label: '单位' },
      { prop: 'monthlyIncome', label: '月收入', type: 'number', precision: 2 },
      { prop: 'address', label: '地址' },
      { prop: 'emergencyName', label: '紧急联系人' },
      { prop: 'emergencyPhone', label: '紧急联系人电话' },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: activeStatusOptions,
        defaultValue: 'ACTIVE'
      }
    ],
    actions: []
  },
  application: {
    title: '进件管理',
    description: '进件资料、审批流、签约、放款与还款的核心入口。',
    api: 'application',
    listApi: 'flow-list',
    keywordField: 'applicationNo',
    statusMap: commonStatusMap,
    columns: [
      { prop: 'applicationNo', label: '申请编号', width: 200 },
      { prop: 'customerName', label: '客户姓名', width: 120 },
      { prop: 'productName', label: '产品', width: 140 },
      { prop: 'funderName', label: '资方', width: 140 },
      { prop: 'amount', label: '申请金额', width: 120 },
      { prop: 'term', label: '期限(月)', width: 100 },
      { prop: 'status', label: '状态', width: 160 }
    ],
    formFields: [
      { prop: 'customerId', label: '客户ID', type: 'number', required: true },
      { prop: 'productId', label: '产品ID', type: 'number' },
      { prop: 'funderId', label: '资方ID', type: 'number' },
      { prop: 'amount', label: '申请金额', type: 'number', precision: 2, required: true },
      { prop: 'term', label: '期限(月)', type: 'number', required: true },
      {
        prop: 'rate',
        label: '年利率',
        type: 'number',
        precision: 4,
        defaultValue: 0.068,
        required: true
      },
      {
        prop: 'repaymentMethod',
        label: '还款方式',
        type: 'select',
        options: repaymentMethodOptions,
        defaultValue: '等额本息',
        required: true
      },
      { prop: 'creatorId', label: '创建人ID', type: 'number', required: true },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: applicationStatusOptions,
        defaultValue: 'DRAFT'
      },
      { prop: 'purpose', label: '贷款用途' },
      { prop: 'remark', label: '备注', type: 'textarea' }
    ],
    actions: applicationActions
  },
  'order-query': {
    title: '综合查询',
    description: '按订单号、客户、手机号、车牌号、流程节点和状态查询订单列表。',
    api: 'application',
    listApi: 'order-list',
    readonly: true,
    keywordField: 'keyword',
    keywordParam: 'keyword',
    keywordPlaceholder: '订单号/姓名/手机号/车牌号',
    statusMap: commonStatusMap,
    columns: [
      { prop: 'orderNo', label: '申请编号', width: 200 },
      { prop: 'customerName', label: '客户姓名', width: 120 },
      { prop: 'productName', label: '产品', width: 140 },
      { prop: 'funderName', label: '资方', width: 140 },
      { prop: 'amount', label: '申请金额', width: 120 },
      { prop: 'term', label: '期限(月)', width: 100 },
      { prop: 'status', label: '状态', width: 160 }
    ],
    detailColumns: [
      { prop: 'applicationNo', label: '申请编号' },
      { prop: 'orderNo', label: '订单号' },
      { prop: 'creditOrderId', label: '授信订单号' },
      { prop: 'customerName', label: '客户姓名' },
      { prop: 'phone', label: '手机号' },
      { prop: 'idCard', label: '身份证号' },
      { prop: 'plateNumber', label: '车牌号' },
      { prop: 'productName', label: '产品' },
      { prop: 'funderName', label: '资方' },
      { prop: 'amount', label: '申请金额' },
      { prop: 'approvedAmount', label: '审批金额' },
      { prop: 'term', label: '期限(月)' },
      { prop: 'currentNodeName', label: '当前节点' },
      { prop: 'currentStatusName', label: '节点状态' },
      { prop: 'status', label: '订单状态' },
      { prop: 'createdAt', label: '创建时间' },
      { prop: 'updatedAt', label: '更新时间' }
    ],
    formFields: [],
    actions: []
  },
  approval: {
    title: '审批管理',
    description: '查看审批记录和审批意见。',
    api: 'approval',
    columns: [
      { prop: 'applicationId', label: '进件ID' },
      { prop: 'approverId', label: '审批人ID' },
      { prop: 'stage', label: '审批阶段' },
      { prop: 'action', label: '动作' },
      { prop: 'opinion', label: '意见' }
    ],
    formFields: [
      { prop: 'applicationId', label: '进件ID', type: 'number', required: true },
      { prop: 'approverId', label: '审批人ID', type: 'number', required: true },
      { prop: 'stage', label: '审批阶段', defaultValue: 'FIRST_REVIEW', required: true },
      { prop: 'action', label: '审批动作', defaultValue: 'PASS', required: true },
      { prop: 'opinion', label: '审批意见', type: 'textarea' },
      { prop: 'amount', label: '核定金额', type: 'number', precision: 2 },
      { prop: 'term', label: '核定期限', type: 'number' },
      { prop: 'rate', label: '核定利率', type: 'number', precision: 4 }
    ],
    actions: []
  },
  signing: {
    title: '签约管理',
    description: '发起签约、合同签署、面签视频和签约状态。',
    api: 'signing',
    columns: [
      { prop: 'applicationId', label: '进件ID' },
      { prop: 'status', label: '签约状态' },
      { prop: 'contractUrl', label: '合同URL' },
      { prop: 'signedAt', label: '签约时间' }
    ],
    formFields: [
      { prop: 'applicationId', label: '进件ID', type: 'number', required: true },
      {
        prop: 'status',
        label: '签约状态',
        type: 'select',
        options: signingStatusOptions,
        defaultValue: 'PENDING'
      },
      { prop: 'contractUrl', label: '合同URL' },
      { prop: 'videoUrl', label: '面签视频URL' },
      { prop: 'signedAt', label: '签约时间', type: 'date' }
    ],
    actions: []
  },
  disbursement: {
    title: '放款管理',
    description: 'GPS安装、抵押办理和放款确认。',
    api: 'disbursement',
    columns: [
      { prop: 'applicationId', label: '进件ID' },
      { prop: 'status', label: '放款状态' },
      { prop: 'gpsDeviceNo', label: 'GPS设备号' },
      { prop: 'mortgageStatus', label: '抵押状态' },
      { prop: 'disburseAmount', label: '放款金额' }
    ],
    formFields: [
      { prop: 'applicationId', label: '进件ID', type: 'number', required: true },
      {
        prop: 'status',
        label: '放款状态',
        type: 'select',
        options: disbursementStatusOptions,
        defaultValue: 'PENDING_APPLICATION'
      },
      { prop: 'gpsDeviceNo', label: 'GPS设备号' },
      { prop: 'mortgageStatus', label: '抵押状态' },
      { prop: 'disburseAmount', label: '放款金额', type: 'number', precision: 2 },
      { prop: 'disburseAccount', label: '放款账户' },
      { prop: 'transactionNo', label: '交易流水号' },
      { prop: 'remark', label: '备注', type: 'textarea' }
    ],
    actions: []
  },
  repayment: {
    title: '还款管理',
    description: '还款计划、还款登记、部分还款和结清。',
    api: 'repayment',
    columns: [
      { prop: 'applicationId', label: '进件ID' },
      { prop: 'period', label: '期数' },
      { prop: 'dueDate', label: '应还日期' },
      { prop: 'totalAmount', label: '应还总额' },
      { prop: 'status', label: '状态' }
    ],
    formFields: [
      { prop: 'applicationId', label: '进件ID', type: 'number', required: true },
      { prop: 'period', label: '期数', type: 'number', required: true },
      { prop: 'dueDate', label: '应还日期', type: 'date', required: true },
      { prop: 'principal', label: '本金', type: 'number', precision: 2, required: true },
      { prop: 'interest', label: '利息', type: 'number', precision: 2, required: true },
      { prop: 'totalAmount', label: '应还总额', type: 'number', precision: 2, required: true },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: repaymentStatusOptions,
        defaultValue: 'PENDING'
      }
    ],
    actions: []
  },
  reports: {
    title: '报表统计',
    description: '业务数据统计、图表展示和关键指标监控。',
    api: 'data-center',
    listApi: 'stats',
    readonly: true,
    columns: [
      { prop: 'metricName', label: '指标名称', width: 200 },
      { prop: 'metricValue', label: '指标值', width: 150 },
      { prop: 'metricUnit', label: '单位', width: 100 },
      { prop: 'changeRate', label: '环比变化', width: 120 },
      { prop: 'period', label: '统计周期', width: 150 },
      { prop: 'updatedAt', label: '更新时间', width: 180 }
    ],
    detailColumns: [
      { prop: 'metricName', label: '指标名称' },
      { prop: 'metricValue', label: '指标值' },
      { prop: 'metricUnit', label: '单位' },
      { prop: 'changeRate', label: '环比变化' },
      { prop: 'period', label: '统计周期' },
      { prop: 'description', label: '指标说明' },
      { prop: 'updatedAt', label: '更新时间' }
    ],
    formFields: [],
    actions: []
  },
  // ==================== 平台管理 ====================
  tenant: {
    title: '租户机构管理',
    description: '维护平台所有租户机构的基础资料、联系信息与状态。',
    api: 'org',
    keywordField: 'name',
    keywordParam: 'keyword',
    keywordPlaceholder: '机构名称/编码/联系人/电话',
    columns: [
      { prop: 'name', label: '机构名称', width: 200 },
      { prop: 'code', label: '机构编码', width: 140 },
      { prop: 'contactName', label: '联系人', width: 120 },
      { prop: 'contactPhone', label: '联系电话', width: 140 },
      { prop: 'packageType', label: '套餐类型', width: 120 },
      { prop: 'status', label: '状态', width: 100 }
    ],
    detailColumns: [
      { prop: 'name', label: '机构名称' },
      { prop: 'code', label: '机构编码' },
      { prop: 'contactName', label: '联系人' },
      { prop: 'contactPhone', label: '联系电话' },
      { prop: 'packageType', label: '套餐类型' },
      { prop: 'status', label: '状态' }
    ],
    formFields: [
      { prop: 'name', label: '机构名称', required: true, group: '基础信息' },
      { prop: 'code', label: '机构编码', required: true, placeholder: '建议使用英文或拼音缩写' },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: tenantStatusOptions,
        defaultValue: 'ACTIVE'
      },
      { prop: 'contactName', label: '联系人', group: '联系信息' },
      { prop: 'contactPhone', label: '联系电话' },
      {
        prop: 'packageType',
        label: '套餐类型',
        type: 'select',
        options: orgPackageOptions,
        defaultValue: 'STANDARD',
        group: '服务配置'
      }
    ],
    actions: []
  },
  'package-billing': {
    title: '套餐与计费',
    description: '管理平台套餐方案、定价与用户/机构配额。',
    api: 'package-plan',
    keywordField: 'name',
    keywordParam: 'keyword',
    keywordPlaceholder: '套餐名称/编码',
    columns: [
      { prop: 'name', label: '套餐名称', width: 200 },
      { prop: 'code', label: '套餐编码', width: 140 },
      { prop: 'price', label: '价格', width: 120 },
      { prop: 'maxUsers', label: '最大用户数', width: 120 },
      { prop: 'maxOrgs', label: '最大机构数', width: 120 },
      { prop: 'status', label: '状态', width: 100 }
    ],
    detailColumns: [
      { prop: 'name', label: '套餐名称' },
      { prop: 'code', label: '套餐编码' },
      { prop: 'price', label: '价格' },
      { prop: 'maxUsers', label: '最大用户数' },
      { prop: 'maxOrgs', label: '最大机构数' },
      { prop: 'status', label: '状态' }
    ],
    formFields: [
      { prop: 'name', label: '套餐名称', required: true, group: '基础信息' },
      { prop: 'code', label: '套餐编码', required: true },
      {
        prop: 'price',
        label: '价格',
        type: 'number',
        precision: 2,
        unit: '元/月',
        required: true
      },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: packageBillingStatusOptions,
        defaultValue: 'ACTIVE'
      },
      {
        prop: 'maxUsers',
        label: '最大用户数',
        type: 'number',
        required: true,
        group: '配额设置'
      },
      {
        prop: 'maxOrgs',
        label: '最大机构数',
        type: 'number',
        required: true
      }
    ],
    actions: []
  },
  'product-template': {
    title: '产品与资方模板',
    description: '维护产品模板的利率、金额、期限区间，供新建产品时快速引用。',
    api: 'product-template',
    keywordField: 'name',
    keywordParam: 'keyword',
    keywordPlaceholder: '模板名称',
    columns: [
      { prop: 'name', label: '模板名称', width: 200 },
      { prop: 'productType', label: '产品类型', width: 120 },
      { prop: 'minRate', label: '最低利率', width: 100 },
      { prop: 'maxRate', label: '最高利率', width: 100 },
      { prop: 'minAmount', label: '最低金额', width: 120 },
      { prop: 'maxAmount', label: '最高金额', width: 120 },
      { prop: 'status', label: '状态', width: 100 }
    ],
    detailColumns: [
      { prop: 'name', label: '模板名称' },
      { prop: 'productType', label: '产品类型' },
      { prop: 'minRate', label: '最低年利率' },
      { prop: 'maxRate', label: '最高年利率' },
      { prop: 'minAmount', label: '最低金额' },
      { prop: 'maxAmount', label: '最高金额' },
      { prop: 'minTerm', label: '最短期限' },
      { prop: 'maxTerm', label: '最长期限' },
      { prop: 'status', label: '状态' }
    ],
    formFields: [
      { prop: 'name', label: '模板名称', required: true, group: '基础信息' },
      {
        prop: 'productType',
        label: '产品类型',
        type: 'select',
        options: productTypeOptions,
        defaultValue: 'CAR_LOAN',
        required: true
      },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: productTemplateStatusOptions,
        defaultValue: 'ACTIVE'
      },
      {
        prop: 'minRate',
        label: '最低年利率',
        type: 'number',
        precision: 2,
        unit: '%',
        transform: 'percent',
        required: true,
        group: '利率范围'
      },
      {
        prop: 'maxRate',
        label: '最高年利率',
        type: 'number',
        precision: 2,
        unit: '%',
        transform: 'percent',
        required: true
      },
      {
        prop: 'minAmount',
        label: '最低金额',
        type: 'number',
        precision: 2,
        unit: '元',
        required: true,
        group: '金额范围'
      },
      {
        prop: 'maxAmount',
        label: '最高金额',
        type: 'number',
        precision: 2,
        unit: '元',
        required: true
      },
      {
        prop: 'minTerm',
        label: '最短期限',
        type: 'number',
        unit: '个月',
        required: true,
        group: '期限范围'
      },
      {
        prop: 'maxTerm',
        label: '最长期限',
        type: 'number',
        unit: '个月',
        required: true
      }
    ],
    actions: []
  },
  supervision: {
    title: '平台业务监管',
    description: '查看各机构的业务数据统计与运营指标，只读监控面板。',
    api: 'platform-supervision',
    listApi: 'stats',
    readonly: true,
    keywordField: 'orgName',
    keywordParam: 'keyword',
    keywordPlaceholder: '机构名称',
    columns: [
      { prop: 'orgName', label: '机构名称', width: 200 },
      { prop: 'totalApplications', label: '进件总数', width: 120 },
      { prop: 'activeApplications', label: '处理中', width: 100 },
      { prop: 'disbursedAmount', label: '放款总额', width: 140 },
      { prop: 'overdueRate', label: '逾期率', width: 100 },
      { prop: 'leadCount', label: '线索数', width: 100 },
      { prop: 'conversionRate', label: '转化率', width: 100 }
    ],
    detailColumns: [
      { prop: 'orgName', label: '机构名称' },
      { prop: 'totalApplications', label: '进件总数' },
      { prop: 'activeApplications', label: '处理中' },
      { prop: 'disbursedAmount', label: '放款总额' },
      { prop: 'overdueRate', label: '逾期率' },
      { prop: 'leadCount', label: '线索数' },
      { prop: 'conversionRate', label: '转化率' },
      { prop: 'userCount', label: '用户数' },
      { prop: 'productCount', label: '产品数' },
      { prop: 'funderCount', label: '资方数' }
    ],
    formFields: [],
    actions: []
  },
  'third-party': {
    title: '第三方服务管理',
    description: '维护征信、身份核验、GPS、电子签约等第三方服务接入配置。',
    api: 'third-party-service',
    keywordField: 'name',
    keywordParam: 'keyword',
    keywordPlaceholder: '服务名称/编码/供应商',
    columns: [
      { prop: 'name', label: '服务名称', width: 180 },
      { prop: 'code', label: '服务编码', width: 140 },
      { prop: 'serviceType', label: '服务类型', width: 120 },
      { prop: 'provider', label: '供应商', width: 140 },
      { prop: 'apiUrl', label: '接口地址', width: 240 },
      { prop: 'status', label: '状态', width: 120 }
    ],
    detailColumns: [
      { prop: 'name', label: '服务名称' },
      { prop: 'code', label: '服务编码' },
      { prop: 'serviceType', label: '服务类型' },
      { prop: 'provider', label: '供应商' },
      { prop: 'apiUrl', label: '接口地址' },
      { prop: 'apiKey', label: 'API Key' },
      { prop: 'status', label: '状态' },
      { prop: 'remark', label: '备注' }
    ],
    formFields: [
      { prop: 'name', label: '服务名称', required: true, group: '基础信息' },
      { prop: 'code', label: '服务编码', required: true },
      {
        prop: 'serviceType',
        label: '服务类型',
        type: 'select',
        options: thirdPartyServiceTypeOptions,
        required: true
      },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: thirdPartyStatusOptions,
        defaultValue: 'ACTIVE'
      },
      { prop: 'provider', label: '供应商', required: true, group: '接入配置' },
      { prop: 'apiUrl', label: '接口地址', required: true },
      { prop: 'apiKey', label: 'API Key' },
      { prop: 'apiSecret', label: 'API Secret' },
      { prop: 'remark', label: '备注', type: 'textarea', group: '其他' }
    ],
    actions: []
  },

  'msg-template': {
    title: '消息模板',
    description: '维护短信、站内信、微信、邮件等通知模板，支持变量占位符配置。',
    api: 'msg-template',
    keywordField: 'name',
    keywordParam: 'keyword',
    keywordPlaceholder: '模板名称/编码/内容',
    columns: [
      { prop: 'name', label: '模板名称', width: 180 },
      { prop: 'code', label: '模板编码', width: 180 },
      { prop: 'channel', label: '渠道', width: 100 },
      { prop: 'scene', label: '业务场景', width: 150 },
      { prop: 'title', label: '标题/主题', width: 180 },
      { prop: 'status', label: '状态', width: 100 },
      { prop: 'updateTime', label: '更新时间', width: 170 }
    ],
    detailColumns: [
      { prop: 'name', label: '模板名称' },
      { prop: 'code', label: '模板编码' },
      { prop: 'channel', label: '发送渠道' },
      { prop: 'scene', label: '业务场景' },
      { prop: 'title', label: '标题/主题' },
      { prop: 'content', label: '模板内容' },
      { prop: 'variables', label: '变量说明' },
      { prop: 'status', label: '状态' },
      { prop: 'remark', label: '备注' }
    ],
    formFields: [
      { prop: 'name', label: '模板名称', required: true, group: '基础信息' },
      {
        prop: 'code',
        label: '模板编码',
        required: true,
        placeholder: '建议使用英文大写，如 PRECHECK_PASS_SMS'
      },
      {
        prop: 'channel',
        label: '发送渠道',
        type: 'select',
        options: msgTemplateChannelOptions,
        defaultValue: 'SMS',
        required: true
      },
      {
        prop: 'scene',
        label: '业务场景',
        type: 'select',
        options: msgTemplateSceneOptions,
        defaultValue: 'GENERAL'
      },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: msgTemplateStatusOptions,
        defaultValue: 'ACTIVE'
      },
      { prop: 'title', label: '标题/主题', group: '内容配置' },
      {
        prop: 'content',
        label: '模板内容',
        type: 'textarea',
        required: true,
        placeholder: '支持 {{customerName}}、{{applicationNo}} 等变量占位符'
      },
      {
        prop: 'variables',
        label: '变量说明',
        type: 'json',
        placeholder: '{"customerName":"客户姓名","applicationNo":"申请编号"}'
      },
      { prop: 'remark', label: '备注', type: 'textarea', group: '其他' }
    ],
    statusMap: {
      SMS: '短信',
      APP: '站内信',
      WECHAT: '微信',
      EMAIL: '邮件',
      SYSTEM: '系统消息',
      GENERAL: '通用通知',
      CARLOAN_PRECHECK: '车贷预审',
      CARLOAN_SUPPLEMENT: '补件提醒',
      CARLOAN_APPROVAL: '审批结果',
      CARLOAN_SIGNING: '签约通知',
      CARLOAN_REPAYMENT: '还款提醒',
      SYSTEM_ALERT: '系统告警',
      ACTIVE: '启用',
      INACTIVE: '停用',
      DRAFT: '草稿'
    },
    filters: [
      { prop: 'channel', label: '发送渠道', type: 'select', options: msgTemplateChannelOptions },
      { prop: 'scene', label: '业务场景', type: 'select', options: msgTemplateSceneOptions }
    ],
    actions: [
      {
        name: 'enable',
        label: '启用',
        path: (row) => `/msg-template/${row.id}/enable`,
        visible: (row) => String(row.status) !== 'ACTIVE'
      },
      {
        name: 'disable',
        label: '停用',
        type: 'warning',
        path: (row) => `/msg-template/${row.id}/disable`,
        visible: (row) => String(row.status) === 'ACTIVE'
      }
    ]
  },
  'work-order': {
    title: '运营工单中心',
    description: '提交、分配和处理平台运营工单，跟踪问题解决进度。',
    api: 'work-order',
    keywordField: 'title',
    keywordParam: 'keyword',
    keywordPlaceholder: '工单标题',
    columns: [
      { prop: 'title', label: '工单标题', width: 240 },
      { prop: 'orderType', label: '工单类型', width: 120 },
      { prop: 'priority', label: '优先级', width: 100 },
      { prop: 'creatorName', label: '创建人', width: 120 },
      { prop: 'assigneeName', label: '处理人', width: 120 },
      { prop: 'status', label: '状态', width: 120 }
    ],
    detailColumns: [
      { prop: 'title', label: '工单标题' },
      { prop: 'orderType', label: '工单类型' },
      { prop: 'priority', label: '优先级' },
      { prop: 'description', label: '问题描述' },
      { prop: 'creatorName', label: '创建人' },
      { prop: 'assigneeName', label: '处理人' },
      { prop: 'status', label: '状态' },
      { prop: 'resolution', label: '解决方案' },
      { prop: 'createdAt', label: '创建时间' },
      { prop: 'resolvedAt', label: '解决时间' }
    ],
    formFields: [
      { prop: 'title', label: '工单标题', required: true, group: '基础信息' },
      {
        prop: 'orderType',
        label: '工单类型',
        type: 'select',
        options: workOrderTypeOptions,
        required: true
      },
      {
        prop: 'priority',
        label: '优先级',
        type: 'select',
        options: workOrderPriorityOptions,
        defaultValue: 'MEDIUM'
      },
      {
        prop: 'status',
        label: '状态',
        type: 'select',
        options: workOrderStatusOptions,
        defaultValue: 'OPEN'
      },
      {
        prop: 'description',
        label: '问题描述',
        type: 'textarea',
        required: true,
        group: '详细信息'
      },
      {
        prop: 'assigneeId',
        label: '处理人',
        type: 'select',
        remoteOptions: {
          module: 'user',
          labelField: 'nickName'
        },
        placeholder: '请选择处理人'
      }
    ],
    actions: []
  }
}
