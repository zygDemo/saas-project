<template>
  <app-page nav-title="确认额度" :back-url="backUrl">
    <view class="confirm-page">
      <view class="quota-card">
        <text class="quota-label">资方批复额度</text>
        <view class="quota-value">
          <text class="quota-currency">¥</text>
          <text class="quota-num">{{ formatMoney(displayAmount) }}</text>
        </view>
        <view class="quota-meta">
          <view class="meta-item">
            <text class="meta-label">期限</text>
            <text class="meta-value">{{ displayTerm || "-" }}期</text>
          </view>
          <view class="meta-divider" />
          <view class="meta-item">
            <text class="meta-label">年化利率</text>
            <text class="meta-value">{{ displayRate || "-" }}%</text>
          </view>
          <view class="meta-divider" />
          <view class="meta-item">
            <text class="meta-label">月供约</text>
            <text class="meta-value">¥{{ formatMoney(monthlyPayment) }}</text>
          </view>
        </view>
      </view>

      <view class="confirm-section">
        <view class="section-title">
          <text class="title-text">客户确认</text>
          <text class="title-sub">请核对以下信息并确认</text>
        </view>

        <AppForm :modelValue="form" :items="formItems" />

        <view class="confirm-check">
          <u-checkbox v-model="form.confirmed" shape="square">
            我已确认以上信息无误
          </u-checkbox>
        </view>
      </view>

      <view class="notice-card">
        <u-icon name="info-circle" size="28" color="#f59e0b" />
        <text class="notice-text">
          确认额度后，资方将按此额度放款。如需调整，请联系业务员或风控人员。
        </text>
      </view>

      <view class="footer-actions">
        <u-button type="default" size="large" shape="circle" plain @click="goBack">
          上一步
        </u-button>
        <u-button
          type="primary"
          size="large"
          shape="circle"
          :loading="submitting"
          :disabled="submitting"
          @click="handleConfirm"
        >
          确认额度并继续
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { useLocalStore } from "@/stores/local";
import { $u } from "uview-pro";
import AppForm from "@/components/app-form/app-form.vue";

const businessApi = useCarloanApi();
const localStore = useLocalStore();
const SIGN_PROGRESS_STORAGE_KEY = "SIGN_PROGRESS_MAP";

const creditOrderId = ref("");
const uuidVal = ref("");
const approvedAmount = ref(0);
const approvedTerm = ref(0);
const approvedRate = ref(0);
const applicationId = ref(null);
const submitting = ref(false);
const backUrl = ref("");

const form = reactive({
  confirmed: false,
  confirmAmount: "",
  confirmTerm: "",
  confirmRate: "",
  remark: "",
});

const isConfirmed = computed(() => !!form.confirmed);

const formItems = computed(() => [
  {
    key: "confirmAmount",
    label: "确认金额(元)",
    placeholder: "系统回填批复额度",
    type: "number",
    required: true,
  },
  {
    key: "confirmTerm",
    label: "确认期限(期)",
    placeholder: "系统回填批复期限",
    type: "number",
    disabled: true,
    readonly: true,
    clearable: false,
    required: true,
  },
  {
    key: "confirmRate",
    label: "确认利率(%)",
    placeholder: "系统回填，客户不可修改",
    type: "number",
    disabled: true,
    readonly: true,
    clearable: false,
    required: true,
  },
  {
    key: "remark",
    label: "备注",
    placeholder: "选填，如有特殊说明请填写",
    type: "textarea",
    required: false,
  },
]);

const displayAmount = computed(() => toNumber(form.confirmAmount || approvedAmount.value, 0));
const displayTerm = computed(() => toNumber(form.confirmTerm || approvedTerm.value, 0));
const displayRate = computed(() => normalizeRate(form.confirmRate || approvedRate.value));

const monthlyPayment = computed(() => {
  const amount = displayAmount.value;
  const rate = displayRate.value;
  const term = displayTerm.value || 1;
  if (!amount || !rate || !term) return 0;

  const monthlyRate = rate / 100 / 12;
  const payment =
    (amount * monthlyRate * (1 + monthlyRate) ** term) /
    ((1 + monthlyRate) ** term - 1);
  return Number.isFinite(payment) ? payment : 0;
});

onLoad((options) => {
  creditOrderId.value = options?.creditOrderId || "";
  uuidVal.value = options?.uuid || "";
  backUrl.value = options?.backUrl || "";
});

onMounted(() => {
  if (creditOrderId.value) {
    loadDetail();
  }
});

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function toNumber(value, fallback = 0) {
  if (typeof value === "string") {
    const normalized = value.replace(/[,，%％￥¥\s]/g, "");
    const num = Number(normalized);
    return Number.isFinite(num) ? num : fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeRate(value) {
  const rate = toNumber(value, 0);
  if (rate > 0 && rate < 1) return Number((rate * 100).toFixed(4));
  return rate;
}

async function loadDetail() {
  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    if (res?.code === 200 && res.data) {
      const d = res.data;
      applicationId.value = Number(d.id || d.applicationId || 0);
      approvedAmount.value = toNumber(
        firstPresent(d.approvedAmount, d.passQuota, d.validAmt, d.pushQuota, d.amount, d.loanAmount),
        0,
      );
      approvedTerm.value = toNumber(firstPresent(d.approvedTerm, d.term, d.periods), 0);
      approvedRate.value = normalizeRate(
        firstPresent(d.approvedRate, d.rate, d.executeRate, d.productRate, d.loanRate),
      );

      form.confirmAmount = String(approvedAmount.value || "");
      form.confirmTerm = String(approvedTerm.value || "");
      form.confirmRate = String(approvedRate.value || "");
    }
  } catch (e) {
    console.error("获取额度详情失败", e);
  }
}

function saveSignProgress(status) {
  if (!creditOrderId.value || !status) return;
  const progressMap = uni.getStorageSync(SIGN_PROGRESS_STORAGE_KEY) || {};
  progressMap[creditOrderId.value] = {
    status,
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_PROGRESS_STORAGE_KEY, progressMap);
}

function formatMoney(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0.00";
  return num.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function goBack() {
  if (backUrl.value) {
    uni.redirectTo({ url: backUrl.value });
    return;
  }
  uni.navigateBack();
}

async function handleConfirm() {
  if (!isConfirmed.value) {
    $u.toast("请先勾选确认选项", "error");
    return;
  }
  if (!applicationId.value) {
    $u.toast("额度信息未加载完成", "error");
    return;
  }
  if (!displayAmount.value || displayAmount.value <= 0) {
    $u.toast("请输入确认金额", "error");
    return;
  }
  if (!displayTerm.value || displayTerm.value <= 0) {
    $u.toast("请输入确认期限", "error");
    return;
  }
  if (!displayRate.value || displayRate.value <= 0) {
    $u.toast("利率信息未回填", "error");
    return;
  }

  submitting.value = true;
  try {
    await businessApi.confirmAmount({
      applicationId: Number(applicationId.value),
      approverId: Number(localStore.userInfo?.userId) || 0,
      approvedAmount: displayAmount.value,
      term: displayTerm.value,
      rate: displayRate.value,
    });

    saveSignProgress("BINDING_CARD");
    $u.toast("额度确认成功", "success");
    setTimeout(() => {
      goBack();
    }, 800);
  } catch {
    $u.toast("确认失败，请重试", "error");
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.confirm-page {
  min-height: 100%;
  padding: 24rpx 24rpx 160rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
}

.quota-card {
  background: linear-gradient(135deg, #1e3a8a, var(--u-type-primary));
  border-radius: 20rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
  color: #fff;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.3);
}

.quota-label {
  display: block;
  font-size: 26rpx;
  opacity: 0.85;
  margin-bottom: 16rpx;
}

.quota-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4rpx;
  margin-bottom: 28rpx;
}

.quota-currency {
  font-size: 36rpx;
  font-weight: 600;
}

.quota-num {
  font-size: 64rpx;
  font-weight: 800;
}

.quota-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.meta-label {
  font-size: 22rpx;
  opacity: 0.75;
}

.meta-value {
  font-size: 28rpx;
  font-weight: 600;
}

.meta-divider {
  width: 1rpx;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.25);
}

.confirm-section {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  margin-bottom: 20rpx;
}

.confirm-check {
  margin-top: 8rpx;
  padding: 18rpx 4rpx 4rpx;
  border-top: 1rpx solid #eef0f4;
}

.title-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
  display: block;
}

.title-sub {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 4rpx;
  display: block;
}

.notice-card {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: #fffbeb;
  border: 1rpx solid #fde68a;
  border-radius: 16rpx;
  padding: 24rpx;
}

.notice-text {
  font-size: 26rpx;
  color: #92400e;
  line-height: 1.5;
  flex: 1;
}

.footer-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 18rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);

  :deep(.u-btn) {
    flex: 1;
  }
}

@media (prefers-color-scheme: dark) {
  .confirm-page {
    background: #121212;
  }

  .confirm-section,
  .footer-actions {
    background: #1e1e1e;
  }

  .title-text {
    color: #e5e6eb;
  }

  .title-sub {
    color: #8b8c91;
  }
}
</style>
