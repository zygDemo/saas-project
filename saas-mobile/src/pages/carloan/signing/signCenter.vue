<template>
  <app-page nav-title="客户签约" :back-url="backUrl">
    <view class="sign-center-page">
      <!-- 客户信息卡片 -->
      <view class="customer-card">
        <view class="customer-header">
          <view class="avatar">
            {{ (customerName || "?").charAt(0) }}
          </view>
          <view class="customer-meta">
            <text class="customer-name">{{ customerName || "未知客户" }}</text>
            <text class="customer-phone">{{ customerPhone || "-" }}</text>
          </view>
        </view>
        <view v-if="creditOrderId" class="order-row">
          <text class="order-label">授信单号</text>
          <text class="order-value">{{ creditOrderId }}</text>
        </view>
      </view>

      <!-- 签约进度 -->
      <view class="progress-card">
        <view class="progress-header">
          <text class="progress-title">签约进度</text>
          <text class="progress-sub">{{ finishedStepCount }}/{{ stepList.length }} 已完成</text>
        </view>
        <view class="step-track">
          <view
            v-for="(step, index) in stepList"
            :key="step.key"
            class="step-item"
            :class="{
              'step-finish': step.status === 'finish',
              'step-doing': step.status === 'doing',
              'step-pending': step.status === 'pending',
            }" role="button" tabindex="0" @click="goStep(step)"
          >
            <view class="step-dot-wrap">
              <view class="step-dot">
                <u-icon
                  v-if="step.status === 'finish'"
                  name="checkbox-mark"
                  size="20"
                  color="#fff"
                />
                <text v-else-if="step.status === 'doing'" class="dot-text">
                  {{ index + 1 }}
                </text>
                <text v-else class="dot-text">{{ index + 1 }}</text>
              </view>
              <view v-if="index < stepList.length - 1" class="step-connector" />
            </view>
            <view class="step-info">
              <text class="step-name">{{ step.name }}</text>
              <text class="step-desc">{{ step.desc }}</text>
              <u-tag
                v-if="step.status === 'finish'"
                text="已完成"
                type="success"
                size="mini"
                plain
              />
              <u-tag
                v-else-if="step.status === 'doing'"
                text="进行中"
                type="primary"
                size="mini"
                plain
              />
              <u-tag
                v-else
                text="待办理"
                type="info"
                size="mini"
                plain
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 当前步骤提示 -->
      <view v-if="currentStep" class="tip-card">
        <u-icon name="info-circle" size="32" color="var(--u-type-primary)" />
        <text class="tip-text">
          当前待办：{{ currentStep.name }}，{{ currentStep.desc }}
        </text>
      </view>

      <!-- 底部按钮 -->
      <view class="footer-actions">
        <u-button
          v-if="currentStep"
          type="primary"
          size="large"
          shape="circle"
          :loading="loading"
          @click="goStep(currentStep)"
        >
          {{ currentStep.btnText || "前往办理" }}
        </u-button>
        <u-button
          v-else-if="allFinished"
          type="success"
          size="large"
          shape="circle"
          @click="finishSign"
        >
          签约完成，返回首页
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildSignRouteQuery } from "@/common/carloan-route-query";

const businessApi = useCarloanApi();

const creditOrderId = ref("");
const uuidVal = ref("");
const customerName = ref("");
const customerPhone = ref("");
const loading = ref(false);
const backUrl = ref("");
const signStatus = ref("PENDING"); // PENDING / CONFIRMING_AMOUNT / BINDING_CARD / SIGNING_CONTRACT / GPS_APPOINTING / MORTGAGING / SIGNED

const stepList = computed(() => {
  const s = signStatus.value;
  const steps = [
    {
      key: "CONFIRM_AMOUNT",
      name: "确认额度",
      desc: "确认资方批复的贷款额度和利率",
      btnText: "确认额度",
      path: APP_ROUTES.carloan.signing.signConfirmAmount,
      status: getStepStatus("CONFIRM_AMOUNT", s),
    },
    {
      key: "BIND_CARD",
      name: "绑卡",
      desc: "绑定收款银行卡",
      btnText: "去绑卡",
      path: APP_ROUTES.carloan.signing.signBindCard,
      status: getStepStatus("BIND_CARD", s),
    },
    {
      key: "SIGN_CONTRACT",
      name: "合同签约",
      desc: "在线签署贷款合同",
      btnText: "去签约",
      path: APP_ROUTES.carloan.signing.videoFaceSign,
      status: getStepStatus("SIGN_CONTRACT", s),
    },
    {
      key: "GPS_APPOINTMENT",
      name: "GPS安装预约",
      desc: "预约GPS设备安装时间和地点",
      btnText: "预约安装",
      path: APP_ROUTES.carloan.signing.signGpsAppointment,
      status: getStepStatus("GPS_APPOINTMENT", s),
    },
    {
      key: "MORTGAGE",
      name: "抵押办理",
      desc: "预约或办理车辆抵押登记",
      btnText: "办理抵押",
      path: APP_ROUTES.carloan.signing.signMortgage,
      status: getStepStatus("MORTGAGE", s),
    },
  ];
  return steps;
});

const SIGN_PROGRESS_STORAGE_KEY = "SIGN_PROGRESS_MAP";

const SIGN_STEP_TO_STATUS = {
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

function getLocalSignStatus() {
  if (!creditOrderId.value) return "";
  const progressMap = uni.getStorageSync(SIGN_PROGRESS_STORAGE_KEY) || {};
  return progressMap[creditOrderId.value]?.status || "";
}

function saveLocalSignStatus(status) {
  if (!creditOrderId.value || !status) return;
  const progressMap = uni.getStorageSync(SIGN_PROGRESS_STORAGE_KEY) || {};
  progressMap[creditOrderId.value] = {
    ...(progressMap[creditOrderId.value] || {}),
    status,
    uuid: uuidVal.value,
    customerName: customerName.value,
    customerPhone: customerPhone.value,
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_PROGRESS_STORAGE_KEY, progressMap);
}

function normalizeSignStatus(status) {
  if (!status || status === "PENDING") return "CONFIRMING_AMOUNT";
  if (status === "SIGNING_PROGRESS") return "CONFIRMING_AMOUNT";
  return status;
}

function getStepStatus(stepKey, currentStatus) {
  const stepStatus = SIGN_STEP_TO_STATUS[stepKey];
  const normalizedStatus = normalizeSignStatus(currentStatus);
  const stepIndex = SIGN_STATUS_ORDER.indexOf(stepStatus);
  const currentIndex = SIGN_STATUS_ORDER.indexOf(normalizedStatus);

  if (normalizedStatus === "SIGNED") return "finish";
  if (stepIndex < currentIndex) return "finish";
  if (stepIndex === currentIndex) return "doing";
  return "pending";
}

const currentStep = computed(() => {
  return stepList.value.find((s) => s.status === "doing");
});

const allFinished = computed(() => {
  return stepList.value.every((s) => s.status === "finish");
});

const finishedStepCount = computed(() => {
  return stepList.value.filter((s) => s.status === "finish").length;
});

onLoad((options) => {
  creditOrderId.value = options?.creditOrderId || "";
  uuidVal.value = options?.uuid || "";
  customerName.value = options?.customerName || "";
  customerPhone.value = options?.customerPhone || "";
  backUrl.value =
    options?.backUrl ||
    buildRoute(APP_ROUTES.carloan.precheck.applyDetail, {
      creditOrderId: creditOrderId.value,
      uuid: uuidVal.value,
    });

  const localStatus = getLocalSignStatus();
  if (options?.signStatus || localStatus) {
    signStatus.value = normalizeSignStatus(options?.signStatus || localStatus);
  } else {
    signStatus.value = "CONFIRMING_AMOUNT";
  }
});

onMounted(() => {
  if (creditOrderId.value) {
    loadSignStatus();
  }
});

// 从子页面返回时刷新签约状态
onShow(() => {
  if (creditOrderId.value) {
    const localStatus = getLocalSignStatus();
    if (localStatus) {
      signStatus.value = normalizeSignStatus(localStatus);
    }
  }
});

// 后端 ApplicationStatus → 签约步骤映射
const STATUS_TO_SIGN_STEP = {
  PENDING_SIGN: "CONFIRMING_AMOUNT",
  SIGNING_PROGRESS: "CONFIRMING_AMOUNT",
  SIGNED: "SIGNED",
  PENDING_LOAN_REQUEST: "SIGNED",
  LOAN_REQUEST_REVIEWING: "SIGNED",
  LOAN_REQUEST_APPROVED: "SIGNED",
  PENDING_DISBURSEMENT: "SIGNED",
  DISBURSED: "SIGNED",
  SETTLED: "SIGNED",
};

async function loadSignStatus() {
  loading.value = true;
  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    if (res?.code === 200 && res.data) {
      const d = res.data;
      customerName.value = d.name || d.customerName || d.personName || customerName.value;
      customerPhone.value = d.phone || d.telephone || customerPhone.value;

      const localStatus = getLocalSignStatus();
      const businessNode = d.businessNode || "";
      const creditStatus = d.status; // 1=成功 2=失败 3=补件 4=处理中
      const passQuota = Number(d.passQuota || d.validAmt || 0);
      const appStatus = d.currentNode || d.applicationStatus || "";

      // 优先级：本地进度 > 后端状态推断 > 默认
      let inferredStatus = localStatus || "";

      if (!inferredStatus) {
        // 已放款/已签约 → 全部完成
        if (businessNode === "LOAN_DISBURSEMENT" && creditStatus === 1) {
          inferredStatus = "SIGNED";
        }
        // 签约阶段
        else if (businessNode === "SIGN_CONTRACT") {
          if (passQuota > 0) {
            inferredStatus = "BINDING_CARD"; // 有核定金额，从绑卡开始
          } else {
            inferredStatus = "CONFIRMING_AMOUNT";
          }
        }
        // 有核定金额 → 额度已确认
        else if (passQuota > 0) {
          inferredStatus = "BINDING_CARD";
        }
        // 默认
        else {
          inferredStatus = "CONFIRMING_AMOUNT";
        }
      }

      // 如果本地无进度，且后端状态明确，用后端状态覆盖
      if (!localStatus && appStatus && STATUS_TO_SIGN_STEP[appStatus]) {
        inferredStatus = STATUS_TO_SIGN_STEP[appStatus];
      }

      signStatus.value = normalizeSignStatus(inferredStatus);
      saveLocalSignStatus(signStatus.value);
    }
  } catch (e) {
    console.error("获取签约状态失败", e);
  } finally {
    loading.value = false;
  }
}

function goStep(step) {
  if (!step?.path) return;
  const signRouteQuery = buildSignRouteQuery({
    creditOrderId: creditOrderId.value,
    uuid: uuidVal.value,
    customerName: customerName.value || "",
    customerPhone: customerPhone.value || "",
    type: step.key === "SIGN_CONTRACT" ? "contract" : undefined,
    name: step.key === "SIGN_CONTRACT" ? customerName.value || "" : "",
    phone: step.key === "SIGN_CONTRACT" ? customerPhone.value || "" : "",
    backUrl: backUrl.value,
  });
  uni.navigateTo({
    url: buildRoute(step.path, signRouteQuery),
  });
}

function finishSign() {
  uni.reLaunch({ url: APP_ROUTES.carloan.portal.workbench });
}
</script>

<style lang="scss" scoped>
.sign-center-page {
  min-height: 100%;
  padding: 24rpx 24rpx 160rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
}

/* ===== 客户卡片 ===== */
.customer-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.customer-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--u-type-primary), var(--u-type-primary-dark));
  flex-shrink: 0;
}

.customer-meta {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2937;
}

.customer-phone {
  font-size: 26rpx;
  color: #6b7280;
}

.order-row {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f3f4f6;
  gap: 12rpx;
}

.order-label {
  font-size: 24rpx;
  color: #9ca3af;
}

.order-value {
  font-size: 24rpx;
  color: #4b5563;
  font-family: monospace;
}

/* ===== 进度卡片 ===== */
.progress-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28rpx;
}

.progress-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.progress-sub {
  font-size: 24rpx;
  color: #6b7280;
}

.step-track {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step-item {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 0;
  position: relative;
}

.step-dot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.step-dot {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  transition: all 0.3s;
}

.dot-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #9ca3af;
}

.step-connector {
  width: 2rpx;
  flex: 1;
  min-height: 40rpx;
  background: #e5e7eb;
  margin: 8rpx 0;
}

/* 完成状态 */
.step-finish .step-dot {
  background: #10b981;
}
.step-finish .step-connector {
  background: #10b981;
}

/* 进行中 */
.step-doing .step-dot {
  background: var(--u-type-primary);
  box-shadow: 0 0 0 6rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.2);
}
.step-doing .dot-text {
  color: #fff;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding-top: 4rpx;
  flex: 1;
}

.step-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.step-desc {
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 4rpx;
}

/* ===== 提示卡片 ===== */
.tip-card {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: linear-gradient(135deg, #eff6ff, #ecfeff);
  border: 1rpx solid #dbeafe;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #1e40af;
  line-height: 1.5;
  flex: 1;
}

/* ===== 底部按钮 ===== */
.footer-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container { background-color: #121212; }
  .card { background-color: #1e1e1e; }
  .card-item { background-color: #1e1e1e; }
  .list-item { background-color: #1e1e1e; }
  .section { background-color: #1e1e1e; }
  .header { background-color: #1e1e1e; }
  .title { color: #e5e6eb; }
  .subtitle { color: #8b8c91; }
  .desc { color: #8b8c91; }
  .label { color: #b0b3b8; }
  .value { color: #e5e6eb; }
  .name { color: #e5e6eb; }
  .info { color: #b0b3b8; }
  .text { color: #e5e6eb; }
  .tip { color: #8b8c91; }
  .empty-text { color: #666; }
  .divider { background-color: #2a2a2a; }
  .border { border-color: #2a2a2a; }
  .input { background-color: #2a2a2a; color: #e5e6eb; }
  .search-bar { background-color: #2a2a2a; }
  .tab-bar { background-color: #1e1e1e; border-color: #2a2a2a; }
  .tab-item { color: #b0b3b8; }
  .tab-item.active { color: var(--u-type-primary); }
  .status-bar { background-color: #1e1e1e; }
  .footer { background-color: #1e1e1e; }
  .modal { background-color: #1e1e1e; }
  .popup { background-color: #1e1e1e; }
  .shadow { box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05); }
}
</style>
