<template>
  <app-page nav-title="申请进度">
    <view class="progress-page">
      <!-- 客户信息卡片 -->
      <view class="customer-card">
        <view class="customer-header">
          <view class="avatar">{{ (info.customerName || "?").charAt(0) }}</view>
          <view class="customer-meta">
            <text class="customer-name">{{
              info.customerName || "未知客户"
            }}</text>
            <text class="customer-phone">{{ info.phone || "-" }}</text>
          </view>
          <u-tag :text="statusText" :type="statusType" size="mini" plain />
        </view>
        <view v-if="info.applicationNo" class="order-row">
          <text class="order-label">申请编号</text>
          <text class="order-value">{{ info.applicationNo }}</text>
        </view>
        <view v-if="info.productName" class="order-row">
          <text class="order-label">贷款产品</text>
          <text class="order-value">{{ info.productName }}</text>
        </view>
        <view v-if="info.amount" class="order-row">
          <text class="order-label">申请金额</text>
          <text class="order-value amount"
            >¥{{ formatMoney(info.amount) }}</text
          >
        </view>
      </view>

      <!-- 进度时间线 -->
      <view class="timeline-card">
        <view class="timeline-header">
          <text class="timeline-title">审批进度</text>
          <text class="timeline-sub"
            >{{ completedCount }}/{{ steps.length }} 已完成</text
          >
        </view>
        <view class="timeline-track">
          <view
            v-for="(step, idx) in steps"
            :key="step.key"
            class="step-item"
            :class="`step-${step.status}`"
          >
            <view class="step-dot-wrap">
              <view class="step-dot">
                <u-icon
                  v-if="step.status === 'done'"
                  name="checkbox-mark"
                  size="22"
                  color="#fff"
                />
                <u-icon
                  v-else-if="step.status === 'rejected'"
                  name="close"
                  size="22"
                  color="#fff"
                />
                <text v-else class="dot-num">{{ idx + 1 }}</text>
              </view>
              <view v-if="idx < steps.length - 1" class="step-line" />
            </view>
            <view class="step-content">
              <view class="step-title-row">
                <text class="step-title">{{ step.title }}</text>
                <u-tag
                  v-if="step.tag"
                  :text="step.tag"
                  :type="tagType(step.status)"
                  size="mini"
                  plain
                />
              </view>
              <text class="step-desc">{{ step.desc }}</text>
              <view v-if="step.approver || step.time" class="step-meta">
                <text v-if="step.approver" class="step-approver">
                  操作人：{{ step.approver }}
                </text>
                <text v-if="step.time" class="step-time">
                  {{ step.time }}
                </text>
              </view>
              <text v-if="step.reason" class="step-reason">
                备注：{{ step.reason }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 审批详情 -->
      <view v-if="info.funderName || info.approvedAmount" class="info-card">
        <text class="info-title">审批详情</text>
        <view class="info-grid">
          <view v-if="info.funderName" class="info-item">
            <text class="info-label">资方</text>
            <text class="info-value">{{ info.funderName }}</text>
          </view>
          <view v-if="info.approvedAmount" class="info-item">
            <text class="info-label">审批金额</text>
            <text class="info-value highlight"
              >¥{{ formatMoney(info.approvedAmount) }}</text
            >
          </view>
          <view v-if="info.approvedTerm" class="info-item">
            <text class="info-label">审批期限</text>
            <text class="info-value">{{ info.approvedTerm }}期</text>
          </view>
          <view v-if="info.approvedRate" class="info-item">
            <text class="info-label">年化利率</text>
            <text class="info-value">{{ info.approvedRate }}%</text>
          </view>
          <view v-if="info.repaymentMethod" class="info-item">
            <text class="info-label">还款方式</text>
            <text class="info-value">{{ info.repaymentMethod }}</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view v-if="showActions" class="action-bar">
        <u-button v-if="canSign" type="primary" shape="circle" @click="goToSign"
          >去签约</u-button
        >
        <u-button
          v-if="canSupplement"
          type="warning"
          shape="circle"
          @click="goToSupplement"
          >去补件</u-button
        >
      </view>

      <view class="back-to-list">
        <u-button type="info" shape="circle" plain @click="goToList"
          >返回列表页</u-button
        >
      </view>

      <view v-if="loading" class="loading-wrap">
        <u-loading mode="circle" size="48" />
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { showFailToast } from "@/composables/useGlobalLoadingToast";
import {
  buildSignRouteQuery,
  buildSupplementRouteQuery,
} from "@/common/carloan-route-query";

const businessApi = useCarloanApi();
const loading = ref(false);
const creditOrderId = ref("");

// ── 状态常量 ──
const STATUS_TEXT = {
  DRAFT: "草稿",
  SUBMITTED: "已提交",
  PENDING_RISK_PRE: "风控预审中",
  RISK_PRE_PASSED: "预审通过",
  RISK_PRE_REJECTED: "预审拒绝",
  PENDING_FUNDER_PRE: "资方预审中",
  FUNDER_PRE_PASSED: "资方预审通过",
  FUNDER_PRE_REJECTED: "资方预审拒绝",
  PENDING_SUPPLEMENT: "待补件",
  PENDING_FIRST_REVIEW: "待初审",
  FIRST_REVIEW_PASSED: "初审通过",
  FIRST_REVIEW_REJECTED: "初审拒绝",
  PENDING_FINAL_REVIEW: "待终审",
  FINAL_REVIEW_PASSED: "终审通过",
  FINAL_REVIEW_REJECTED: "终审拒绝",
  PENDING_FUNDER_REVIEW: "待资方审批",
  FUNDER_REVIEW_PASSED: "资方通过",
  FUNDER_REVIEW_REJECTED: "资方拒绝",
  PENDING_SIGN: "待签约",
  SIGNING_PROGRESS: "签约中",
  SIGNED: "已签约",
  PENDING_LOAN_REQUEST: "待请款",
  LOAN_REQUEST_REVIEWING: "请款审核中",
  LOAN_REQUEST_APPROVED: "请款通过",
  LOAN_REQUEST_REJECTED: "请款拒绝",
  PENDING_DISBURSEMENT: "待放款",
  DISBURSED: "已放款",
  CANCELLED: "已取消",
};

const STATUS_TYPE = {
  DRAFT: "info",
  RISK_PRE_REJECTED: "error",
  FUNDER_PRE_REJECTED: "error",
  FIRST_REVIEW_REJECTED: "error",
  FINAL_REVIEW_REJECTED: "error",
  FUNDER_REVIEW_REJECTED: "error",
  LOAN_REQUEST_REJECTED: "error",
  CANCELLED: "info",
};

// 统一的顺序数组，用于判断步骤进度
const ORDER = [
  "DRAFT",
  "SUBMITTED",
  "PENDING_RISK_PRE",
  "RISK_PRE_PASSED",
  "PENDING_SUPPLEMENT",
  "PENDING_FIRST_REVIEW",
  "FIRST_REVIEW_PASSED",
  "PENDING_FINAL_REVIEW",
  "FINAL_REVIEW_PASSED",
  "PENDING_FUNDER_REVIEW",
  "FUNDER_REVIEW_PASSED",
  "PENDING_SIGN",
  "SIGNED",
  "PENDING_LOAN_REQUEST",
  "LOAN_REQUEST_APPROVED",
  "PENDING_DISBURSEMENT",
  "DISBURSED",
];

// 拒绝状态 → 对应的步骤状态
const REJECT_AT = {
  RISK_PRE_REJECTED: "PENDING_RISK_PRE",
  FIRST_REVIEW_REJECTED: "PENDING_FIRST_REVIEW",
  FINAL_REVIEW_REJECTED: "PENDING_FINAL_REVIEW",
  FUNDER_REVIEW_REJECTED: "PENDING_FUNDER_REVIEW",
  LOAN_REQUEST_REJECTED: "PENDING_LOAN_REQUEST",
};

// 时间线步骤定义
const STEP_DEFS = [
  {
    key: "submit",
    title: "提交进件",
    desc: "资料已提交，等待审核",
    at: "SUBMITTED",
    timeKey: "submittedAt",
  },
  {
    key: "risk_pre",
    title: "风控预审",
    desc: "系统自动校验客户资质",
    at: "PENDING_RISK_PRE",
  },
  {
    key: "first_review",
    title: "初审",
    desc: "风控人员审核资料真实性",
    at: "PENDING_FIRST_REVIEW",
  },
  {
    key: "final_review",
    title: "终审",
    desc: "核定额度、期限和利率",
    at: "PENDING_FINAL_REVIEW",
  },
  {
    key: "funder_review",
    title: "资方审批",
    desc: "提交资方系统审批",
    at: "PENDING_FUNDER_REVIEW",
  },
  {
    key: "signing",
    title: "合同签约",
    desc: "客户确认额度并签署合同",
    at: "PENDING_SIGN",
  },
  {
    key: "disbursement",
    title: "放款",
    desc: "GPS安装、抵押办理后放款",
    at: "PENDING_DISBURSEMENT",
  },
];

// ── 响应式数据 ──
const info = ref({
  customerName: "",
  phone: "",
  applicationNo: "",
  creditOrderId: "",
  productName: "",
  funderName: "",
  amount: 0,
  approvedAmount: 0,
  approvedTerm: 0,
  approvedRate: 0,
  repaymentMethod: "",
  status: "",
  submittedAt: "",
  id: "",
  uuid: "",
});

// 流程记录
interface FlowRecordItem {
  currentNode: string;
  currentNodeName?: string;
  approvalStatus: string;
  approveName?: string;
  approvalTime?: string;
  approvalReason?: string;
}

const flowRecords = ref<FlowRecordItem[]>([]);

// ── 计算属性 ──
const statusText = computed(
  () => (STATUS_TEXT as any)[info.value.status] || info.value.status || "未知",
);
const statusType = computed(() => (STATUS_TYPE as any)[info.value.status] || "primary");
const statusIdx = computed(() => ORDER.indexOf(info.value.status));

// 步骤定义 → 流程节点编码映射
const STEP_NODE_MAP: Record<string, string> = {
  SUBMITTED: "1100",
  PENDING_RISK_PRE: "1200",
  PENDING_FIRST_REVIEW: "1400",
  PENDING_FINAL_REVIEW: "1500",
  PENDING_FUNDER_REVIEW: "1600",
  PENDING_SIGN: "1700",
  PENDING_DISBURSEMENT: "1900",
};

const steps = computed(() => {
  const s = info.value.status;
  const curIdx = statusIdx.value;

  return STEP_DEFS.map((def) => {
    const defIdx = ORDER.indexOf(def.at);
    let status = "pending";

    if (s === def.at) {
      status = "current";
    } else if ((REJECT_AT as any)[s] === def.at) {
      status = "rejected";
    } else if ((REJECT_AT as any)[s] && defIdx < ORDER.indexOf((REJECT_AT as any)[s])) {
      status = "done";
    } else if (curIdx > defIdx) {
      status = "done";
    }

    const tag =
      status === "current"
        ? "进行中"
        : status === "done"
          ? "已完成"
          : status === "rejected"
            ? "已拒绝"
            : "";

    // 匹配流程记录
    const nodeCode = STEP_NODE_MAP[def.at];
    const record = flowRecords.value.find(
      (r) => r.currentNode === nodeCode || r.currentNode === def.at,
    );

    return {
      key: def.key,
      title: def.title,
      desc: def.desc,
      status,
      tag,
      time: record?.approvalTime || (def.timeKey ? (info.value as any)[def.timeKey] || "" : ""),
      approver: record?.approveName || "",
      reason: record?.approvalReason || "",
      recordStatus: record?.approvalStatus || "",
    };
  });
});

const completedCount = computed(
  () => steps.value.filter((s) => s.status === "done").length,
);

const showActions = computed(() =>
  ["PENDING_SUPPLEMENT", "PENDING_SIGN", "SIGNING_PROGRESS"].includes(
    info.value.status,
  ),
);

const canSign = computed(() =>
  [
    "PENDING_SIGN",
    "SIGNING_PROGRESS",
    "FUNDER_REVIEW_PASSED",
    "FINAL_REVIEW_PASSED",
  ].includes(info.value.status),
);

const canSupplement = computed(
  () => info.value.status === "PENDING_SUPPLEMENT",
);

function tagType(status: string) {
  if (status === "done") return "success";
  if (status === "rejected") return "error";
  if (status === "current") return "primary";
  return "info";
}

function formatMoney(val: number | string) {
  const num = Number(val);
  if (!num && num !== 0) return "—";
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 0 });
}

async function loadDetail() {
  if (!creditOrderId.value) return;
  loading.value = true;
  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    const raw = res?.data || res || {};
    const d = (raw as any).data || raw;
    if (!d.id && !d.creditOrderId) return;
    Object.assign(info.value, {
      customerName: d.customerName || d.personName || d.name || "",
      phone: d.phone || d.telephone || "",
      applicationNo: d.applicationNo || d.creditOrderId || "",
      creditOrderId: d.creditOrderId || d.orderNo || "",
      productName: d.productName || "",
      funderName: d.funderName || "",
      amount: d.amount || d.pushQuota || 0,
      approvedAmount: d.approvedAmount || 0,
      approvedTerm: d.approvedTerm || 0,
      approvedRate: d.approvedRate || 0,
      repaymentMethod: d.repaymentMethod || "",
      status: d.status || "",
      submittedAt: d.submittedAt || d.createTime || "",
      id: d.id ? String(d.id) : "",
      uuid: d.uuid || "",
    });

    // 获取流程记录
    const orderId = d.id;
    if (orderId) {
      try {
        const lifecycleRes = await businessApi.getLifecycle(orderId);
        const records = (lifecycleRes?.data || lifecycleRes || []) as FlowRecordItem[];
        flowRecords.value = Array.isArray(records) ? records : [];
      } catch (e) {
        console.warn("获取流程记录失败:", e);
      }
    }
  } catch (e) {
    console.warn("获取申请详情失败:", e);
    showFailToast("获取详情失败");
  } finally {
    loading.value = false;
  }
}

// 导航
function goToSign() {
  const d = info.value;
  uni.navigateTo({
    url: buildRoute(
      APP_ROUTES.carloan.signing.signCenter,
      buildSignRouteQuery({
        creditOrderId: d.creditOrderId || d.applicationNo,
        uuid: d.uuid || "",
        customerName: d.customerName,
      }),
    ),
  });
}

function goToSupplement() {
  const d = info.value;
  uni.navigateTo({
    url: buildRoute(
      APP_ROUTES.carloan.supplement.supplementDetail,
      buildSupplementRouteQuery({
        creditOrderId: d.creditOrderId || d.applicationNo,
      }),
    ),
  });
}

function goToList() {
  uni.navigateTo({ url: APP_ROUTES.carloan.precheck.applyListPage });
}

onLoad((options) => {
  creditOrderId.value = options?.creditOrderId || options?.orderId || "";
  loadDetail();
});
</script>

<style lang="scss" scoped>
.progress-page {
  padding: 24rpx;
  background: #f5f7fa;
  min-height: 100vh;
}

// ── 卡片通用 ──
.customer-card,
.timeline-card,
.info-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

// ── 客户信息 ──
.customer-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--u-type-primary), #60a5fa);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  flex-shrink: 0;
}

.customer-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.customer-phone {
  font-size: 24rpx;
  color: #8c8c8c;
  margin-top: 4rpx;
}

.order-row {
  display: flex;
  justify-content: space-between;
  padding: 24rpx 0;
  border-top: 1rpx solid #f5f5f5;
}

.order-label {
  font-size: 26rpx;
  color: #8c8c8c;
}

.order-value {
  font-size: 26rpx;
  color: #1a1a1a;
  font-weight: 500;

  &.amount {
    color: #f59e0b;
    font-weight: 700;
  }
}

// ── 时间线 ──
.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28rpx;
}

.timeline-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.timeline-sub {
  font-size: 24rpx;
  color: #8c8c8c;
}

.step-item {
  display: flex;
  gap: 20rpx;
  min-height: 120rpx;
}

.step-dot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48rpx;
  flex-shrink: 0;
}

.step-dot {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.step-done .step-dot {
  background: #22c55e;
}

.step-current .step-dot {
  background: var(--u-type-primary);
  box-shadow: 0 0 0 8rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.15);
}

.step-pending .step-dot {
  background: #e5e7eb;
}

.step-rejected .step-dot {
  background: #ef4444;
}

.dot-num {
  font-size: 22rpx;
  font-weight: 600;
  color: #999;
}

.step-done .dot-num {
  color: #fff;
}

.step-line {
  width: 4rpx;
  flex: 1;
  min-height: 24rpx;
  background: #e5e7eb;
  margin: 8rpx 0;
}

.step-done + .step-item .step-line,
.step-done .step-line {
  background: #22c55e;
}

.step-content {
  flex: 1;
  padding-bottom: 28rpx;
}

.step-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.step-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.step-pending .step-title {
  color: #999;
  font-weight: 400;
}

.step-desc {
  font-size: 24rpx;
  color: #8c8c8c;
  margin-top: 6rpx;
}

.step-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx 18rpx;
  margin-top: 8rpx;
}

.step-approver {
  font-size: 22rpx;
  color: #666;
}

.step-time {
  font-size: 22rpx;
  color: #b0b0b0;
}

.step-reason {
  font-size: 22rpx;
  color: #e6a23c;
  margin-top: 6rpx;
  background: #fdf6ec;
  padding: 8rpx 12rpx;
  border-radius: 8rpx;
  display: block;
}

// ── 审批详情 ──
.info-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24rpx;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.info-label {
  font-size: 24rpx;
  color: #8c8c8c;
}

.info-value {
  font-size: 28rpx;
  font-weight: 500;
  color: #1a1a1a;

  &.highlight {
    color: #f59e0b;
    font-weight: 700;
    font-size: 32rpx;
  }
}

// ── 操作按钮 ──
.action-bar {
  padding: 24rpx 0;
  display: flex;
  gap: 20rpx;
}

.back-to-list {
  padding: 12rpx 0 48rpx;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 24rpx 0;
}
</style>
