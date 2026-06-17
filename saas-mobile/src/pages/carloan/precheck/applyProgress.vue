<template>
  <app-page nav-title="申请进度">
    <view class="progress-page">
      <!-- 客户信息卡片 -->
      <view class="customer-card">
        <view class="customer-header">
          <view class="avatar">{{ (info.customerName || '?').charAt(0) }}</view>
          <view class="customer-meta">
            <text class="customer-name">{{ info.customerName || '未知客户' }}</text>
            <text class="customer-phone">{{ info.phone || '-' }}</text>
          </view>
          <u-tag
            :text="statusText"
            :type="statusType"
            size="mini"
            plain
          />
        </view>
        <view v-if="info.applicationNo || info.creditOrderId" class="order-row">
          <text class="order-label">申请编号</text>
          <text class="order-value">{{ info.applicationNo || info.creditOrderId }}</text>
        </view>
        <view v-if="info.productName" class="order-row">
          <text class="order-label">贷款产品</text>
          <text class="order-value">{{ info.productName }}</text>
        </view>
        <view v-if="info.amount" class="order-row">
          <text class="order-label">申请金额</text>
          <text class="order-value amount">¥{{ formatMoney(info.amount) }}</text>
        </view>
      </view>

      <!-- 进度时间线 -->
      <view class="timeline-card">
        <view class="timeline-header">
          <text class="timeline-title">审批进度</text>
          <text class="timeline-sub">{{ completedSteps }}/{{ steps.length }} 已完成</text>
        </view>

        <view class="timeline-track">
          <view
            v-for="(step, index) in steps"
            :key="step.key"
            class="step-item"
            :class="{
              'step-done': step.status === 'done',
              'step-current': step.status === 'current',
              'step-pending': step.status === 'pending',
              'step-rejected': step.status === 'rejected',
            }"
          >
            <!-- 步骤图标 -->
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
                <text v-else class="dot-num">{{ index + 1 }}</text>
              </view>
              <view v-if="index < steps.length - 1" class="step-line" />
            </view>

            <!-- 步骤内容 -->
            <view class="step-content">
              <view class="step-title-row">
                <text class="step-title">{{ step.title }}</text>
                <u-tag
                  v-if="step.statusLabel"
                  :text="step.statusLabel"
                  :type="step.status === 'done' ? 'success' : step.status === 'rejected' ? 'error' : step.status === 'current' ? 'primary' : 'info'"
                  size="mini"
                  plain
                />
              </view>
              <text class="step-desc">{{ step.desc }}</text>
              <text v-if="step.time" class="step-time">{{ step.time }}</text>
              <text v-if="step.remark" class="step-remark">{{ step.remark }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 产品信息 -->
      <view v-if="info.funderName || info.approvedAmount" class="info-card">
        <view class="info-header">
          <text class="info-title">审批详情</text>
        </view>
        <view class="info-grid">
          <view v-if="info.funderName" class="info-item">
            <text class="info-label">资方</text>
            <text class="info-value">{{ info.funderName }}</text>
          </view>
          <view v-if="info.approvedAmount" class="info-item">
            <text class="info-label">审批金额</text>
            <text class="info-value highlight">¥{{ formatMoney(info.approvedAmount) }}</text>
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
        <u-button
          v-if="canSign"
          type="primary"
          shape="circle"
          @click="goToSign"
        >
          去签约
        </u-button>
        <u-button
          v-if="canSupplement"
          type="warning"
          shape="circle"
          @click="goToSupplement"
        >
          去补件
        </u-button>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading-wrap">
        <u-loading mode="circle" size="48" />
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { APP_ROUTES, buildRoute, buildSignRouteQuery, buildSupplementRouteQuery } from "@/common/navigation";

const businessApi = useCarloanApi();

const loading = ref(false);
const creditOrderId = ref("");
const applicationId = ref("");

const info = ref({
  customerName: "",
  phone: "",
  applicationNo: "",
  creditOrderId: "",
  productName: "",
  funderName: "",
  amount: 0,
  approvedAmount: 0,
  term: 0,
  approvedTerm: 0,
  rate: 0,
  approvedRate: 0,
  repaymentMethod: "",
  status: "",
  phaseCode: 0,
  currentNode: 0,
  currentNodeName: "",
  currentStatus: "",
  currentStatusName: "",
});

// 状态映射
const STATUS_MAP = {
  DRAFT: { text: "草稿", type: "info" },
  SUBMITTED: { text: "已提交", type: "primary" },
  PENDING_RISK_PRE: { text: "风控预审中", type: "warning" },
  RISK_PRE_PASSED: { text: "预审通过", type: "success" },
  RISK_PRE_REJECTED: { text: "预审拒绝", type: "error" },
  PENDING_FUNDER_PRE: { text: "资方预审中", type: "warning" },
  FUNDER_PRE_PASSED: { text: "资方预审通过", type: "success" },
  FUNDER_PRE_REJECTED: { text: "资方预审拒绝", type: "error" },
  PENDING_SUPPLEMENT: { text: "待补件", type: "warning" },
  PENDING_FIRST_REVIEW: { text: "待初审", type: "warning" },
  FIRST_REVIEW_PASSED: { text: "初审通过", type: "success" },
  FIRST_REVIEW_REJECTED: { text: "初审拒绝", type: "error" },
  PENDING_FINAL_REVIEW: { text: "待终审", type: "warning" },
  FINAL_REVIEW_PASSED: { text: "终审通过", type: "success" },
  FINAL_REVIEW_REJECTED: { text: "终审拒绝", type: "error" },
  PENDING_FUNDER_REVIEW: { text: "待资方审批", type: "warning" },
  FUNDER_REVIEW_PASSED: { text: "资方通过", type: "success" },
  FUNDER_REVIEW_REJECTED: { text: "资方拒绝", type: "error" },
  PENDING_SIGN: { text: "待签约", type: "warning" },
  SIGNING_PROGRESS: { text: "签约中", type: "primary" },
  SIGNED: { text: "已签约", type: "success" },
  PENDING_LOAN_REQUEST: { text: "待请款", type: "warning" },
  LOAN_REQUEST_REVIEWING: { text: "请款审核中", type: "warning" },
  LOAN_REQUEST_APPROVED: { text: "请款通过", type: "success" },
  LOAN_REQUEST_REJECTED: { text: "请款拒绝", type: "error" },
  PENDING_DISBURSEMENT: { text: "待放款", type: "warning" },
  DISBURSED: { text: "已放款", type: "success" },
  CANCELLED: { text: "已取消", type: "info" },
};

const statusText = computed(() => {
  const s = STATUS_MAP[info.value.status];
  return s?.text || info.value.currentStatusName || info.value.status || "未知";
});

const statusType = computed(() => {
  const s = STATUS_MAP[info.value.status];
  return s?.type || "info";
});

// 构建进度步骤
const steps = computed(() => {
  const s = info.value.status;
  const statusOrder = [
    "DRAFT", "SUBMITTED", "PENDING_RISK_PRE", "RISK_PRE_PASSED",
    "PENDING_SUPPLEMENT", "PENDING_FIRST_REVIEW", "FIRST_REVIEW_PASSED",
    "PENDING_FINAL_REVIEW", "FINAL_REVIEW_PASSED",
    "PENDING_FUNDER_REVIEW", "FUNDER_REVIEW_PASSED",
    "PENDING_SIGN", "SIGNED",
    "PENDING_LOAN_REQUEST", "LOAN_REQUEST_APPROVED",
    "PENDING_DISBURSEMENT", "DISBURSED",
  ];
  const currentIdx = statusOrder.indexOf(s);

  return [
    {
      key: "submit",
      title: "提交进件",
      desc: "资料已提交，等待审核",
      status: getStatus("SUBMITTED", s, currentIdx, 1),
      statusLabel: getStatusLabel("SUBMITTED", s),
      time: info.value.submittedAt || "",
    },
    {
      key: "risk_pre",
      title: "风控预审",
      desc: "系统自动校验客户资质",
      status: getStatus("PENDING_RISK_PRE", s, currentIdx, 2),
      statusLabel: getStatusLabel("PENDING_RISK_PRE", s),
    },
    {
      key: "first_review",
      title: "初审",
      desc: "风控人员审核资料真实性",
      status: getStatus("PENDING_FIRST_REVIEW", s, currentIdx, 4),
      statusLabel: getStatusLabel("PENDING_FIRST_REVIEW", s),
    },
    {
      key: "final_review",
      title: "终审",
      desc: "核定额度、期限和利率",
      status: getStatus("PENDING_FINAL_REVIEW", s, currentIdx, 6),
      statusLabel: getStatusLabel("PENDING_FINAL_REVIEW", s),
    },
    {
      key: "funder_review",
      title: "资方审批",
      desc: "提交资方系统审批",
      status: getStatus("PENDING_FUNDER_REVIEW", s, currentIdx, 8),
      statusLabel: getStatusLabel("PENDING_FUNDER_REVIEW", s),
    },
    {
      key: "signing",
      title: "合同签约",
      desc: "客户确认额度并签署合同",
      status: getStatus("PENDING_SIGN", s, currentIdx, 10),
      statusLabel: getStatusLabel("PENDING_SIGN", s),
    },
    {
      key: "disbursement",
      title: "放款",
      desc: "GPS安装、抵押办理后放款",
      status: getStatus("PENDING_DISBURSEMENT", s, currentIdx, 14),
      statusLabel: getStatusLabel("PENDING_DISBURSEMENT", s),
    },
  ];
});

// 补件特殊处理
const supplementStatus = computed(() => {
  const s = info.value.status;
  if (s === "PENDING_SUPPLEMENT") return "current";
  const order = ["DRAFT", "SUBMITTED", "PENDING_RISK_PRE", "PENDING_SUPPLEMENT"];
  if (order.indexOf(s) > order.indexOf("PENDING_SUPPLEMENT")) return "done";
  return "pending";
});

const completedSteps = computed(() =>
  steps.value.filter((s) => s.status === "done").length
);

const showActions = computed(() => {
  const s = info.value.status;
  return s === "PENDING_SUPPLEMENT" || s === "PENDING_SIGN" || s === "SIGNING_PROGRESS";
});

const canSign = computed(() => {
  const s = info.value.status;
  return ["PENDING_SIGN", "SIGNING_PROGRESS", "FUNDER_REVIEW_PASSED", "FINAL_REVIEW_PASSED"].includes(s);
});

const canSupplement = computed(() => {
  return info.value.status === "PENDING_SUPPLEMENT";
});

function getStatus(stepStatus, currentStatus, currentIdx, stepIdx) {
  if (currentStatus === stepStatus) return "current";
  if (currentStatus.includes("REJECTED")) {
    // 拒绝状态 - 判断是哪个阶段被拒绝
    const rejectMap = {
      "RISK_PRE_REJECTED": 2,
      "FUNDER_PRE_REJECTED": 3,
      "FIRST_REVIEW_REJECTED": 5,
      "FINAL_REVIEW_REJECTED": 7,
      "FUNDER_REVIEW_REJECTED": 9,
      "LOAN_REQUEST_REJECTED": 13,
    };
    const rejectIdx = rejectMap[currentStatus];
    if (rejectIdx !== undefined) {
      if (stepIdx === rejectIdx) return "rejected";
      if (stepIdx < rejectIdx) return "done";
    }
  }
  if (currentIdx >= stepIdx) return "done";
  return "pending";
}

function getStatusLabel(stepStatus, currentStatus) {
  if (currentStatus === stepStatus) return "进行中";
  const order = [
    "DRAFT", "SUBMITTED", "PENDING_RISK_PRE", "RISK_PRE_PASSED",
    "PENDING_SUPPLEMENT", "PENDING_FIRST_REVIEW", "FIRST_REVIEW_PASSED",
    "PENDING_FINAL_REVIEW", "FINAL_REVIEW_PASSED",
    "PENDING_FUNDER_REVIEW", "FUNDER_REVIEW_PASSED",
    "PENDING_SIGN", "SIGNED",
    "PENDING_LOAN_REQUEST", "LOAN_REQUEST_APPROVED",
    "PENDING_DISBURSEMENT", "DISBURSED",
  ];
  const currentIdx = order.indexOf(currentStatus);
  const stepIdx = order.indexOf(stepStatus);
  if (currentIdx > stepIdx) return "已完成";
  if (currentStatus.includes("REJECTED")) {
    const rejectMap = {
      "RISK_PRE_REJECTED": "PENDING_RISK_PRE",
      "FIRST_REVIEW_REJECTED": "PENDING_FIRST_REVIEW",
      "FINAL_REVIEW_REJECTED": "PENDING_FINAL_REVIEW",
      "FUNDER_REVIEW_REJECTED": "PENDING_FUNDER_REVIEW",
      "LOAN_REQUEST_REJECTED": "PENDING_LOAN_REQUEST",
    };
    if (rejectMap[currentStatus] === stepStatus) return "已拒绝";
  }
  return "";
}

function formatMoney(val) {
  const num = Number(val);
  if (!num && num !== 0) return "—";
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 0 });
}

async function loadDetail() {
  loading.value = true;
  try {
    let res;
    if (creditOrderId.value) {
      res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    } else if (applicationId.value) {
      res = await businessApi.getCreditDetail(applicationId.value);
    } else {
      return;
    }
    const data = res?.data || res || {};
    if (data && (data.id || data.creditOrderId)) {
      info.value = {
        customerName: data.customerName || data.personName || data.name || "",
        phone: data.phone || data.telephone || "",
        applicationNo: data.applicationNo || data.creditOrderId || "",
        creditOrderId: data.creditOrderId || data.orderNo || "",
        productName: data.productName || "",
        funderName: data.funderName || "",
        amount: data.amount || data.pushQuota || 0,
        approvedAmount: data.approvedAmount || 0,
        term: data.term || data.periods || 0,
        approvedTerm: data.approvedTerm || 0,
        rate: data.rate || 0,
        approvedRate: data.approvedRate || 0,
        repaymentMethod: data.repaymentMethod || "",
        status: data.status || "",
        phaseCode: data.phaseCode || 0,
        currentNode: data.currentNode || data.nodeCode || 0,
        currentNodeName: data.currentNodeName || data.nodeName || "",
        currentStatus: data.currentStatus || data.nodeStatus || "",
        currentStatusName: data.currentStatusName || data.nodeStatusName || "",
        submittedAt: data.submittedAt || data.createTime || "",
      };
    }
  } catch (e) {
    console.warn("获取申请详情失败:", e);
    uni.showToast({ title: "获取详情失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function goToSign() {
  const d = info.value;
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.signing.signCenter, buildSignRouteQuery({ creditOrderId: d.creditOrderId || d.applicationNo, uuid: d.uuid || "", customerName: d.customerName })),
  });
}

function goToSupplement() {
  const d = info.value;
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.supplement.supplementDetail, buildSupplementRouteQuery({ creditOrderId: d.creditOrderId || d.applicationNo })),
  });
}

onLoad((options) => {
  creditOrderId.value = options?.creditOrderId || options?.orderId || "";
  applicationId.value = options?.id || options?.applicationId || "";
  loadDetail();
});
</script>

<style lang="scss" scoped>
.progress-page {
  padding: 24rpx;
  background: #f5f7fa;
  min-height: 100vh;
}

.customer-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

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
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
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
  padding: 8rpx 0;
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

.timeline-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

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

.timeline-track {
  padding: 0 8rpx;
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
  flex-shrink: 0;
  transition: all 0.3s;
}

.step-done .step-dot {
  background: #22c55e;
}

.step-current .step-dot {
  background: #3b82f6;
  box-shadow: 0 0 0 8rpx rgba(59, 130, 246, 0.15);
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

.step-time {
  font-size: 22rpx;
  color: #b0b0b0;
  margin-top: 6rpx;
}

.step-remark {
  font-size: 24rpx;
  color: #ef4444;
  margin-top: 6rpx;
  background: #fef2f2;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
}

.info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.info-header {
  margin-bottom: 20rpx;
}

.info-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
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

.action-bar {
  padding: 24rpx 0;
  display: flex;
  gap: 20rpx;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  padding: 80rpx 0;
}
</style>