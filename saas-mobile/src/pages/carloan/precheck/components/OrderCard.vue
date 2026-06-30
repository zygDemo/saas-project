<template>
  <view class="order-card" :class="`status-${order.statusClass}`" @click="$emit('detail', order)">
    <view class="order-main">
      <view class="order-header">
        <view class="order-header__left">
          <text class="customer-name">{{ order.name }}</text>
          <view v-if="order.nodeStatusLabel" class="status-tag">
            <view class="status-tag__dot" />
            <text class="status-tag__text">{{ order.nodeStatusLabel }}</text>
          </view>
        </view>
        <text v-if="order.pushQuota" class="amount-value">¥{{ order.pushQuota }}</text>
      </view>

      <view class="order-subheader">
        <text class="customer-phone">{{ order.phone }}</text>
        <text v-if="order.businessNodeLabel" class="business-node">{{ order.businessNodeLabel }}</text>
      </view>

      <view v-if="order.plateNumber || order.productName || order.vehicleDisplay" class="order-meta">
        <text v-if="order.plateNumber" class="plate-number">{{ order.plateNumber }}</text>
        <text v-if="order.productName" class="product-text">{{ order.productName }}</text>
        <text v-if="!order.plateNumber && order.vehicleDisplay" class="vehicle-text">{{ order.vehicleDisplay }}</text>
      </view>

      <view class="order-footer">
        <view class="order-tags">
          <u-tag
            v-for="tag in getOrderTags(order)"
            :key="tag.text"
            :text="tag.text"
            size="mini"
            :type="tag.type"
            plain
          />
        </view>
        <view class="order-actions">
          <u-button v-if="canGoSign" size="mini" type="success" @click.stop="$emit('sign', order)">签约</u-button>
          <u-button size="mini" type="primary" @click.stop="$emit('detail', order)">详情</u-button>
          <u-button size="mini" type="info" @click.stop="$emit('flow-record', order)">流程</u-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { OrderListViewItem } from "../types";

defineProps<{
  order: OrderListViewItem;
  canGoSign: boolean;
}>();

defineEmits<{
  (e: "detail", order: OrderListViewItem): void;
  (e: "sign", order: OrderListViewItem): void;
  (e: "flow-record", order: OrderListViewItem): void;
}>();

function getOrderTags(order: OrderListViewItem) {
  const tags: Array<{ text: string; type: "primary" | "success" | "error" }> = [];
  if (order.phaseName) tags.push({ text: order.phaseName, type: "primary" });
  if (order.isSignContract === 1) tags.push({ text: "已签约", type: "success" });
  if (order.isFaceRecognition === 2) tags.push({ text: "已认证", type: "success" });
  if (order.isFaceRecognition === 3) tags.push({ text: "认证失败", type: "error" });
  return tags;
}
</script>

<style lang="scss" scoped>
/* SCSS 变量 — 子组件 scoped 样式无法继承父级变量，需重复声明 */
$bg-surface: #ffffff;
$border-subtle: #ebedf2;
$text-main: #1a1d29;
$text-body: #4e5566;
$text-hint: #8b93a7;
$text-light: #b0b8cc;
$primary: #4f7cff;
$primary-light: #eef1ff;
$accent-green: #3dd598;
$accent-red: #ff6b6b;
$accent-orange: #ff9f43;
$accent-blue: #4f7cff;
$ease-out: cubic-bezier(0.16, 1, 0.3, 1);

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.order-card {
 margin-bottom: 16rpx;
 background: $bg-surface;
 border-radius: 20rpx;
  border-left: 6rpx solid transparent;
  box-shadow: 0 2rpx 16rpx rgba(26, 29, 41, 0.06);
  transition: all 0.2s $ease-out;
  animation: slideUp 0.35s $ease-out both;

  /* 用 nth-child 代替内联 animationDelay */
  @for $i from 0 through 19 {
    &:nth-child(#{$i + 1}) {
      animation-delay: #{$i * 0.05}s;
    }
  }

  &:active {
    transform: scale(0.985);
    box-shadow: 0 2rpx 12rpx rgba(79, 124, 255, 0.1);
  }
}

.order-main { padding: 24rpx; }

.order-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.order-header__left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-main;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  align-self: flex-start;
}

.status-tag__dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-tag__text {
  font-size: 22rpx;
  font-weight: 500;
  color: $text-hint;
}

.amount-value {
  color: #e8453c;
  font-weight: 700;
  font-size: 32rpx;
  flex-shrink: 0;
  letter-spacing: -0.5rpx;
}

.order-card.status-1 .status-tag__dot { background: $accent-green; }
.order-card.status-2 .status-tag__dot { background: $accent-red; }
.order-card.status-3 .status-tag__dot { background: $accent-orange; }
.order-card.status-4 .status-tag__dot { background: $accent-blue; }

/* Left border accent per status */
.order-card.status-1 { border-left-color: $accent-green; }
.order-card.status-2 { border-left-color: $accent-red; }
.order-card.status-3 { border-left-color: $accent-orange; }
.order-card.status-4 { border-left-color: $accent-blue; }

.order-subheader {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 10rpx;
}

.customer-phone { font-size: 24rpx; color: $text-hint; }

.business-node {
  font-size: 22rpx;
  font-weight: 500;
  color: $primary;
  background: $primary-light;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 16rpx;
  min-width: 0;
}

.plate-number {
  flex-shrink: 0;
  padding: 4rpx 12rpx;
  background: $text-main;
  border-radius: 6rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 1rpx;
}

.product-text,
.vehicle-text {
  overflow: hidden;
  font-size: 24rpx;
  color: $text-body;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f4f5f9;
}

.order-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}
</style>
