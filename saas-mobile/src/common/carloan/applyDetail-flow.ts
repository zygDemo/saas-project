// 流程标签列表 - 用于展示不同的业务流程阶段
export const flowTabList = [
  { label: "预审", value: "precheck" },
  { label: "补件", value: "supplement" },
  // { label: "审批", value: "approval" },
  { label: "签约", value: "signing" },
  // { label: "请款", value: "loanRequest" },
  { label: "放款", value: "disbursement" },
];

// 状态映射表 - 将状态码映射为对应的文本和类型
export const statusMap: Record<
  string | number,
  { text: string; type: string }
> = {
  1: { text: "授信成功", type: "success" },
  2: { text: "授信失败", type: "error" },
  3: { text: "重新推送", type: "warning" },
  4: { text: "待授信", type: "info" },
};

// 业务节点映射表 - 将业务节点代码映射为对应的文本描述
export const businessNodeMap: Record<string | number, string> = {
  1100: "初审",
  1200: "预审",
  1250: "资方预审",
  1300: "补件",
  1400: "初审",
  1450: "终审",
  1500: "资方审批",
  1600: "签约",
  1610: "面签",
  1700: "请款",
  1800: "放款",
  1900: "贷后",
  INITIAL_AUDIT: "初审",
  PRE_AUDIT: "预审",
  SUPPLEMENT_MATERIALS: "补充资料",
  APPROVAL: "审批",
  SIGN_CONTRACT: "签约",
  FACE_RECOGNITION: "人脸识别",
  FACE_SIGN: "面签",
  LOAN_REQUEST: "请款审批",
  LOAN_DISBURSEMENT: "放款",
  FUNDER_PRE: "资方预审",
  FIRST_REVIEW: "初审",
  FINAL_REVIEW: "终审",
  FUNDER_REVIEW: "资方审批",
};

// 预审阶段入口项列表 - 定义预审阶段需要完成的各个步骤
export const precheckEntryItems = [
  {
    type: "idInfo",
    code: "ID_CARD",
    title: "身份信息",
    desc: "完善客户身份、证件、联系方式等",
    icon: "account",
    iconClass: "pre-card-icon-customer",
  },
  {
    type: "carInfo",
    code: "VEHICLE",
    title: "车辆信息",
    desc: "完善车辆品牌、型号、年限等",
    icon: "car",
    iconClass: "pre-card-icon-car",
  },
  {
    type: "applyInfo",
    code: "APPLICATION",
    title: "申请信息",
    desc: "完善申请金额、期数、产品等",
    icon: "order",
    iconClass: "pre-card-icon-order",
  },
  {
    type: "authSign",
    code: "AUTH_SIGN",
    title: "签署授权书",
    desc: "签署授权书，授权资方查询征信等",
    icon: "edit-pen",
    iconClass: "pre-card-icon-file",
  },
  {
    type: "submit",
    code: "PENDING_PRECHECK",
    title: "待预审",
    desc: "资料确认完成后提交，进入预审流程",
    icon: "clock",
    iconClass: "pre-card-icon-pending",
  },
];

// 补件阶段入口项列表 - 定义补件阶段需要完成的各个步骤
export const supplementEntryItems = [
  {
    type: "idInfoSupplement",
    code: "CUSTOMER_SUPPLEMENT",
    title: "客户资料",
    desc: "补充客户基本信息、联系方式等",
    icon: "account",
    iconClass: "pre-card-icon-customer",
  },
  {
    type: "carInfoSupplement",
    code: "VEHICLE_SUPPLEMENT",
    title: "车辆资料",
    desc: "补充车辆品牌、型号、年限等",
    icon: "car",
    iconClass: "pre-card-icon-car",
  },
  {
    type: "orderInfoSupplement",
    code: "ORDER_SUPPLEMENT",
    title: "订单信息",
    desc: "补充申请金额、期数、产品等",
    icon: "order",
    iconClass: "pre-card-icon-order",
  },
  {
    type: "fileInfoSupplement",
    code: "FILE_SUPPLEMENT",
    title: "文件信息",
    desc: "上传身份证、行驶证等材料",
    icon: "edit-pen",
    iconClass: "pre-card-icon-file",
  },
  {
    type: "submitSupplement",
    code: "PENDING_SUPPLEMENT",
    title: "待提交",
    desc: "资料补充完成后提交，进入下一环节",
    icon: "clock",
    iconClass: "pre-card-icon-pending",
  },
];

// 审批阶段入口项列表 - 定义审批阶段需要完成的各个步骤
export const approvalEntryItems = [
  {
    type: "approvalProgress",
    code: "APPROVAL_PROGRESS",
    title: "审批进度",
    desc: "查看初审、终审、资方审批处理状态",
    icon: "checkmark-circle",
    iconClass: "pre-card-icon-approval",
  },
  {
    type: "approvalList",
    code: "APPROVAL_LIST",
    title: "审批列表",
    desc: "进入审批列表查看待处理订单",
    icon: "list",
    iconClass: "pre-card-icon-order",
  },
];

// 签约阶段入口项列表 - 定义签约阶段需要完成的各个步骤
export const signingEntryItems = [
  {
    type: "signConfirmAmount",
    code: "CONFIRM_AMOUNT",
    title: "确认额度",
    desc: "确认资方批复的贷款额度和利率",
    icon: "rmb-circle",
    iconClass: "pre-card-icon-customer",
  },
  {
    type: "signBindCard",
    code: "BIND_CARD",
    title: "绑卡",
    desc: "绑定收款银行卡",
    icon: "card",
    iconClass: "pre-card-icon-car",
  },
  {
    type: "videoFaceSign",
    code: "SIGN_CONTRACT",
    title: "合同签约",
    desc: "在线签署贷款合同",
    icon: "edit-pen",
    iconClass: "pre-card-icon-order",
  },
  {
    type: "signGpsAppointment",
    code: "GPS_APPOINTMENT",
    title: "GPS安装预约",
    desc: "预约GPS设备安装时间和地点",
    icon: "map",
    iconClass: "pre-card-icon-file",
  },
  {
    type: "signMortgage",
    code: "MORTGAGE",
    title: "抵押办理",
    desc: "预约或办理车辆抵押登记",
    icon: "lock",
    iconClass: "pre-card-icon-pending",
  },
];

// 请款阶段入口项列表 - 定义请款阶段需要完成的各个步骤
export const loanRequestEntryItems = [
  {
    type: "loanConfirm",
    code: "LOAN_CONFIRM",
    title: "请款确认",
    desc: "确认请款金额、收款信息和请款资料",
    icon: "rmb-circle",
    iconClass: "pre-card-icon-customer",
  },
  {
    type: "loanRequestProgress",
    code: "LOAN_REQUEST_PROGRESS",
    title: "请款进度",
    desc: "查看请款审批与处理进展",
    icon: "map",
    iconClass: "pre-card-icon-approval",
  },
];

// 放款阶段入口项列表 - 定义放款阶段需要完成的各个步骤
export const disbursementEntryItems = [
  {
    type: "disbursementProgress",
    code: "DISBURSEMENT_PROGRESS",
    title: "放款进度",
    desc: "查看放款、GPS安装、抵押办理进展",
    icon: "map",
    iconClass: "pre-card-icon-approval",
  },
  {
    type: "repaymentPlan",
    code: "REPAYMENT_PLAN",
    title: "还款计划",
    desc: "放款后查看还款计划与账单信息",
    icon: "calendar",
    iconClass: "pre-card-icon-order",
  },
];

/**
 * 根据业务节点代码解析对应的流程标签
 * @param code - 业务节点代码
 * @returns 对应的流程标签值
 */
export function resolveFlowTabByNode(code: string | number): string {
  const text = String(code || "");
  const numericCode = Number(text);
  if (Number.isFinite(numericCode)) {
    if (numericCode >= 1300 && numericCode <= 1350) return "supplement";
    if (numericCode >= 1400 && numericCode <= 1500) return "approval";
    if (numericCode >= 1600 && numericCode <= 1660) return "signing";
    if (numericCode >= 1700 && numericCode <= 1799) return "loanRequest";
    if (numericCode >= 1800) return "disbursement";
    return "precheck";
  }
  if (text === "SUPPLEMENT_MATERIALS") return "supplement";
  if (
    ["APPROVAL", "INITIAL_AUDIT", "FINAL_AUDIT", "CAPITAL_APPROVAL"].includes(
      text,
    )
  ) {
    return "approval";
  }

  if (["SIGN_CONTRACT", "PENDING_SIGN", "SIGNING_PROGRESS"].includes(text))
    return "signing";
  if (["LOAN_REQUEST", "PENDING_LOAN_REQUEST"].includes(text))
    return "loanRequest";
  if (["LOAN_DISBURSEMENT", "DISBURSEMENT", "POST_LOAN"].includes(text))
    return "disbursement";
  return "precheck";
}

/**
 * 根据业务节点代码解析页面标题
 * @param code - 业务节点代码
 * @param fallback - 默认标题，默认为"订单详情"
 * @returns 对应的页面标题
 */
export function resolvePageTitle(
  code: string | number,
  fallback = "订单详情",
): string {
  if (!code) return fallback;
  const numericCode = Number(code);
  if (Number.isFinite(numericCode)) {
    if (numericCode >= 1100 && numericCode <= 1250) return "预审阶段";
    if (numericCode >= 1300 && numericCode <= 1350) return "补件阶段";
    if (numericCode >= 1400 && numericCode <= 1500) return "审批阶段";
    if (numericCode >= 1600 && numericCode <= 1660) return "签约阶段";
    if (numericCode >= 1700 && numericCode <= 1799) return "请款阶段";
    if (numericCode >= 1800 && numericCode <= 1899) return "放款阶段";
    if (numericCode === 1900) return "贷后阶段";
  }
  const strCode = String(code);
  if (["PRE_AUDIT", "INITIAL_AUDIT"].includes(strCode)) return "预审阶段";
  if (strCode === "SUPPLEMENT_MATERIALS") return "补件阶段";
  if (["APPROVAL", "FINAL_AUDIT", "CAPITAL_APPROVAL"].includes(strCode))
    return "审批阶段";
  if (["SIGN_CONTRACT", "PENDING_SIGN", "SIGNING_PROGRESS"].includes(strCode))
    return "签约阶段";
  if (["LOAN_REQUEST", "PENDING_LOAN_REQUEST"].includes(strCode))
    return "请款阶段";
  if (["LOAN_DISBURSEMENT", "DISBURSEMENT", "POST_LOAN"].includes(strCode))
    return "放款阶段";
  return fallback;
}

/**
 * 获取状态文本
 * @param val - 状态值
 * @returns 状态文本描述
 */
export function statusText(val: string | number): string {
  return statusMap[val]?.text || (val ? `状态${val}` : "未知");
}

/**
 * 获取状态类型
 * @param val - 状态值
 * @returns 状态类型（success/error/warning/info/default）
 */
export function statusType(val: string | number): string {
  return statusMap[val]?.type || "default";
}

/**
 * 获取业务节点文本
 * @param val - 业务节点代码
 * @returns 业务节点文本描述
 */
export function businessNodeText(val: string | number): string {
  return businessNodeMap[val] || String(val) || "-";
}

/**
 * 格式化额度显示
 * @param val - 额度值
 * @returns 格式化后的额度字符串（万元或元）
 */
export function formatQuota(val: string | number): string {
  if (!val && val !== "0") return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return num >= 10000 ? `${(num / 10000).toFixed(2)}万` : `${num.toFixed(2)}元`;
}

/**
 * 格式化日期显示（只显示日期部分）
 * @param val - 日期字符串
 * @returns 格式化后的日期字符串（YYYY-MM-DD格式）
 */
export function formatDate(val: string): string {
  if (!val) return "";
  return String(val).split(" ")[0];
}
