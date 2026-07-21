import { computed } from "vue";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import {
  buildEntryRouteQuery,
  buildSignRouteQuery,
} from "@/common/carloan-route-query";
import {
  approvalEntryItems,
  businessNodeText,
  disbursementEntryItems,
  loanRequestEntryItems,
  precheckEntryItems,
  signingEntryItems,
  supplementEntryItems,
} from "@/common/carloan/applyDetail-flow";

const ENTRY_NODE_MAP: Record<string, number> = {
  ID_CARD: 1100,
  VEHICLE: 1110,
  APPLICATION: 1120,
  AUTH_SIGN: 1130,
  PENDING_PRECHECK: 1140,
  CUSTOMER_SUPPLEMENT: 1310,
  VEHICLE_SUPPLEMENT: 1320,
  ORDER_SUPPLEMENT: 1330,
  FILE_SUPPLEMENT: 1340,
  PENDING_SUPPLEMENT: 1350,
  CONFIRM_AMOUNT: 1610,
  BIND_CARD: 1620,
  SIGN_CONTRACT: 1630,
  GPS_APPOINTMENT: 1640,
  MORTGAGE: 1650,
};

const SUPPLEMENT_STATUS_FIELD_MAP: Record<string, string> = {
  CUSTOMER_SUPPLEMENT: "isSupplementCustomer",
  VEHICLE_SUPPLEMENT: "isSupplementVehicle",
  ORDER_SUPPLEMENT: "isSupplementOrder",
  FILE_SUPPLEMENT: "isSupplementFile",
};

const SIGN_STEP_TO_STATUS: Record<string, string> = {
  CONFIRM_AMOUNT: "CONFIRMING_AMOUNT",
  BIND_CARD: "BINDING_CARD",
  SIGN_CONTRACT: "SIGNING_CONTRACT",
  GPS_APPOINTMENT: "GPS_APPOINTING",
  MORTGAGE: "MORTGAGING",
};

const SIGN_STATUS_ORDER = [
  "CONFIRMING_AMOUNT",
  "BINDING_CARD",
  "SIGNING_CONTRACT",
  "GPS_APPOINTING",
  "MORTGAGING",
  "SIGNED",
];

interface StageItem {
  code: string;
  type: string;
  label?: string;
}

/**
 * 车贷详情页 — 阶段步骤状态 & 导航
 */
export function useDetailFlow(opts: {
  detail: () => any;
  loading: () => boolean;
  currentNodeCode: () => string;
  activeFlowTab: () => string;
  flowConfig: () => any;
  flowNodes: () => any[];
  entryProgress: () => any;
  signProgress: () => any;
  detailUuid: () => string;
  orderNo: () => string;
  customerDisplayName: () => string;
  customerDisplayPhone: () => string;
  isPreAuditDetail: () => boolean;
  isSupplementDetail: () => boolean;
  isLoanRequestDetail: () => boolean;
  submitting: { value: boolean };
  flowRecordVisible: { value: boolean };
  flowRecordLoading: { value: boolean };
  flowRecordList: { value: any[] };
  detailId: string;
  businessApi: any;
  enrichLifecycleRecords: (records: any[]) => any[];
  handlePreAuditSubmit: () => void;
  handleProgress: () => void;
}) {
  function isFlagDone(value: any) {
    return value === 1 || value === "1" || value === true || value === "true";
  }

  function getSupplementStepDone(code: string) {
    const field = SUPPLEMENT_STATUS_FIELD_MAP[code];
    if (!field) return null;
    return isFlagDone(opts.detail()?.[field]);
  }

  function normalizeSignStatus(status: string) {
    if (!status || status === "PENDING" || status === "SIGNING_PROGRESS") {
      return "CONFIRMING_AMOUNT";
    }
    return status;
  }

  function isNodeDone(nodeCode: number) {
    const currentNodeNum = Number(opts.currentNodeCode());
    if (!Number.isFinite(currentNodeNum) || !nodeCode) return false;
    if (currentNodeNum > nodeCode) return true;
    if (currentNodeNum < nodeCode) return false;
    return false;
  }

  function getSignStepState(code: string) {
    const stepStatus = SIGN_STEP_TO_STATUS[code];
    if (!stepStatus) return null;

    const localStatus = normalizeSignStatus(opts.signProgress()?.status);
    const currentStatusIndex = SIGN_STATUS_ORDER.indexOf(localStatus);
    const stepIndex = SIGN_STATUS_ORDER.indexOf(stepStatus);

    if (currentStatusIndex >= 0 && stepIndex >= 0) {
      if (localStatus === "SIGNED" || stepIndex < currentStatusIndex) return "finish";
      if (stepIndex === currentStatusIndex) return "doing";
      return "pending";
    }

    const stepNodeCode = ENTRY_NODE_MAP[code];
    if (stepNodeCode && isNodeDone(stepNodeCode)) return "finish";
    if (Number(opts.currentNodeCode()) === stepNodeCode) return "doing";
    return "pending";
  }

  function getEntryStepDone(code: string) {
    const signStepState = getSignStepState(code);
    if (signStepState) return signStepState === "finish";

    const supplementDone = getSupplementStepDone(code);
    if (supplementDone !== null) return supplementDone;

    const fc = opts.flowConfig();
    if (fc?.stepStatus) {
      const stepStatus = fc.stepStatus[code];
      if (stepStatus === "COMPLETED" || stepStatus === "DONE") return true;
      if (stepStatus === "PENDING" || stepStatus === "IN_PROGRESS") return false;
    }

    const stepNodeCode = ENTRY_NODE_MAP[code];
    if (stepNodeCode) {
      const nodes = opts.flowNodes();
      if (nodes.length > 0) {
        const node = nodes.find((n: any) => Number(n.nodeCode) === stepNodeCode);
        if (node?.parentNode) {
          return isNodeDone(node.parentNode) || isNodeDone(stepNodeCode);
        }
      }
      return isNodeDone(stepNodeCode);
    }

    const d = opts.detail();
    const ep = opts.entryProgress();
    if (code === "ID_CARD" || code === "CUSTOMER_SUPPLEMENT") {
      return Boolean(ep?.ID_CARD === 1 || opts.detailUuid() || d?.personName || d?.personIdcard || d?.idCard || d?.idcard || d?.personIdCard || d?.customer?.personIdcard || d?.user?.personIdcard);
    }
    if (code === "VEHICLE" || code === "VEHICLE_SUPPLEMENT") {
      return Boolean(d?.vehicle?.plateNumber || d?.plateNumber || d?.vehicleInfo?.plateNumber);
    }
    if (code === "APPLICATION" || code === "ORDER_SUPPLEMENT") {
      return Boolean(d?.periods || d?.pushQuota || d?.amount);
    }
    if (code === "AUTH_SIGN") {
      return Boolean(ep?.AUTH_SIGN === 1 || opts.signProgress()?.status === "SIGNED" || d?.isSignContract === 1 || d?.signStatus === "SIGNED" || d?.authSignStatus === "SIGNED" || d?.authContractStatus === "SIGNED" || d?.authStatus === "SIGNED");
    }
    if (code === "FILE_SUPPLEMENT") {
      return Boolean(d?.fileCount || d?.attachmentCount || d?.materialCount || d?.uploadCount);
    }
    if (["CONFIRM_AMOUNT", "BIND_CARD", "SIGN_CONTRACT", "GPS_APPOINTMENT", "MORTGAGE"].includes(code)) {
      return false;
    }
    return false;
  }

  const stageEntryItems = computed(() => {
    const tab = opts.activeFlowTab() || opts.flowConfig()?.activeTab || "precheck";
    if (tab === "supplement") return supplementEntryItems;
    if (tab === "approval") return approvalEntryItems;
    if (tab === "signing") return signingEntryItems;
    if (tab === "loanRequest") return loanRequestEntryItems;
    if (tab === "disbursement") return disbursementEntryItems;
    return precheckEntryItems;
  });

  const allPreAuditStepsDone = computed(() =>
    stageEntryItems.value
      .filter((item: StageItem) => !["PENDING_PRECHECK", "PENDING_SUPPLEMENT"].includes(item.code))
      .every((item: StageItem) => getEntryStepDone(item.code)),
  );

  const allSupplementStepsDone = computed(() =>
    supplementEntryItems
      .filter((item: StageItem) => item.code !== "PENDING_SUPPLEMENT")
      .every((item: StageItem) => getEntryStepDone(item.code)),
  );

  function getStageStepTag(item: StageItem) {
    if (opts.loading()) return { text: "加载中", type: "info" };
    if (item.code === "PENDING_SUPPLEMENT") {
      return { text: allSupplementStepsDone.value ? "待提交" : "待完善", type: allSupplementStepsDone.value ? "info" : "warning" };
    }
    if (item.code === "PENDING_PRECHECK") {
      return { text: allPreAuditStepsDone.value ? "待提交" : "待完善", type: allPreAuditStepsDone.value ? "info" : "warning" };
    }
    if (["APPROVAL_PROGRESS", "APPROVAL_LIST", "LOAN_REQUEST_PROGRESS", "DISBURSEMENT_PROGRESS", "REPAYMENT_PLAN"].includes(item.code)) {
      return { text: "查看", type: "info" };
    }
    if (item.code === "LOAN_CONFIRM") {
      return { text: opts.isLoanRequestDetail() ? "待确认" : "办理", type: "info" };
    }
    if (["CUSTOMER_SUPPLEMENT", "VEHICLE_SUPPLEMENT", "ORDER_SUPPLEMENT", "FILE_SUPPLEMENT", "CONFIRM_AMOUNT", "BIND_CARD", "SIGN_CONTRACT", "GPS_APPOINTMENT", "MORTGAGE"].includes(item.code)) {
      const isSupplementItem = item.code.includes("SUPPLEMENT");
      const signStepState = getSignStepState(item.code);
      if (signStepState === "finish") return { text: "已完成", type: "success" };
      if (signStepState === "doing") return { text: "进行中", type: "primary" };
      return getEntryStepDone(item.code)
        ? { text: isSupplementItem ? "已补充" : "已完成", type: "success" }
        : { text: isSupplementItem ? "待补充" : "待办理", type: "warning" };
    }
    return getEntryStepDone(item.code) ? { text: "已完成", type: "success" } : { text: "待完善", type: "warning" };
  }

  function goStageStep(item: StageItem) {
    if (["PENDING_PRECHECK", "PENDING_SUPPLEMENT"].includes(item.code)) {
      opts.handlePreAuditSubmit();
      return;
    }
    if (["approvalProgress", "loanRequestProgress", "disbursementProgress"].includes(item.type)) {
      opts.handleProgress();
      return;
    }

    const d = opts.detail();
    const detailRouteQuery = buildEntryRouteQuery({
      uuid: opts.detailUuid(), creditOrderId: opts.orderNo(),
      name: opts.customerDisplayName(), phone: opts.customerDisplayPhone(),
      amount: d?.pushQuota || d?.amount || "", pushQuota: d?.pushQuota || "",
      periods: d?.periods || "", fromEntry: 1,
    });
    const signRouteQuery = buildSignRouteQuery({
      creditOrderId: opts.orderNo(), uuid: opts.detailUuid(),
      customerName: opts.customerDisplayName(), customerPhone: opts.customerDisplayPhone(),
      backUrl: buildRoute(APP_ROUTES.carloan.precheck.applyDetail, {
        id: opts.detailId || d?.id || "", creditOrderId: opts.orderNo(),
        orderNo: opts.orderNo(), uuid: opts.detailUuid(),
        customerName: opts.customerDisplayName(), customerPhone: opts.customerDisplayPhone(),
        nodeCode: opts.currentNodeCode(),
      }),
    });

    const urlMap: Record<string, string> = {
      idInfo: buildRoute(APP_ROUTES.carloan.precheck.idInfo, detailRouteQuery),
      carInfo: buildRoute(APP_ROUTES.carloan.precheck.carInfo, detailRouteQuery),
      applyInfo: buildRoute(APP_ROUTES.carloan.precheck.applyInfo, detailRouteQuery),
      authSign: buildRoute(APP_ROUTES.carloan.signing.videoFaceSign, detailRouteQuery),
      idInfoSupplement: buildRoute(APP_ROUTES.carloan.supplement.idInfoSupplement, detailRouteQuery),
      carInfoSupplement: buildRoute(APP_ROUTES.carloan.supplement.carInfoSupplement, detailRouteQuery),
      orderInfoSupplement: buildRoute(APP_ROUTES.carloan.supplement.orderInfoSupplement, detailRouteQuery),
      fileInfoSupplement: buildRoute(APP_ROUTES.carloan.supplement.fileInfoSupplement, detailRouteQuery),
      signConfirmAmount: buildRoute(APP_ROUTES.carloan.signing.signConfirmAmount, signRouteQuery),
      signBindCard: buildRoute(APP_ROUTES.carloan.signing.signBindCard, signRouteQuery),
      videoFaceSign: buildRoute(APP_ROUTES.carloan.signing.videoFaceSign, signRouteQuery),
      signGpsAppointment: buildRoute(APP_ROUTES.carloan.signing.signGpsAppointment, signRouteQuery),
      signMortgage: buildRoute(APP_ROUTES.carloan.signing.signMortgage, signRouteQuery),
      approvalProgress: buildRoute(APP_ROUTES.carloan.precheck.applyProgress, { id: opts.detailId || d?.id || "", creditOrderId: opts.orderNo(), uuid: opts.detailUuid(), customerName: opts.customerDisplayName(), customerPhone: opts.customerDisplayPhone(), nodeCode: opts.currentNodeCode() }),
      approvalList: buildRoute(APP_ROUTES.carloan.approval.approvalList, detailRouteQuery),
      loanConfirm: buildRoute(APP_ROUTES.carloan.postloan.loanConfirm, { applicationId: opts.detailId || d?.id || "", applicationNo: opts.orderNo(), creditOrderId: opts.orderNo(), uuid: opts.detailUuid(), customerName: opts.customerDisplayName(), customerPhone: opts.customerDisplayPhone() }),
      loanRequestProgress: buildRoute(APP_ROUTES.carloan.precheck.applyProgress, { id: opts.detailId || d?.id || "", creditOrderId: opts.orderNo(), uuid: opts.detailUuid(), customerName: opts.customerDisplayName(), customerPhone: opts.customerDisplayPhone(), nodeCode: opts.currentNodeCode() }),
      disbursementProgress: buildRoute(APP_ROUTES.carloan.precheck.applyProgress, { id: opts.detailId || d?.id || "", creditOrderId: opts.orderNo(), uuid: opts.detailUuid(), customerName: opts.customerDisplayName(), customerPhone: opts.customerDisplayPhone(), nodeCode: opts.currentNodeCode() }),
      repaymentPlan: buildRoute(APP_ROUTES.carloan.postloan.repaymentPlan, { applicationId: opts.detailId || d?.id || "", applicationNo: opts.orderNo(), creditOrderId: opts.orderNo(), uuid: opts.detailUuid(), customerName: opts.customerDisplayName(), customerPhone: opts.customerDisplayPhone() }),
    };
    const url = urlMap[item.type];
    if (url) { uni.navigateTo({ url }); return; }
    uni.showToast({ title: "当前阶段请查看进展", icon: "none" });
  }

  return {
    stageEntryItems,
    allPreAuditStepsDone,
    allSupplementStepsDone,
    getEntryStepDone,
    getSignStepState,
    getStageStepTag,
    goStageStep,
    ENTRY_NODE_MAP,
  };
}
