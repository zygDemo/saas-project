<template>
  <app-page nav-title="进件详情">
    <view class="entry-detail-page">
      <view class="customer-card">
        <view class="customer-header">
          <view class="avatar">
            {{ (customerName || "?").charAt(0) }}
          </view>
          <view class="customer-info">
            <text class="customer-name">{{ customerName || "未命名客户" }}</text>
            <text class="customer-phone">{{ customerPhone || "-" }}</text>
          </view>
        </view>
        <view v-if="orderNo" class="order-row">
          <text class="order-label">订单号</text>
          <text class="order-value">{{ orderNo }}</text>
        </view>
      </view>

      <view class="section-title">进件资料</view>

      <view class="entry-grid">
        <view
          v-for="item in entryItems"
          :key="item.type"
          class="entry-card"
          @click="goEntry(item.type)"
        >
          <view class="card-icon-box" :class="item.iconClass">
            <u-icon :name="item.icon" size="44" color="#fff" />
          </view>
          <view class="card-body">
            <text class="card-title">{{ item.title }}</text>
            <text class="card-desc">{{ item.desc }}</text>
          </view>
          <view class="card-arrow">
            <u-icon name="arrow-right" size="30" color="#bfbfbf" />
          </view>
        </view>
      </view>

      <!-- <view class="action-area">
        <u-button
          type="primary"
          size="large"
          shape="circle"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交预审
        </u-button>
      </view> -->
    </view>
  </app-page>
</template>

<script setup>
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useBusinessApi } from "@/api/business";

const businessApi = useBusinessApi();

const customerName = ref("");
const customerPhone = ref("");
const orderNo = ref("");
const uuidVal = ref("");
const submitting = ref(false);

onLoad((options) => {
  uuidVal.value = options?.uuid || "";
  customerName.value = options?.name || "";
  customerPhone.value = options?.phone || "";
  orderNo.value = options?.creditOrderId || "";
});

const entryItems = computed(() => [
  {
    type: "idInfo",
    title: "身份证信息",
    desc: "完善客户身份、联系方式等",
    icon: "account",
    iconClass: "card-icon-customer",
  },
  {
    type: "carInfo",
    title: "车辆信息",
    desc: "完善车辆品牌、型号、年限等",
    icon: "car",
    iconClass: "card-icon-car",
  },
  // {
  //   type: "applyInfo",
  //   title: "申请信息",
  //   desc: "完善申请金额、期限等",
  //   icon: "order",
  //   iconClass: "card-icon-order",
  // },
]);

function goEntry(type) {
  if (!uuidVal.value) {
    uni.showToast({ title: "客户信息缺失", icon: "none" });
    return;
  }

  const params = `uuid=${encodeURIComponent(uuidVal.value)}`;
  const urlMap = {
    idInfo: `/pages/business/idInfo?${params}`,
    carInfo: `/pages/business/carInfo?${params}`,
    applyInfo: `/pages/business/applyInfo?${params}`,
  };
  const url = urlMap[type];
  if (url) {
    uni.navigateTo({ url });
  }
}

async function handleSubmit() {
  if (!orderNo.value) {
    uni.showToast({ title: "请先完善申请信息", icon: "none" });
    return;
  }

  const { confirm } = await uni.showModal({
    title: "确认提交",
    content: "提交后将进入预审流程，确认提交吗？",
    confirmText: "确认提交",
    cancelText: "再等等",
  });
  if (!confirm) return;

  submitting.value = true;
  try {
    await businessApi.submitInitialAudit(orderNo.value);
    uni.showToast({ title: "提交成功", icon: "success" });
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
.entry-detail-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 50%, #f1f5f9 100%);
  min-height: 100vh;
}

.customer-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.customer-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #5da7ff, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.customer-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e293b;
}

.customer-phone {
  font-size: 26rpx;
  color: #94a3b8;
}

.order-row {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f1f5f9;
  gap: 12rpx;
}

.order-label {
  font-size: 24rpx;
  color: #94a3b8;
}

.order-value {
  font-size: 24rpx;
  color: #334155;
  font-family: "SF Mono", monospace;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 20rpx;
  padding-left: 8rpx;
}

.entry-grid {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.entry-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  gap: 20rpx;

  &:active {
    background: #f8fafc;
    transform: scale(0.985);
  }
}

.card-icon-box {
  width: 84rpx;
  height: 84rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon-customer {
  background: linear-gradient(135deg, #5da7ff, #3b82f6);
}

.card-icon-car {
  background: linear-gradient(135deg, #10b981, #059669);
}

.card-icon-order {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
}

.card-desc {
  font-size: 24rpx;
  color: #94a3b8;
}

.card-arrow {
  flex-shrink: 0;
}

.action-area {
  margin-top: 40rpx;
  padding-bottom: 40rpx;
}
</style>
