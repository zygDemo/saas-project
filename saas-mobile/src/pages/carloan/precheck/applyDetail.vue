<template>
  <app-page :nav-title="pageTitle">
    <view v-if="detail" class="pre-audit-detail-page">
      <view class="pre-customer-card">
        <view class="pre-customer-header">
          <view class="pre-avatar">
            {{ (customerDisplayName || "?").charAt(0) }}
          </view>
          <view class="pre-customer-info">
            <text class="pre-customer-name">{{
              customerDisplayName || "未命名客户"
            }}</text>
            <text class="pre-customer-phone">{{
              customerDisplayPhone || "-"
            }}</text>
          </view>
          <view class="pre-progress-btn" @click="handleProgress">
            <u-icon name="map" size="28" color="var(--u-type-primary)" />
            <text class="pre-progress-text">查看进展</text>
            <u-icon name="arrow-right" size="24" color="#c4c7cc" />
          </view>
        </view>
        <view v-if="orderNo" class="pre-order-row">
          <text class="pre-order-label">订单号</text>
          <text class="pre-order-value">{{ orderNo }}</text>
        </view>
        <view v-if="latestRemark" class="pre-remark-inline">
          <text class="pre-remark-inline__label">审批备注</text>
          <text class="pre-remark-inline__value">{{ latestRemark }}</text>
        </view>
      </view>

      <scroll-view scroll-x class="pre-flow-scroll" :show-scrollbar="false">
        <view class="pre-flow-tabs">
          <view
            v-for="tab in flowTabList"
            :key="tab.value"
            class="pre-flow-tab"
            :class="{ 'pre-flow-tab--active': activeFlowTab === tab.value }"
            @click="activeFlowTab = tab.value"
          >
            <text class="pre-flow-tab__label">{{ tab.label }}</text>
            <view
              v-if="activeFlowTab === tab.value"
              class="pre-flow-tab__indicator"
            />
          </view>
        </view>
      </scroll-view>

      <view class="pre-section-title">{{ activeStageTitle }}事项</view>

      <view class="pre-supplement-list">
        <view
          v-for="item in stageEntryItems"
          :key="item.type"
          class="pre-supplement-card"
          :class="{
            'pre-supplement-card--submit': [
              'PENDING_PRECHECK',
              'PENDING_SUPPLEMENT',
            ].includes(item.code),
          }"
          @click="goStageStep(item)"
        >
          <view class="pre-card-icon" :class="item.iconClass">
            <u-icon :name="item.icon" size="44" color="#fff" />
          </view>
          <view class="pre-card-body">
            <text class="pre-card-title">{{ item.title }}</text>
            <text class="pre-card-desc">{{ item.desc }}</text>
          </view>
          <view class="pre-card-status">
            <u-tag
              :text="getStageStepTag(item).text"
              :type="getStageStepTag(item).type"
              size="mini"
              plain
            />
          </view>
          <view class="pre-card-arrow">
            <u-button
              v-if="
                ['PENDING_PRECHECK', 'PENDING_SUPPLEMENT'].includes(item.code)
              "
              type="primary"
              size="mini"
              :loading="submitting"
              @click.stop="handlePreAuditSubmit"
            >
              提交
            </u-button>
            <u-icon v-else name="arrow-right" size="32" color="#c4c7cc" />
          </view>
        </view>
      </view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading && !detail" class="loading-wrap">
      <u-loading mode="circle" size="48" />
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && !detail" class="empty-wrap">
      <u-empty text="暂无数据" mode="data" />
    </view>
    <FlowRecordPopup
      v-model:visible="flowRecordVisible"
      :loading="flowRecordLoading"
      :records="flowRecordList"
      :get-node-label="businessNodeText"
    />
  </app-page>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import {
  buildEntryRouteQuery,
  buildSignRouteQuery,
} from "@/common/carloan-route-query";
import { useCarloanStore } from "@/stores/carloan";
import FlowRecordPopup from "./components/FlowRecordPopup.vue";
import {
  approvalEntryItems,
  businessNodeText,
  disbursementEntryItems,
  flowTabList,
  loanRequestEntryItems,
  precheckEntryItems,
  resolveFlowTabByNode,
  resolvePageTitle,
  signingEntryItems,
  supplementEntryItems,
} from "./applyDetail-flow";

const carloanStore = useCarloanStore();
const businessApi = useCarloanApi();

const detail = ref(null);
const loading = ref(true);
const submitting = ref(false);
const flowRecordVisible = ref(false);
const flowRecordLoading = ref(false);
const flowRecordList = ref([]);
const activeFlowTab = ref("precheck");
const flowConfig = ref({});
const flowNodes = ref([]);
let detailId = "";

function safeDecode(value) {
  let result = String(value || "").replace(/\+/g, " ");
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(result);
      if (decoded === result) break;
      result = decoded;
    } catch {
      break;
    }
  }
  return result;
}

function normalizeRouteQuery(options = {}) {
  return Object.entries(options).reduce((query, [key, value]) => {
    query[key] = safeDecode(value);
    return query;
  }, {});
}

function buildRouteFallbackDetail() {
  return {
    id: detailId,
    creditOrderId: carloanStore.pageContext.creditOrderId,
    orderNo: carloanStore.pageContext.creditOrderId,
    name: carloanStore.pageContext.customerName,
    customerName: carloanStore.pageContext.customerName,
    phone: carloanStore.pageContext.customerPhone,
    telephone: carloanStore.pageContext.customerPhone,
    nodeCode: carloanStore.pageContext.nodeCode,
  };
}

function hasDetailPayload(payload) {
  return Boolean(
    payload &&
    (payload.id ||
      payload.uuid ||
      payload.customerUuid ||
      payload.userUuid ||
      payload.creditOrderId ||
      payload.orderNo ||
      payload.applicationNo ||
      payload.name ||
      payload.customerName),
  );
}

function pickDetailUuid(payload = {}) {
  return String(
    payload.uuid ||
      payload.customerUuid ||
      payload.userUuid ||
      payload.user?.uuid ||
      payload.customer?.uuid ||
      "",
  );
}

function normalizeDetailPayload(payload = {}) {
  const fallback = buildRouteFallbackDetail();
  const uuid = pickDetailUuid(payload) || carloanStore.pageContext.uuid;
  return {
    ...fallback,
    ...payload,
    uuid,
    id: payload.id || fallback.id,
    creditOrderId:
      payload.creditOrderId ||
      payload.orderNo ||
      payload.applicationNo ||
      fallback.creditOrderId,
    orderNo:
      payload.orderNo ||
      payload.creditOrderId ||
      payload.applicationNo ||
      fallback.orderNo,
    name:
      payload.name ||
      payload.customerName ||
      payload.personName ||
      fallback.name,
    customerName:
      payload.customerName ||
      payload.name ||
      payload.personName ||
      fallback.customerName,
    phone:
      payload.phone || payload.telephone || payload.mobile || fallback.phone,
    telephone:
      payload.telephone ||
      payload.phone ||
      payload.mobile ||
      fallback.telephone,
    nodeCode:
      payload.nodeCode ||
      payload.currentNode ||
      payload.businessNode ||
      fallback.nodeCode,
  };
}

async function loadFlowConfig(nodeCode) {
  if (!nodeCode) return;
  try {
    const [configRes, nodesRes] = await Promise.all([
      businessApi.getFlowConfig(nodeCode),
      businessApi.getFlowNodes(),
    ]);
    if (configRes?.code === 200 && configRes?.data) {
      flowConfig.value = configRes.data;
    }
    if (nodesRes?.code === 200 && Array.isArray(nodesRes.data)) {
      flowNodes.value = nodesRes.data;
    }
  } catch (err) {
    console.warn("获取流程节点配置失败:", err);
  }
}

async function loadDetail() {
  const creditOrderId = carloanStore.pageContext.creditOrderId;
  const fallback = buildRouteFallbackDetail();

  if (!creditOrderId && !detailId) {
    detail.value = hasDetailPayload(fallback) ? fallback : null;
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    let res = null;
    if (creditOrderId) {
      res = await businessApi.getCreditDetailByOrderId(creditOrderId);
    } else if (detailId) {
      res = await businessApi.getCreditDetail(detailId);
    }

    const data = res?.data || res || {};
    detail.value = normalizeDetailPayload(
      hasDetailPayload(data) ? data : fallback,
    );
    if (detail.value?.uuid && !carloanStore.pageContext.uuid) {
      carloanStore.pageContext.uuid = String(detail.value.uuid);
    }
    // 以接口返回的 nodeCode 为准，回写 store
    if (detail.value?.nodeCode) {
      carloanStore.pageContext.nodeCode = String(detail.value.nodeCode);
    }
    // 加载流程节点配置
    await loadFlowConfig(detail.value.nodeCode);
  } catch (err) {
    console.warn("获取订单详情失败:", err);
    detail.value = hasDetailPayload(fallback) ? fallback : null;
    uni.showToast({ title: "获取详情失败，已显示基础信息", icon: "none" });
  } finally {
    loading.value = false;
  }
}

let initialLoaded = false;

onLoad((options = {}) => {
  const query = normalizeRouteQuery(options);
  detailId = query.id || "";
  carloanStore.syncFromRouteQuery(query);
  activeFlowTab.value = resolveFlowTabByNode(carloanStore.pageContext.nodeCode);
  loadDetail();
  initialLoaded = true;
});

onShow(() => {
  // 从子页面返回时重新加载详情，获取最新 currentNode
  if (initialLoaded) {
    loadDetail();
  }
});

const customerDisplayName = computed(
  () =>
    detail.value?.name ||
    detail.value?.customerName ||
    detail.value?.personName ||
    carloanStore.pageContext.customerName ||
    "",
);

const customerDisplayPhone = computed(
  () =>
    detail.value?.phone ||
    detail.value?.telephone ||
    detail.value?.mobile ||
    carloanStore.pageContext.customerPhone ||
    "",
);

const orderNo = computed(
  () =>
    detail.value?.creditOrderId ||
    detail.value?.orderNo ||
    detail.value?.applicationNo ||
    carloanStore.pageContext.creditOrderId ||
    "",
);

const latestRemark = computed(() => {
  const approvals = Array.isArray(detail.value?.approvals)
    ? detail.value.approvals
    : [];
  const latestApproval = approvals.find((item) => item?.opinion);
  return (
    detail.value?.approvalRemark ||
    latestApproval?.opinion ||
    detail.value?.remark ||
    detail.value?.order?.remark ||
    ""
  );
});

const detailUuid = computed(
  () =>
    carloanStore.pageContext.uuid || pickDetailUuid(detail.value || {}) || "",
);

const entryProgress = computed(() => {
  try {
    const progressMap = uni.getStorageSync("ENTRY_PROGRESS_MAP") || {};
    return progressMap[orderNo.value] || progressMap[detailUuid.value] || {};
  } catch {
    return {};
  }
});

const signProgress = computed(() => {
  try {
    const progressMap = uni.getStorageSync("SIGN_PROGRESS_MAP") || {};
    return progressMap[orderNo.value] || progressMap[detailUuid.value] || {};
  } catch {
    return {};
  }
});

const currentNodeCode = computed(() =>
  String(
    carloanStore.pageContext.nodeCode ||
      detail.value?.nodeCode ||
      detail.value?.currentNode ||
      detail.value?.businessNode ||
      "",
  ),
);

const isPreAuditDetail = computed(() =>
  ["1100", "1200", "PRE_AUDIT", "INITIAL_AUDIT"].includes(
    currentNodeCode.value,
  ),
);

const isSupplementDetail = computed(() =>
  ["1300", "1310", "1320", "1330", "1340", "SUPPLEMENT_MATERIALS"].includes(
    currentNodeCode.value,
  ),
);

const isLoanRequestDetail = computed(() => {
  const code = currentNodeCode.value;
  const numericCode = Number(code);
  return (
    (Number.isFinite(numericCode) &&
      numericCode >= 1700 &&
      numericCode <= 1799) ||
    ["LOAN_REQUEST", "PENDING_LOAN_REQUEST"].includes(code)
  );
});

/** 根据节点状态获取页面标题 */
const pageTitle = computed(() =>
  resolvePageTitle(
    currentNodeCode.value,
    isPreAuditDetail.value ? "预审阶段" : "订单详情",
  ),
);

const activeStageTitle = computed(
  () =>
    flowTabList.find((tab) => tab.value === activeFlowTab.value)?.label ||
    "阶段",
);

const stageEntryItems = computed(() => {
  if (activeFlowTab.value === "supplement") return supplementEntryItems;
  if (activeFlowTab.value === "approval") return approvalEntryItems;
  if (activeFlowTab.value === "signing") return signingEntryItems;
  if (activeFlowTab.value === "loanRequest") return loanRequestEntryItems;
  if (activeFlowTab.value === "disbursement") return disbursementEntryItems;
  return precheckEntryItems;
});

// 入口步骤 code → 流程节点 nodeCode 映射（以接口为准）
const ENTRY_NODE_MAP = {
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

/** 根据接口节点数据判断某个节点是否已完成 */
function isNodeDone(nodeCode) {
  const currentNodeNum = Number(currentNodeCode.value);
  if (!Number.isFinite(currentNodeNum) || !nodeCode) return false;

  // 顺序节点：当前节点 > 该节点 → 已完成
  if (currentNodeNum > nodeCode) return true;
  if (currentNodeNum < nodeCode) return false;

  // currentNodeNum === nodeCode → 当前正在进行，未完成
  return false;
}

function getEntryStepDone(code) {
  // 1. 优先使用接口返回的 flowConfig.stepStatus
  if (flowConfig.value && flowConfig.value.stepStatus) {
    const stepStatus = flowConfig.value.stepStatus[code];
    if (stepStatus === "COMPLETED" || stepStatus === "DONE") return true;
    if (stepStatus === "PENDING" || stepStatus === "IN_PROGRESS") return false;
  }

  // 2. 根据 currentNode 与 ENTRY_NODE_MAP 的节点数值比较（不依赖 flowNodes 异步数据）
  const stepNodeCode = ENTRY_NODE_MAP[code];
  if (stepNodeCode) {
    // 查 flowNodes 判断是否并行子节点（已加载时）
    if (flowNodes.value.length > 0) {
      const node = flowNodes.value.find((n) => Number(n.nodeCode) === stepNodeCode);
      if (node?.parentNode) {
        // 并行子节点：父节点已过 或 自身节点已过 → 已完成
        return isNodeDone(node.parentNode) || isNodeDone(stepNodeCode);
      }
    }
    // 顺序节点：直接比较
    return isNodeDone(stepNodeCode);
  }

  if (code === "ID_CARD" || code === "CUSTOMER_SUPPLEMENT") {
    return Boolean(
      entryProgress.value?.ID_CARD === 1 ||
      detailUuid.value ||
      detail.value?.personName ||
      detail.value?.personIdcard ||
      detail.value?.idCard ||
      detail.value?.idcard ||
      detail.value?.personIdCard ||
      detail.value?.customer?.personIdcard ||
      detail.value?.user?.personIdcard,
    );
  }
  if (code === "VEHICLE" || code === "VEHICLE_SUPPLEMENT") {
    return Boolean(
      detail.value?.vehicle?.plateNumber ||
      detail.value?.plateNumber ||
      detail.value?.vehicleInfo?.plateNumber,
    );
  }
  if (code === "APPLICATION" || code === "ORDER_SUPPLEMENT") {
    return Boolean(
      detail.value?.periods || detail.value?.pushQuota || detail.value?.amount,
    );
  }
  if (code === "AUTH_SIGN") {
    return Boolean(
      entryProgress.value?.AUTH_SIGN === 1 ||
      signProgress.value?.status === "SIGNED" ||
      detail.value?.isSignContract === 1 ||
      detail.value?.signStatus === "SIGNED" ||
      detail.value?.authSignStatus === "SIGNED" ||
      detail.value?.authContractStatus === "SIGNED" ||
      detail.value?.authStatus === "SIGNED",
    );
  }
  if (code === "FILE_SUPPLEMENT") {
    return Boolean(
      detail.value?.fileCount ||
      detail.value?.attachmentCount ||
      detail.value?.materialCount ||
      detail.value?.uploadCount,
    );
  }
  if (
    [
      "CONFIRM_AMOUNT",
      "BIND_CARD",
      "SIGN_CONTRACT",
      "GPS_APPOINTMENT",
      "MORTGAGE",
    ].includes(code)
  ) {
    return false;
  }
  return false;
}

const allPreAuditStepsDone = computed(() =>
  stageEntryItems.value
    .filter(
      (item) => !["PENDING_PRECHECK", "PENDING_SUPPLEMENT"].includes(item.code),
    )
    .every((item) => getEntryStepDone(item.code)),
);

function getStageStepTag(item) {
  // 数据加载中时显示占位状态，避免用旧 store 值渲染错误状态
  if (loading.value) {
    return { text: "加载中", type: "info" };
  }
  if (["PENDING_PRECHECK", "PENDING_SUPPLEMENT"].includes(item.code)) {
    return {
      text: allPreAuditStepsDone.value ? "待提交" : "待完善",
      type: allPreAuditStepsDone.value ? "info" : "warning",
    };
  }
  if (
    [
      "APPROVAL_PROGRESS",
      "APPROVAL_LIST",
      "LOAN_REQUEST_PROGRESS",
      "DISBURSEMENT_PROGRESS",
      "REPAYMENT_PLAN",
    ].includes(item.code)
  ) {
    return { text: "查看", type: "info" };
  }
  if (item.code === "LOAN_CONFIRM") {
    return {
      text: isLoanRequestDetail.value ? "待确认" : "办理",
      type: "info",
    };
  }
  if (
    [
      "CONFIRM_AMOUNT",
      "BIND_CARD",
      "SIGN_CONTRACT",
      "GPS_APPOINTMENT",
      "MORTGAGE",
    ].includes(item.code)
  ) {
    return getEntryStepDone(item.code)
      ? { text: "已完成", type: "success" }
      : { text: "待办理", type: "info" };
  }
  return getEntryStepDone(item.code)
    ? { text: "已完成", type: "success" }
    : { text: "待完善", type: "warning" };
}

function goStageStep(item) {
  if (["PENDING_PRECHECK", "PENDING_SUPPLEMENT"].includes(item.code)) {
    handlePreAuditSubmit();
    return;
  }
  if (
    [
      "approvalProgress",
      "loanRequestProgress",
      "disbursementProgress",
    ].includes(item.type)
  ) {
    handleProgress();
    return;
  }

  const detailRouteQuery = buildEntryRouteQuery({
    uuid: detailUuid.value,
    creditOrderId: orderNo.value,
    name: customerDisplayName.value,
    phone: customerDisplayPhone.value,
    amount: detail.value?.pushQuota || detail.value?.amount || "",
    pushQuota: detail.value?.pushQuota || "",
    periods: detail.value?.periods || "",
    fromEntry: 1,
  });
  const signRouteQuery = buildSignRouteQuery({
    creditOrderId: orderNo.value,
    uuid: detailUuid.value,
    customerName: customerDisplayName.value,
    customerPhone: customerDisplayPhone.value,
  });
  const urlMap = {
    idInfo: buildRoute(APP_ROUTES.carloan.precheck.idInfo, detailRouteQuery),
    carInfo: buildRoute(APP_ROUTES.carloan.precheck.carInfo, detailRouteQuery),
    applyInfo: buildRoute(
      APP_ROUTES.carloan.precheck.applyInfo,
      detailRouteQuery,
    ),
    authSign: buildRoute(
      APP_ROUTES.carloan.signing.authSign,
      detailRouteQuery,
    ),
    idInfoSupplement: buildRoute(
      APP_ROUTES.carloan.supplement.idInfoSupplement,
      detailRouteQuery,
    ),
    carInfoSupplement: buildRoute(
      APP_ROUTES.carloan.supplement.carInfoSupplement,
      detailRouteQuery,
    ),
    orderInfoSupplement: buildRoute(
      APP_ROUTES.carloan.supplement.orderInfoSupplement,
      detailRouteQuery,
    ),
    fileInfoSupplement: buildRoute(
      APP_ROUTES.carloan.supplement.fileInfoSupplement,
      detailRouteQuery,
    ),
    signConfirmAmount: buildRoute(
      APP_ROUTES.carloan.signing.signConfirmAmount,
      signRouteQuery,
    ),
    signBindCard: buildRoute(
      APP_ROUTES.carloan.signing.signBindCard,
      signRouteQuery,
    ),
    videoFaceSign: buildRoute(
      APP_ROUTES.carloan.signing.videoFaceSign,
      signRouteQuery,
    ),
    signGpsAppointment: buildRoute(
      APP_ROUTES.carloan.signing.signGpsAppointment,
      signRouteQuery,
    ),
    signMortgage: buildRoute(
      APP_ROUTES.carloan.signing.signMortgage,
      signRouteQuery,
    ),
    approvalProgress: buildRoute(APP_ROUTES.carloan.precheck.applyProgress, {
      id: detailId || detail.value?.id || "",
      creditOrderId: orderNo.value,
      uuid: detailUuid.value,
      customerName: customerDisplayName.value,
      customerPhone: customerDisplayPhone.value,
      nodeCode: currentNodeCode.value,
    }),
    approvalList: buildRoute(
      APP_ROUTES.carloan.approval.approvalList,
      detailRouteQuery,
    ),
    loanConfirm: buildRoute(APP_ROUTES.carloan.postloan.loanConfirm, {
      applicationId: detailId || detail.value?.id || "",
      applicationNo: orderNo.value,
      creditOrderId: orderNo.value,
      uuid: detailUuid.value,
      customerName: customerDisplayName.value,
      customerPhone: customerDisplayPhone.value,
    }),
    loanRequestProgress: buildRoute(APP_ROUTES.carloan.precheck.applyProgress, {
      id: detailId || detail.value?.id || "",
      creditOrderId: orderNo.value,
      uuid: detailUuid.value,
      customerName: customerDisplayName.value,
      customerPhone: customerDisplayPhone.value,
      nodeCode: currentNodeCode.value,
    }),
    disbursementProgress: buildRoute(
      APP_ROUTES.carloan.precheck.applyProgress,
      {
        id: detailId || detail.value?.id || "",
        creditOrderId: orderNo.value,
        uuid: detailUuid.value,
        customerName: customerDisplayName.value,
        customerPhone: customerDisplayPhone.value,
        nodeCode: currentNodeCode.value,
      },
    ),
    repaymentPlan: buildRoute(APP_ROUTES.carloan.postloan.repaymentPlan, {
      applicationId: detailId || detail.value?.id || "",
      applicationNo: orderNo.value,
      creditOrderId: orderNo.value,
      uuid: detailUuid.value,
      customerName: customerDisplayName.value,
      customerPhone: customerDisplayPhone.value,
    }),
  };
  const url = urlMap[item.type];
  if (url) {
    uni.navigateTo({ url });
    return;
  }
  uni.showToast({ title: "当前阶段请查看进展", icon: "none" });
}

async function handleProgress() {
  const lifecycleId =
    detailId ||
    detail.value?.id ||
    detail.value?.applicationId ||
    orderNo.value;
  if (!lifecycleId) {
    uni.showToast({ title: "缺少订单编号", icon: "none" });
    return;
  }
  flowRecordVisible.value = true;
  flowRecordLoading.value = true;
  flowRecordList.value = [];
  try {
    const res = await businessApi.getLifecycle(String(lifecycleId));
    if (res?.code === 200 && Array.isArray(res.data)) {
      flowRecordList.value = res.data;
      return;
    }
    throw new Error("接口返回异常");
  } catch (err) {
    console.warn("获取流程进展失败:", err);
    uni.showToast({ title: "加载进展失败", icon: "none" });
  } finally {
    flowRecordLoading.value = false;
  }
}

async function handlePreAuditSubmit() {
  if (!allPreAuditStepsDone.value) return;
  if (!orderNo.value) {
    uni.showToast({ title: "缺少订单编号", icon: "none" });
    return;
  }

  const { confirm } = await uni.showModal({
    title: "确认提交",
    content: isSupplementDetail.value
      ? "提交后将进入下一处理环节，确认提交吗？"
      : "提交后将进入预审流程，确认提交吗？",
    confirmText: "确认提交",
    cancelText: "再等等",
  });
  if (!confirm) return;

  submitting.value = true;
  try {
    await businessApi.submitInitialAudit(orderNo.value);
    uni.showToast({
      title: isSupplementDetail.value ? "补件提交成功" : "提交成功",
      icon: "success",
    });
    setTimeout(() => {
      uni.navigateBack();
    }, 1200);
  } catch (err) {
    console.error("提交预审失败:", err);
    uni.showToast({ title: "提交失败，请重试", icon: "none" });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.pre-audit-detail-page {
  min-height: 100vh;
  padding: 28rpx 24rpx 64rpx;
  background:
    linear-gradient(
      180deg,
      rgba(232, 244, 255, 0.9) 0%,
      rgba(248, 250, 252, 0.96) 34%,
      #f6f8fb 100%
    ),
    linear-gradient(135deg, rgba(38, 166, 154, 0.12), rgba(52, 120, 246, 0.1));
}

.pre-customer-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 252, 255, 0.96) 100%
  );
  border: 1rpx solid rgba(223, 232, 242, 0.9);
  border-radius: 20rpx;
  padding: 32rpx 30rpx 28rpx;
  box-shadow: 0 12rpx 30rpx rgba(31, 45, 61, 0.06);
  margin-bottom: 30rpx;
}

.pre-customer-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.pre-progress-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 18rpx;
  background: rgba(64, 150, 255, 0.08);
  border-radius: 999rpx;
  border: 1rpx solid rgba(64, 150, 255, 0.16);
  flex-shrink: 0;
  transition:
    transform 0.16s ease,
    background-color 0.16s ease;

  &:active {
    transform: scale(0.98);
    background: rgba(64, 150, 255, 0.14);
  }
}

.pre-progress-text {
  font-size: 25rpx;
  font-weight: 600;
  color: var(--u-type-primary);
}

.pre-avatar {
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #2f8cff 0%, #26a69a 100%);
  color: #fff;
  font-size: 38rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 12rpx 24rpx rgba(47, 140, 255, 0.18);
}

.pre-customer-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
  flex: 1;
}

.pre-customer-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #172033;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-customer-phone {
  font-size: 27rpx;
  color: #687387;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-order-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 26rpx;
  padding: 20rpx 22rpx;
  background: rgba(245, 248, 252, 0.86);
  border-radius: 14rpx;
}

.pre-order-label {
  font-size: 25rpx;
  color: #8290a3;
  flex-shrink: 0;
}

.pre-order-value {
  flex: 1;
  min-width: 0;
  font-size: 25rpx;
  color: #2b3445;
  word-break: break-all;
  line-height: 1.35;
}

.pre-remark-inline {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  margin-top: 14rpx;
  padding: 18rpx 22rpx;
  background: rgba(255, 247, 237, 0.9);
  border: 1rpx solid rgba(251, 191, 36, 0.28);
  border-radius: 14rpx;
}

.pre-remark-inline__label {
  flex-shrink: 0;
  font-size: 25rpx;
  font-weight: 600;
  color: #b45309;
  line-height: 1.45;
}

.pre-remark-inline__value {
  flex: 1;
  min-width: 0;
  font-size: 25rpx;
  color: #78350f;
  line-height: 1.45;
  word-break: break-word;
}

.pre-flow-scroll {
  width: 100%;
  margin: 0 -24rpx 24rpx;
  padding: 0 24rpx;
  background: rgba(246, 248, 251, 0.96);
  border-top: 1rpx solid rgba(229, 235, 244, 0.9);
  border-bottom: 1rpx solid rgba(229, 235, 244, 0.9);
  white-space: nowrap;
}

.pre-flow-tabs {
  display: inline-flex;
  align-items: center;
  padding: 0;
  min-width: 100%;
}

.pre-flow-tab {
  position: relative;
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  min-width: 140rpx;
  padding: 24rpx 14rpx 22rpx;
}

.pre-flow-tab__label {
  font-size: 29rpx;
  font-weight: 600;
  color: #647084;
  line-height: 1.2;
}

.pre-flow-tab--active .pre-flow-tab__label {
  color: #1f6feb;
}

.pre-flow-tab__indicator {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 44rpx;
  height: 6rpx;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #1f6feb, #26a69a);
  transform: translateX(-50%);
}

.pre-section-title {
  position: relative;
  margin: 0 0 20rpx;
  padding-left: 18rpx;
  font-size: 31rpx;
  font-weight: 700;
  color: #253247;
  line-height: 1.25;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 5rpx;
    width: 6rpx;
    height: 34rpx;
    border-radius: 8rpx;
    background: linear-gradient(180deg, #1f6feb, #26a69a);
  }
}

.pre-supplement-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.pre-supplement-card {
  position: relative;
  min-height: 120rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 22rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(226, 233, 242, 0.9);
  border-radius: 16rpx;
  box-shadow: 0 8rpx 20rpx rgba(31, 45, 61, 0.045);
  transition:
    transform 0.16s ease,
    background-color 0.16s ease,
    border-color 0.16s ease;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 28rpx;
    bottom: 28rpx;
    width: 5rpx;
    border-radius: 0 8rpx 8rpx 0;
    background: rgba(64, 150, 255, 0.18);
  }

  &:active {
    transform: translateY(2rpx);
    background: #fbfdff;
    border-color: rgba(64, 150, 255, 0.28);
  }
}

.pre-card-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pre-card-icon-customer {
  background: linear-gradient(135deg, #4f9cff, #1f6feb);
}

.pre-card-icon-car {
  background: linear-gradient(135deg, #2dd4bf, #0f9f84);
}

.pre-card-icon-order {
  background: linear-gradient(135deg, #f6b64b, #e88622);
}

.pre-card-icon-file {
  background: linear-gradient(135deg, #6772e5, #8b5cf6);
}

.pre-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 7rpx;
}

.pre-card-title {
  font-size: 31rpx;
  font-weight: 700;
  color: #172033;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-card-desc {
  font-size: 25rpx;
  color: #7b8797;
  line-height: 1.42;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-card-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  min-height: 76rpx;

  :deep(.u-tag) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 42rpx;
    line-height: 42rpx;
    padding: 0 14rpx;
    border-radius: 999rpx;
    font-weight: 600;
  }

  :deep(.u-tag__text) {
    line-height: 1;
  }
}

.pre-card-arrow {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  min-height: 76rpx;
}

.pre-supplement-card--submit {
  align-items: center;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98),
    rgba(240, 248, 255, 0.98)
  );
  border-color: rgba(64, 150, 255, 0.18);
}

.pre-supplement-card--submit .pre-card-icon {
  opacity: 1;
  pointer-events: auto;
}

.pre-supplement-card--submit .pre-card-body {
  padding-top: 0;
}

.pre-supplement-card--submit .pre-card-arrow {
  align-items: center;
  gap: 16rpx;

  :deep(.u-btn) {
    height: 56rpx;
    line-height: 56rpx;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12rpx;
  }
}

.pre-card-icon-pending {
  background: linear-gradient(135deg, #60a5fa, #26a69a);
}

.pre-action-area {
  margin-top: 42rpx;
  padding-bottom: 28rpx;

  :deep(.u-btn--disabled) {
    background: #9dccf8 !important;
    border-color: #9dccf8 !important;
    color: #fff !important;
  }
}

// ===== 加载 & 空状态 =====
.loading-wrap,
.empty-wrap {
  display: flex;
  justify-content: center;
  padding: 160rpx 0;
}
</style>
