import { businessNodeText } from "@/common/carloan/applyDetail-flow";

const APPROVAL_STAGE_NODE_MAP: Record<string, string> = {
  RISK_PRE: "1200",
  FUNDER_PRE: "1250",
  SUPPLEMENT: "1300",
  FIRST_REVIEW: "1400",
  FINAL_REVIEW: "1450",
  FUNDER_REVIEW: "1500",
  LOAN_REQUEST: "1700",
};

function normalizeApprovalStageNode(stage: string) {
  const normalizedStage = String(stage || "").trim();
  if (!normalizedStage) return "";
  if (/^\d+$/.test(normalizedStage)) return normalizedStage;
  return APPROVAL_STAGE_NODE_MAP[normalizedStage] || "";
}

function formatApprovalTime(value: any) {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) return text;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

/**
 * 审批流程元数据：将 approval 记录按节点聚合
 */
export function buildLifecycleApprovalMeta(detail: any) {
  const metaMap: Record<string, any> = {};
  const approvals = Array.isArray(detail?.approvals) ? detail.approvals : [];

  approvals.forEach((approval: any) => {
    const nodeCode = normalizeApprovalStageNode(approval?.stage);
    if (!nodeCode) return;
    const prev = metaMap[nodeCode];
    const currentTime = new Date(approval?.createdAt || 0).getTime() || 0;
    const prevTime = new Date(prev?.rawCreatedAt || 0).getTime() || 0;
    if (!prev || currentTime >= prevTime) {
      metaMap[nodeCode] = {
        approveName: approval?.approverName || prev?.approveName || "",
        approvalTime: formatApprovalTime(approval?.createdAt) || prev?.approvalTime || "",
        approvalReason: approval?.opinion || prev?.approvalReason || "",
        rawCreatedAt: approval?.createdAt || "",
      };
    }
  });

  if (detail?.supplementReason) {
    metaMap["1300"] = {
      ...(metaMap["1300"] || {}),
      approvalReason: metaMap["1300"]?.approvalReason || detail.supplementReason,
    };
  }
  if (detail?.disbursement?.remark) {
    metaMap["1800"] = {
      ...(metaMap["1800"] || {}),
      approvalReason: metaMap["1800"]?.approvalReason || detail.disbursement.remark,
    };
  }
  return metaMap;
}

/**
 * 给 lifecycle 记录补充审批元数据
 */
export function enrichLifecycleRecords(detail: any, records: any[]) {
  const approvalMeta = buildLifecycleApprovalMeta(detail);
  return (Array.isArray(records) ? records : []).map((item: any) => {
    const nodeCode = String(item?.currentNode || "");
    const extra = approvalMeta[nodeCode] || {};
    return {
      ...item,
      currentNodeName: item?.currentNodeName || businessNodeText(nodeCode) || item?.nodeName || nodeCode,
      approveName: item?.approveName || extra.approveName || "",
      approvalTime: item?.approvalTime || extra.approvalTime || "",
      approvalReason: item?.approvalReason || extra.approvalReason || "",
    };
  });
}
