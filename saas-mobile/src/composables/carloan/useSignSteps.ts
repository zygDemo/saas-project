import { reactive, ref } from "vue";
import { useCarloanApi } from "@/api/carloan";

export interface CustomerInfo {
  name: string;
  idCard: string;
  phone: string;
  amount: string;
  rawAmount: string;
  uuid: string;
  creditOrderId: string;
}

export interface StepItem {
  code: string;
  label: string;
  status: "pending" | "doing" | "finish";
}

const SIGN_PROGRESS_KEY = "SIGN_PROGRESS_MAP";
const ENTRY_PROGRESS_KEY = "ENTRY_PROGRESS_MAP";

/**
 * 签约步骤管理：人脸认证 + 签约流程
 */
export function useSignSteps() {
  const businessApi = useCarloanApi();

  const customerInfo = reactive<CustomerInfo>({
    name: "", idCard: "", phone: "", amount: "", rawAmount: "", uuid: "", creditOrderId: "",
  });

  const isCreditMode = ref(false);
  const currentStep = ref(0);
  const loading = ref(false);
  const signingLoading = ref(false);
  const authorizeSignLoading = ref(false);
  const signRecordId = ref("");
  const backUrl = ref("");
  const authSignDone = ref(false);
  const contractSignDone = ref(false);
  const contractSignUrl = ref("");
  const faceResult = ref<any>(null);
  const contractFiles = ref<any[]>([]);

  const stepList = ref<StepItem[]>([
    { code: "credit", label: "征信授权", status: "pending" },
    { code: "face", label: "人脸认证", status: "pending" },
    { code: "auth", label: "签约授权", status: "pending" },
    { code: "contract", label: "合同签署", status: "pending" },
  ]);

  function saveSignProgress(status: string) {
    try {
      const map = uni.getStorageSync(SIGN_PROGRESS_KEY) || {};
      const key = customerInfo.creditOrderId || customerInfo.uuid;
      if (key) {
        map[key] = { status, updatedAt: Date.now() };
        uni.setStorageSync(SIGN_PROGRESS_KEY, map);
      }
    } catch { /* ignore */ }
  }

  function saveEntryProgress(code: string) {
    try {
      const map = uni.getStorageSync(ENTRY_PROGRESS_KEY) || {};
      const key = customerInfo.creditOrderId || customerInfo.uuid;
      if (key) {
        if (!map[key]) map[key] = {};
        map[key][code] = 1;
        uni.setStorageSync(ENTRY_PROGRESS_KEY, map);
      }
    } catch { /* ignore */ }
  }

  function setCreditSteps() {
    currentStep.value = 0;
    stepList.value.forEach((s) => {
      if (s.code === "credit") s.status = "doing";
      else s.status = "pending";
    });
  }

  function setFaceSignSteps(status?: string) {
    const normalized = status || "CONFIRMING_AMOUNT";
    const statusOrder = ["CONFIRMING_AMOUNT", "BINDING_CARD", "SIGNING_CONTRACT", "GPS_APPOINTING", "MORTGAGING", "SIGNED"];
    const currentIdx = statusOrder.indexOf(normalized);

    stepList.value = [
      { code: "credit", label: "征信授权", status: authSignDone.value ? "finish" : "pending" },
      { code: "face", label: "人脸认证", status: authSignDone.value ? "finish" : "pending" },
      {
        code: "auth", label: "签约授权", status:
          authSignDone.value ? "finish" :
          normalized === "CONFIRMING_AMOUNT" ? "doing" : "pending",
      },
      {
        code: "contract", label: "合同签署", status:
          contractSignDone.value ? "finish" :
          currentIdx >= 3 ? "doing" : "pending",
      },
    ];

    // 确定当前步骤（模板使用数字比较）
    if (contractSignDone.value) currentStep.value = 3;
    else if (currentIdx >= 3) currentStep.value = 3;
    else if (currentIdx >= 2) currentStep.value = 2;
    else if (currentIdx >= 1) currentStep.value = 1;
    else currentStep.value = 0;
  }

  async function loadCustomerInfo(creditOrderId: string) {
    if (!creditOrderId) return;
    loading.value = true;
    try {
      const res = await businessApi.getCreditDetailByOrderId(creditOrderId);
      const data = res?.data || res || {};
      customerInfo.name = data.customerName || data.name || "";
      customerInfo.idCard = data.personIdcard || data.idCard || "";
      customerInfo.phone = data.phone || data.mobile || "";
      customerInfo.amount = data.pushQuota || data.amount || "";
      customerInfo.rawAmount = data.pushQuota || data.amount || "";
      customerInfo.uuid = data.uuid || "";
      customerInfo.creditOrderId = creditOrderId;
    } catch {
      uni.showToast({ title: "获取客户信息失败", icon: "none" });
    } finally {
      loading.value = false;
    }
  }

  async function fetchCreditDetail(uuid: string) {
    if (!uuid) return null;
    try {
      const res = await businessApi.getCreditDetail(uuid);
      return res?.data || res || null;
    } catch { return null; }
  }

  async function fetchCreditDetailByOrderId(creditOrderId: string) {
    if (!creditOrderId) return null;
    try {
      const res = await businessApi.getCreditDetailByOrderId(creditOrderId);
      return res?.data || res || null;
    } catch { return null; }
  }

  async function refreshSignStatus() {
    const orderId = customerInfo.creditOrderId;
    if (!orderId) return;
    try {
      const data = await fetchCreditDetailByOrderId(orderId);
      if (data) {
        authSignDone.value = Boolean(data.authSignStatus === "SIGNED" || data.isSignContract === 1 || data.signStatus === "SIGNED");
        contractSignDone.value = Boolean(data.signStatus === "SIGNED" || data.contractStatus === "SIGNED");
        if (data.signRecordId) signRecordId.value = String(data.signRecordId);
        setFaceSignSteps(data.signStatus || data.signProgress);
      }
    } catch { /* ignore */ }
  }

  function updateStepStatus(code: string, status: "pending" | "doing" | "finish") {
    const step = stepList.value.find((s) => s.code === code);
    if (step) step.status = status;
    // 同步 currentStep 数字索引
    const codeMap: Record<string, number> = { credit: 0, face: 1, auth: 2, contract: 3 };
    if (codeMap[code] !== undefined && status === "doing") {
      currentStep.value = codeMap[code];
    }
  }

  function getStepClass(step: StepItem) {
    if (step.status === "finish") return "step-finish";
    if (step.status === "doing") return "step-doing";
    return "step-pending";
  }

  function formatAmount(val: string | number) {
    const n = Number(val);
    if (!Number.isFinite(n)) return String(val || "");
    return n.toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  return {
    customerInfo, isCreditMode, currentStep, loading, signingLoading,
    authorizeSignLoading, signRecordId, backUrl, authSignDone, contractSignDone,
    contractSignUrl, faceResult, contractFiles, stepList,
    saveSignProgress, saveEntryProgress, setCreditSteps, setFaceSignSteps,
    loadCustomerInfo, fetchCreditDetail, fetchCreditDetailByOrderId,
    refreshSignStatus, updateStepStatus, getStepClass, formatAmount,
  };
}
