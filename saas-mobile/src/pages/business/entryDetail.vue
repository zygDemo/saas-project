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

      <view class="section-title">预审进件资料</view>

      <view class="entry-grid">
        <view
          v-for="item in entryItems"
          :key="item.code"
          class="entry-card"
          @click="goEntry(item)"
        >
          <view class="card-icon-box" :class="item.iconClass">
            <u-icon :name="item.icon" size="44" color="#fff" />
          </view>
          <view class="card-body">
            <view class="card-title-row">
              <text class="card-title">{{ item.name }}</text>
              <u-tag
                class="mobile-status-tag"
                :text="getEntryStatusTag(item).text"
                :type="getEntryStatusTag(item).type"
                size="mini"
                plain
              />
            </view>
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
const ENTRY_PROGRESS_STORAGE_KEY = "ENTRY_PROGRESS_MAP";
const entryProgress = ref({});
const flowSteps = ref([]);

// 步骤图标和样式映射
const STEP_META_MAP = {
  ID_CARD: {
    icon: "account",
    iconClass: "card-icon-customer",
    desc: "完善客户身份、证件、联系方式等",
    route: "/pages/business/idInfo",
  },
  VEHICLE: {
    icon: "car",
    iconClass: "card-icon-car",
    desc: "完善车辆品牌、型号、年限等",
    route: "/pages/business/carInfo",
  },
  APPLICATION: {
    icon: "order",
    iconClass: "card-icon-order",
    desc: "完善申请金额、期限、产品等",
    route: "/pages/business/applyInfo",
  },
  AUTH_SIGN: {
    icon: "edit-pen",
    iconClass: "card-icon-sign",
    desc: "签署授权书，授权资方查询征信等",
    route: "/pages/business/authSign",
  },
  PENDING_PRECHECK: {
    icon: "clock",
    iconClass: "card-icon-pending",
    desc: "等待系统预审，提交后自动进入风控",
    route: "",
  },
};

onLoad(async (options) => {
  uuidVal.value = options?.uuid || "";
  customerName.value = options?.name || "";
  customerPhone.value = options?.phone || "";
  orderNo.value = options?.creditOrderId || "";
  loadEntryProgress();
  await loadFlowSteps();
});

async function loadFlowSteps() {
  try {
    const res = await businessApi.getFlowSteps("1100");
    if (res?.code === 200 && Array.isArray(res.data)) {
      flowSteps.value = res.data;
    }
  } catch (err) {
    console.error("获取流程步骤失败:", err);
    // 使用默认步骤
    flowSteps.value = [
      { code: "ID_CARD", name: "身份证信息", sort: 1110 },
      { code: "VEHICLE", name: "车辆信息", sort: 1120 },
      { code: "APPLICATION", name: "申请信息", sort: 1130 },
      { code: "AUTH_SIGN", name: "签署授权书", sort: 1140 },
      { code: "PENDING_PRECHECK", name: "待预审", sort: 1150 },
    ];
  }
}

const entryItems = computed(() => {
  return flowSteps.value
    .filter((step) => step.code !== "PENDING_PRECHECK") // 待预审不需要可点击
    .map((step) => {
      const meta = STEP_META_MAP[step.code] || {};
      return {
        code: step.code,
        name: step.name,
        sort: step.sort,
        icon: meta.icon || "list",
        iconClass: meta.iconClass || "card-icon-default",
        desc: meta.desc || "完善相关信息",
        route: meta.route || "",
      };
    });
});

function loadEntryProgress() {
  const progressMap = uni.getStorageSync(ENTRY_PROGRESS_STORAGE_KEY) || {};
  const key = orderNo.value || uuidVal.value;
  entryProgress.value = key ? progressMap[key] || {} : {};
}

function getEntryStatusTag(item) {
  const status = entryProgress.value?.[item.code];
  if (status === 1 || status === true || status === "done") {
    return { text: "已完善", type: "success" };
  }
  return { text: "待完善", type: "warning" };
}

function goEntry(item) {
  if (!uuidVal.value) {
    uni.showToast({ title: "客户信息缺失", icon: "none" });
    return;
  }

  if (!item.route) {
    uni.showToast({ title: "该步骤暂不需要操作", icon: "none" });
    return;
  }

  const params = [
    `uuid=${encodeURIComponent(uuidVal.value)}`,
    orderNo.value ? `creditOrderId=${encodeURIComponent(orderNo.value)}` : "",
    customerName.value ? `name=${encodeURIComponent(customerName.value)}` : "",
    customerPhone.value ? `phone=${encodeURIComponent(customerPhone.value)}` : "",
  ].filter(Boolean).join("&");

  uni.navigateTo({ url: `${item.route}?${params}` });
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
  position: relative;
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 20rpx;
  padding-left: 22rpx;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 7rpx;
    height: 30rpx;
    border-radius: 8rpx;
    background: linear-gradient(180deg, #5da7ff, #3b82f6);
    transform: translateY(-50%);
  }
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

.card-icon-sign {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.card-icon-pending {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.card-icon-default {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.mobile-status-tag {
  flex-shrink: 0;
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
