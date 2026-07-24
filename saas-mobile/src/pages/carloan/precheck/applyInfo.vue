<template>
  <app-page nav-title="申请信息">
    <view class="apply-page">
      <view class="marketing-card">
        <view class="marketing-title">车贷一站式服务</view>
        <view class="marketing-subtitle">
          极速审批 · 高通过率 · 利率低至0.6%
        </view>
        <view class="marketing-features">
          <view class="feature-tag">无抵押</view>
          <view class="feature-tag">放款快</view>
          <view class="feature-tag">门槛低</view>
        </view>
      </view>

      <view class="section-title">
        <text class="title-text">请填写申请信息</text>
      </view>

      <AppForm :modelValue="form" :items="formItems" />

      <view class="footer-btn" :class="{ 'edit-mode': isEditMode }">
        <u-button
          v-if="isEditMode"
          type="default"
          shape="circle"
          :loading="submitLoading"
          @click="handleSave"
        >
          保存
        </u-button>
        <u-button
          type="primary"
          shape="circle"
          :loading="submitLoading"
          @click="handleSubmit()"
        >
          {{ isEditMode ? "下一步" : "提交申请" }}
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { $u } from "uview-pro";
import { ref, reactive } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import AppForm from "@/components/app-form/app-form.vue";
import { useSessionStore } from "@/stores";
import { useCarloanApi } from "@/api/carloan";
import { storeToRefs } from "pinia";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { useCarloanStore } from "@/stores/carloan";

const sessionStore = useSessionStore()
const carloanStore = useCarloanStore();
const { orderInfo } = storeToRefs(sessionStore);
const businessApi = useCarloanApi();

const submitLoading = ref(false);
const isEditMode = ref(false);
// 表单数据（对接接口：uuid、amount、periods）
const form = reactive({
  amount: "", // 申请金额
  periods: "", // 贷款期数
});

// 期数选项
const periodOptions = [
  { label: "12期", value: 12 },
  { label: "24期", value: 24 },
  { label: "36期", value: 36 },
  { label: "48期", value: 48 },
];

// 静态表单项
const formItems = [
  {
    key: "amount",
    label: "申请金额(元)",
    placeholder: "请输入申请金额",
    type: "number",
    required: true,
  },
  {
    key: "periods",
    label: "贷款期数",
    placeholder: "请选择贷款期数",
    type: "select",
    required: true,
    options: periodOptions,
  },
];

function applyRouteForm(query = {}) {
  const amount = query.amount || query.pushQuota || "";
  if (amount !== "") {
    form.amount = String(amount);
  }
  if (query.periods !== undefined && query.periods !== "") {
    form.periods = Number(query.periods);
  }
}

onLoad((query) => {
  const previousContext = { ...carloanStore.pageContext };
  carloanStore.syncFromRouteQuery(query);
  // 从详情页传入的 uuid 保存到 sessionStore，供提交使用
  if (query.uuid) {
    carloanStore.pageContext.uuid = query.uuid;
    sessionStore.setOrderInfo({ uuid: query.uuid });
  } else if (previousContext.uuid) {
    carloanStore.pageContext.uuid = previousContext.uuid;
    sessionStore.setOrderInfo({ uuid: previousContext.uuid });
  }
  isEditMode.value = query.fromEntry === "1";
  carloanStore.pageContext.creditOrderId = query.creditOrderId || previousContext.creditOrderId || "";
  carloanStore.pageContext.customerName = query.name || previousContext.customerName || "";
  carloanStore.pageContext.customerPhone = query.phone || previousContext.customerPhone || "";
  if (carloanStore.pageContext.creditOrderId) {
    sessionStore.setOrderInfo({ creditOrderId: carloanStore.pageContext.creditOrderId });
  }
  applyRouteForm(query);
});

const doSubmit = async () => {
  const amountText = String(form.amount || "").trim();
  if (!amountText) {
    $u.toast("请输入申请金额", "error");
    return null;
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(amountText) || Number(amountText) <= 0) {
    $u.toast("请输入正确的申请金额", "error");
    return null;
  }
  if (Number(amountText) > 99999999) {
    $u.toast("申请金额不能超过99999999元", "error");
    return null;
  }
  if (!form.periods) {
    $u.toast("请选择贷款期数", "error");
    return null;
  }
  const periodValues = periodOptions.map((item) => Number(item.value));
  if (!periodValues.includes(Number(form.periods))) {
    $u.toast("请选择正确的贷款期数", "error");
    return null;
  }

  const info = orderInfo.value || {};
  const uuid = info.uuid || "";
  if (!uuid) {
    $u.toast("客户订单信息缺失，请重新进件", "error");
    return null;
  }

  const res = await businessApi.creditApply({
    uuid,
    creditOrderId: info.creditOrderId || undefined,
    amount: Number(amountText),
    periods: Number(form.periods),
    businessType: info.businessType || undefined,
  });

  if (res?.code === 200) {
    const creditOrderId = res.data?.creditOrderId || "";
    sessionStore.setOrderInfo({
      applyInfo: { ...form },
      creditOrderId: creditOrderId || info.creditOrderId || carloanStore.pageContext.creditOrderId,
    });
    // 更新进件进度：标记申请信息已完成
    const progressKey = creditOrderId || info.creditOrderId || carloanStore.pageContext.creditOrderId || carloanStore.pageContext.uuid || "";
    if (progressKey) {
      const progressMap = uni.getStorageSync("ENTRY_PROGRESS_MAP") || {};
      progressMap[progressKey] = progressMap[progressKey] || {};
      progressMap[progressKey].APPLICATION = 1;
      if (carloanStore.pageContext.uuid && carloanStore.pageContext.uuid !== progressKey) {
        progressMap[carloanStore.pageContext.uuid] = progressMap[carloanStore.pageContext.uuid] || {};
        progressMap[carloanStore.pageContext.uuid].APPLICATION = 1;
      }
      uni.setStorageSync("ENTRY_PROGRESS_MAP", progressMap);
    }
    $u.toast("申请已提交！", "success");
    return { uuid, creditOrderId: creditOrderId || info.creditOrderId || carloanStore.pageContext.creditOrderId };
  }
  return null;
};

async function handleSubmit() {
  submitLoading.value = true;
  try {
    const result = await doSubmit();
    if (result) {
      const { creditOrderId, uuid } = result;
      setTimeout(() => {
        uni.$u.route({
          url: buildRoute(APP_ROUTES.carloan.signing.videoFaceSign, {
            creditOrderId,
            uuid,
            name: carloanStore.pageContext.customerName || "",
            phone: carloanStore.pageContext.customerPhone || "",
            mode: "credit",
          }),
          type: "redirectTo",
        });
      }, 600);
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    submitLoading.value = false;
  }
}

async function handleSave() {
  submitLoading.value = true;
  try {
    const result = await doSubmit();
    if (result) {
      setTimeout(() => {
        uni.navigateBack();
      }, 800);
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.apply-page {
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

// ===== 营销卡片 =====
.marketing-card {
  background: linear-gradient(
    135deg,
    var(--u-type-primary-dark),
    var(--u-type-primary)
  );
  border-radius: 20rpx;
  padding: 24rpx 32rpx 28rpx;
  color: #fff;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.3);
}

.marketing-title {
  font-size: 40rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.marketing-subtitle {
  font-size: 26rpx;
  margin-top: 12rpx;
  opacity: 0.85;
}

.marketing-features {
  display: flex;
  gap: 16rpx;
  margin-top: 24rpx;
}

.feature-tag {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  padding: 6rpx 24rpx;
  font-size: 24rpx;
  backdrop-filter: blur(4px);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 24rpx;
}

.title-dot {
  width: 6rpx;
  height: 28rpx;
  background: linear-gradient(
    180deg,
    var(--u-type-primary),
    var(--u-type-primary-dark)
  );
  border-radius: 4rpx;
}

.title-text {
  font-size: 28rpx;
  font-weight: bold;
  color: $u-main-color;
}

.footer-btn {
  margin-top: 32rpx;
  display: flex;
  justify-content: center;

  &.edit-mode {
    gap: 24rpx;
    padding: 0 24rpx;

    :deep(.u-btn) {
      flex: 1;
    }
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container { background-color: #121212; }
  .card { background-color: #1e1e1e; }
  .card-item { background-color: #1e1e1e; }
  .list-item { background-color: #1e1e1e; }
  .section { background-color: #1e1e1e; }
  .form-item { background-color: #1e1e1e; border-color: #2a2a2a; }
  .title { color: #e5e6eb; }
  .subtitle { color: #8b8c91; }
  .desc { color: #8b8c91; }
  .label { color: #b0b3b8; }
  .value { color: #e5e6eb; }
  .name { color: #e5e6eb; }
  .info { color: #b0b3b8; }
  .text { color: #e5e6eb; }
  .tip { color: #8b8c91; }
  .divider { background-color: #2a2a2a; }
  .border { border-color: #2a2a2a; }
  .input { background-color: #2a2a2a; color: #e5e6eb; }
  .textarea { background-color: #2a2a2a; color: #e5e6eb; }
  .picker { background-color: #2a2a2a; color: #e5e6eb; }
  .footer { background-color: #1e1e1e; }
}
</style>
