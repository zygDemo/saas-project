<template>
  <app-page nav-title="确认额度">
    <view class="confirm-page">
      <!-- 额度卡片 -->
      <view class="quota-card">
        <text class="quota-label">资方批复额度</text>
        <view class="quota-value">
          <text class="quota-currency">¥</text>
          <text class="quota-num">{{ formatMoney(approvedAmount) }}</text>
        </view>
        <view class="quota-meta">
          <view class="meta-item">
            <text class="meta-label">期限</text>
            <text class="meta-value">{{ approvedTerm || "-" }}期</text>
          </view>
          <view class="meta-divider" />
          <view class="meta-item">
            <text class="meta-label">年化利率</text>
            <text class="meta-value">{{ approvedRate || "-" }}%</text>
          </view>
          <view class="meta-divider" />
          <view class="meta-item">
            <text class="meta-label">月供约</text>
            <text class="meta-value">¥{{ formatMoney(monthlyPayment) }}</text>
          </view>
        </view>
      </view>

      <!-- 客户确认 -->
      <view class="confirm-section">
        <view class="section-title">
          <text class="title-text">客户确认</text>
          <text class="title-sub">请核对以下信息并确认</text>
        </view>

        <AppForm :modelValue="form" :items="formItems" />
      </view>

      <!-- 说明 -->
      <view class="notice-card">
        <u-icon name="info-circle" size="28" color="#f59e0b" />
        <text class="notice-text">
          确认额度后，资方将按此额度放款。如需调整，请联系业务员或风控人员。
        </text>
      </view>

      <!-- 底部按钮 -->
      <view class="footer-actions">
        <u-button
          type="primary"
          size="large"
          shape="circle"
          :loading="submitting"
          :disabled="!form.confirmed"
          @click="handleConfirm"
        >
          确认额度并继续
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useBusinessApi } from "@/api/business";
import { $u } from "uview-pro";
import AppForm from "@/components/app-form/app-form.vue";

const businessApi = useBusinessApi();
const SIGN_PROGRESS_STORAGE_KEY = "SIGN_PROGRESS_MAP";

function saveSignProgress(status) {
  if (!creditOrderId.value || !status) return;
  const progressMap = uni.getStorageSync(SIGN_PROGRESS_STORAGE_KEY) || {};
  progressMap[creditOrderId.value] = {
    status,
    updatedAt: Date.now(),
  };
  uni.setStorageSync(SIGN_PROGRESS_STORAGE_KEY, progressMap);
}

const creditOrderId = ref("");
const uuidVal = ref("");
const approvedAmount = ref(0);
const approvedTerm = ref(0);
const approvedRate = ref(0);
const submitting = ref(false);

const form = reactive({
  confirmed: false,
  confirmAmount: "",
  confirmTerm: "",
  confirmRate: "",
  remark: "",
});

const formItems = computed(() => [
  {
    key: "confirmAmount",
    label: "确认金额(元)",
    placeholder: "请输入确认金额，默认为批复额度",
    type: "number",
    required: true,
  },
  {
    key: "confirmTerm",
    label: "确认期限(期)",
    placeholder: "请输入确认期限，默认为批复期限",
    type: "number",
    required: true,
  },
  {
    key: "confirmRate",
    label: "确认利率(%)",
    placeholder: "请输入确认利率，默认为批复利率",
    type: "digit",
    required: true,
  },
  {
    key: "remark",
    label: "备注",
    placeholder: "选填，如有特殊说明请填写",
    type: "textarea",
    required: false,
  },
  {
    key: "confirmed",
    label: "我已确认以上信息无误",
    type: "checkbox",
    required: true,
  },
]);

const monthlyPayment = computed(() => {
  const amount = Number(form.confirmAmount || approvedAmount.value || 0);
  const rate = Number(form.confirmRate || approvedRate.value || 0);
  const term = Number(form.confirmTerm || approvedTerm.value || 1);
  if (!amount || !rate || !term) return 0;
  // 等额本息近似计算
  const monthlyRate = rate / 100 / 12;
  const payment =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
    (Math.pow(1 + monthlyRate, term) - 1);
  return Number.isFinite(payment) ? payment : 0;
});

onLoad((options) => {
  creditOrderId.value = options?.creditOrderId || "";
  uuidVal.value = options?.uuid || "";
});

onMounted(() => {
  if (creditOrderId.value) {
    loadDetail();
  }
});

async function loadDetail() {
  try {
    const res = await businessApi.getCreditDetailByOrderId(creditOrderId.value);
    if (res?.code === 200 && res.data) {
      const d = res.data;
      approvedAmount.value = Number(d.approvedAmount || d.amount || 0);
      approvedTerm.value = Number(d.approvedTerm || d.term || d.periods || 0);
      approvedRate.value = Number(d.approvedRate || d.rate || 0);

      form.confirmAmount = String(approvedAmount.value || "");
      form.confirmTerm = String(approvedTerm.value || "");
      form.confirmRate = String(approvedRate.value || "");
    }
  } catch (e) {
    console.error("获取额度详情失败", e);
  }
}

function formatMoney(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0.00";
  return num.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function handleConfirm() {
  if (!form.confirmed) {
    $u.toast("请先勾选确认选项", "error");
    return;
  }
  if (!form.confirmAmount || Number(form.confirmAmount) <= 0) {
    $u.toast("请输入确认金额", "error");
    return;
  }
  if (!form.confirmTerm || Number(form.confirmTerm) <= 0) {
    $u.toast("请输入确认期限", "error");
    return;
  }

  submitting.value = true;
  try {
    // TODO: 等待后端提供额度确认接口
    // await businessApi.confirmAmount({
    //   creditOrderId: creditOrderId.value,
    //   confirmedAmount: Number(form.confirmAmount),
    //   confirmedTerm: Number(form.confirmTerm),
    //   confirmedRate: Number(form.confirmRate),
    //   remark: form.remark,
    // });

    saveSignProgress("BINDING_CARD");
    $u.toast("额度确认成功", "success");
    setTimeout(() => {
      uni.navigateBack();
    }, 800);
  } catch (e) {
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

/* ===== 额度卡片 ===== */
.quota-card {
  background: linear-gradient(135deg, #1e3a8a, #3b82f6);
  border-radius: 20rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 24rpx;
  color: #fff;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(59, 130, 246, 0.3);
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

/* ===== 确认区域 ===== */
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

/* ===== 说明卡片 ===== */
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

/* ===== 底部按钮 ===== */
.footer-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.06);
}
</style>
