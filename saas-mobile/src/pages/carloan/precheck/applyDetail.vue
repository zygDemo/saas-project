<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { useCarloanStore } from "@/stores/carloan";
import FlowRecordPopup from "@/components/carloan/FlowRecordPopup.vue";
import { flowTabList, resolveFlowTabByNode, resolvePageTitle } from "@/common/carloan/applyDetail-flow";
import { useDetailFlow } from "@/composables/carloan/useDetailFlow";
import { enrichLifecycleRecords } from "@/composables/carloan/useApprovalFlow";
import {
  safeDecode, normalizeRouteQuery, buildRouteFallbackDetail,
  hasDetailPayload, pickDetailUuid, normalizeDetailPayload,
} from "./applyDetail-helpers";

const carloanStore = useCarloanStore();
const businessApi = useCarloanApi();

// ---- state ----
const detail = ref<any>(null);
const loading = ref(true);
const submitting = ref(false);
const flowRecordVisible = ref(false);
const flowRecordLoading = ref(false);
const flowRecordList = ref<any[]>([]);
const activeFlowTab = ref("precheck");
const flowConfig = ref<any>({});
const flowNodes = ref<any[]>([]);
let detailId = "";

// ---- detail loading ----
async function loadFlowConfig(nodeCode: string) {
  if (!nodeCode) return;
  try {
    const res = await businessApi.getFlowConfig(nodeCode);
    if (res?.code === 200 && res.data) {
      flowConfig.value = res.data;
      flowNodes.value = res.data.nodes || [];
    }
  } catch { /* ignore */ }
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
    let res: any = null;
    if (creditOrderId) res = await businessApi.getCreditDetailByOrderId(creditOrderId);
    else if (detailId) res = await businessApi.getCreditDetail(detailId);
    const data = res?.data || res || {};
    detail.value = normalizeDetailPayload(hasDetailPayload(data) ? data : fallback);
    if (detail.value?.uuid && !carloanStore.pageContext.uuid) carloanStore.pageContext.uuid = String(detail.value.uuid);
    if (detail.value?.nodeCode) carloanStore.pageContext.nodeCode = String(detail.value.nodeCode);
    await loadFlowConfig(detail.value.nodeCode);
  } catch (err) {
    console.warn("获取订单详情失败:", err);
    detail.value = hasDetailPayload(fallback) ? fallback : null;
    uni.showToast({ title: "获取详情失败，已显示基础信息", icon: "none" });
  } finally {
    loading.value = false;
  }
}

// ---- computed ----
const currentNodeCode = computed(() =>
  String([carloanStore.pageContext.nodeCode, detail.value?.nodeCode, detail.value?.currentNode, detail.value?.businessNode].find(Boolean) || ""),
);
const currentNodeLabel = computed(() => {
  const { businessNodeText } = require("@/common/carloan/applyDetail-flow");
  return businessNodeText(currentNodeCode.value);
});
const isPreAuditDetail = computed(() => ["1100", "1200", "PRE_AUDIT", "INITIAL_AUDIT"].includes(currentNodeCode.value));
const isSupplementDetail = computed(() => ["1300", "1310", "1320", "1330", "1340", "SUPPLEMENT_MATERIALS"].includes(currentNodeCode.value));
const isLoanRequestDetail = computed(() => {
  const code = currentNodeCode.value;
  const n = Number(code);
  return (Number.isFinite(n) && n >= 1700 && n <= 1799) || ["LOAN_REQUEST", "PENDING_LOAN_REQUEST"].includes(code);
});

const customerDisplayName = computed(() => detail.value?.name || detail.value?.customerName || detail.value?.personName || carloanStore.pageContext.customerName || "");
const customerDisplayPhone = computed(() => detail.value?.phone || detail.value?.telephone || detail.value?.mobile || carloanStore.pageContext.customerPhone || "");
const orderNo = computed(() => detail.value?.creditOrderId || detail.value?.orderNo || detail.value?.applicationNo || carloanStore.pageContext.creditOrderId || "");
const detailUuid = computed(() => carloanStore.pageContext.uuid || pickDetailUuid(detail.value || {}) || "");

const entryProgress = computed(() => {
  try { const m = uni.getStorageSync("ENTRY_PROGRESS_MAP") || {}; return m[orderNo.value] || m[detailUuid.value] || {}; } catch { return {}; }
});
const signProgress = computed(() => {
  try { const m = uni.getStorageSync("SIGN_PROGRESS_MAP") || {}; return m[orderNo.value] || m[detailUuid.value] || {}; } catch { return {}; }
});

const pageTitle = computed(() => resolvePageTitle(currentNodeCode.value, isPreAuditDetail.value ? "预审阶段" : "订单详情"));
const activeStageTitle = computed(() => flowTabList.find((tab) => tab.value === activeFlowTab.value)?.label || "阶段");

// ---- detailFlow composable ----
const {
  stageEntryItems, allPreAuditStepsDone, allSupplementStepsDone,
  getEntryStepDone, getSignStepState, getStageStepTag, goStageStep,
} = useDetailFlow({
  detail: () => detail.value,
  loading: () => loading.value,
  currentNodeCode: () => currentNodeCode.value,
  flowConfig: () => flowConfig.value,
  flowNodes: () => flowNodes.value,
  entryProgress: () => entryProgress.value,
  signProgress: () => signProgress.value,
  detailUuid: () => detailUuid.value,
  orderNo: () => orderNo.value,
  customerDisplayName: () => customerDisplayName.value,
  customerDisplayPhone: () => customerDisplayPhone.value,
  isPreAuditDetail: () => isPreAuditDetail.value,
  isSupplementDetail: () => isSupplementDetail.value,
  isLoanRequestDetail: () => isLoanRequestDetail.value,
  submitting,
  flowRecordVisible,
  flowRecordLoading,
  flowRecordList,
  detailId,
  businessApi,
  enrichLifecycleRecords: (records: any[]) => enrichLifecycleRecords(detail.value, records),
  handlePreAuditSubmit,
  handleProgress,
});

// ---- flow record ----
async function handleProgress() {
  const lifecycleId = detailId || detail.value?.id || detail.value?.applicationId || orderNo.value;
  if (!lifecycleId) { uni.showToast({ title: "缺少订单编号", icon: "none" }); return; }
  flowRecordVisible.value = true;
  flowRecordLoading.value = true;
  flowRecordList.value = [];
  try {
    const res = await businessApi.getLifecycle(String(lifecycleId));
    if (res?.code === 200 && Array.isArray(res.data)) {
      flowRecordList.value = enrichLifecycleRecords(detail.value, res.data);
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

// ---- submit ----
async function handlePreAuditSubmit() {
  if (!allPreAuditStepsDone.value) return;
  if (!orderNo.value) { uni.showToast({ title: "缺少订单编号", icon: "none" }); return; }
  const { confirm } = await uni.showModal({
    title: "确认提交",
    content: isSupplementDetail.value ? "提交后将进入下一处理环节，确认提交吗？" : "提交后将进入预审流程，确认提交吗？",
    confirmText: "确认提交", cancelText: "再等等",
  });
  if (!confirm) return;
  submitting.value = true;
  try {
    await businessApi.submitInitialAudit(orderNo.value);
    uni.showToast({ title: isSupplementDetail.value ? "补件提交成功" : "提交成功", icon: "success" });
    setTimeout(() => uni.navigateBack(), 1200);
  } catch (err) {
    console.error("提交预审失败:", err);
    uni.showToast({ title: "提交失败，请重试", icon: "none" });
  } finally {
    submitting.value = false;
  }
}

// ---- lifecycle ----
let initialLoaded = false;
onLoad((options: any = {}) => {
  const query = normalizeRouteQuery(options);
  detailId = query.id || "";
  carloanStore.syncFromRouteQuery(query);
  activeFlowTab.value = resolveFlowTabByNode(carloanStore.pageContext.nodeCode);
  loadDetail();
  initialLoaded = true;
});

onShow(() => { if (initialLoaded) loadDetail(); });
</script>

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
        <view class="pre-node-row">
          <text class="pre-node-label">当前节点</text>
          <view class="pre-node-pill">
            <text class="pre-node-text">{{ currentNodeLabel }}</text>
            <text v-if="currentNodeCode" class="pre-node-code">
              {{ currentNodeCode }}
            </text>
          </view>
        </view>
        <view v-if="latestRemark" class="pre-remark-inline">
          <text class="pre-remark-inline__label">审批备注</text>
          <text class="pre-remark-inline__value">{{ latestRemark }}</text>
        </view>
      </view>

      <view class="pre-flow-scroll">
        <view class="pre-flow-tabs">
          <view
            v-for="tab in flowTabList"
            :key="tab.value"
            class="pre-flow-tab"
            :class="{ 'pre-flow-tab--active': activeFlowTab === tab.value }"
            @click="activeFlowTab = tab.value"
          >
            <text class="pre-flow-tab__label">{{ tab.label }}</text>
          </view>
        </view>
      </view>

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
            'pre-supplement-card--current':
              getSignStepState(item.code) === 'doing',
            'pre-supplement-card--done':
              getSignStepState(item.code) === 'finish',
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
  box-sizing: border-box;
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

.pre-node-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 14rpx;
  padding: 18rpx 22rpx;
  background: rgba(64, 150, 255, 0.08);
  border: 1rpx solid rgba(64, 150, 255, 0.16);
  border-radius: 14rpx;
}

.pre-node-label {
  flex-shrink: 0;
  font-size: 25rpx;
  color: #5f6f86;
}

.pre-node-pill {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10rpx;
}

.pre-node-text {
  min-width: 0;
  font-size: 26rpx;
  font-weight: 700;
  color: var(--u-type-primary);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pre-node-code {
  flex-shrink: 0;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  background: rgba(64, 150, 255, 0.12);
  font-size: 22rpx;
  color: #4a78b8;
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
  margin: 0 0 24rpx;
  background: var(--app-page-bg-soft);
  border-radius: 16rpx;
  box-sizing: border-box;
}

.pre-flow-tabs {
  display: flex;
  align-items: center;
  gap: 8rpx;
  // padding: 6rpx;
  width: 100%;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20rpx;
  border: 1rpx solid var(--app-border);
  box-shadow: var(--app-shadow-card);
}

.pre-flow-tab {
  flex: 1 1 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16rpx 12rpx;
  border-radius: 14rpx;
  transition:
    color 0.2s ease,
    background 0.2s ease,
    transform 0.15s ease;

  &:active {
    transform: scale(0.96);
  }
}

.pre-flow-tab__label {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--app-text-secondary);
  line-height: 1.2;
  transition: color 0.2s ease;
}

.pre-flow-tab--active {
  background: linear-gradient(135deg, var(--u-type-primary) 0%, var(--u-type-primary-dark) 100%);
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.12);
}

.pre-flow-tab--active .pre-flow-tab__label {
  color: #fff;
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

.pre-supplement-card--current {
  border-color: rgba(31, 111, 235, 0.36);
  background: linear-gradient(135deg, #ffffff, #f3f8ff);

  &::before {
    background: linear-gradient(180deg, #1f6feb, #26a69a);
  }
}

.pre-supplement-card--done {
  border-color: rgba(16, 185, 129, 0.24);

  &::before {
    background: rgba(16, 185, 129, 0.55);
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