<template>
  <view class="card" @click="$emit('detail', order)">
    <view class="card__header">
      <view class="card__customer">
        <view class="card__avatar">
          <text>{{ customerInitial }}</text>
        </view>
        <view class="card__name-wrap">
          <text class="card__name">{{ order.name || "未命名客户" }}</text>
          <view v-if="order.phone" class="card__phone">{{ order.phone }}</view>
        </view>
      </view>
      <view
        v-if="order.nodeStatusLabel"
        class="card__status"
        :class="`card__status--${order.statusClass}`"
      >
        {{ order.nodeStatusLabel }}
      </view>
    </view>

    <view class="card__body">
      <view class="card__row">
        <view class="card__field">
          <text class="card__label">订单编号</text>
          <text class="card__value">{{
            order.creditOrderId || order.orderNo || "-"
          }}</text>
        </view>
        <view class="card__field">
          <text class="card__label">申请金额</text>
          <text class="card__value card__value--primary">{{
            order.pushQuota || "-"
          }}</text>
        </view>
      </view>
      <view class="card__row">
        <view class="card__field">
          <text class="card__label">业务节点</text>
          <text class="card__value">{{ order.businessNodeLabel || "-" }}</text>
        </view>
        <view class="card__field">
          <text class="card__label">车辆信息</text>
          <text class="card__value">{{
            order.plateNumber || order.vehicleDisplay || "-"
          }}</text>
        </view>
      </view>
    </view>

    <view v-if="tags.length" class="card__tags">
      <text
        v-for="tag in tags"
        :key="tag.text"
        class="card__tag"
        :class="`card__tag--${tag.type}`"
      >
        {{ tag.text }}
      </text>
    </view>

    <view class="card__footer">
      <text class="card__time">{{ order.createTime || "" }}</text>
      <view class="card__actions">
        <text class="card__link" @click.stop="$emit('flow-record', order)">
          查看进展
        </text>
        <view class="card__btn" @click.stop="$emit('detail', order)">
          <text class="card__btn-text">详情</text>
        </view>
        <view
          v-if="canGoSign"
          class="card__btn card__btn--primary"
          @click.stop="$emit('sign', order)"
        >
          <text class="card__btn-text">签单</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { OrderListViewItem } from "../types";

const props = defineProps<{
  order: OrderListViewItem;
  canGoSign: boolean;
}>();

defineEmits<{
  (e: "detail", order: OrderListViewItem): void;
  (e: "sign", order: OrderListViewItem): void;
  (e: "flow-record", order: OrderListViewItem): void;
}>();

const customerInitial = computed(() => {
  const name = props.order.name?.trim();
  return name ? name.slice(0, 1) : "客";
});

const tags = computed(() => {
  const list: Array<{
    text: string;
    type: "primary" | "success" | "error" | "warning";
  }> = [];
  if (props.order.phaseName)
    list.push({ text: props.order.phaseName, type: "primary" });
  if (props.order.isSignContract === 1)
    list.push({ text: "已签约", type: "success" });
  if (props.order.isFaceRecognition === 2)
    list.push({ text: "已认证", type: "success" });
  if (props.order.isFaceRecognition === 3)
    list.push({ text: "认证失败", type: "error" });
  return list;
});
</script>

<style lang="scss" scoped>
$bg: #ffffff;
$border: #eef0f4;
$text-main: #1a1d29;
$text-body: #4e5566;
$text-hint: #9699a6;
$text-light: #b4b9c6;
$primary: #437cff;
$green: #3ecf8e;
$red: #f56c6c;
$orange: #ff9f43;
$purple: #6c63ff;

.card {
  position: relative;
  margin-bottom: 24rpx;
  padding: 28rpx 28rpx 0;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1rpx solid rgba(221, 228, 240, 0.9);
  border-radius: 24rpx;
  box-shadow: 0 12rpx 34rpx rgba(31, 45, 86, 0.08);
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 8rpx;
    height: 100%;
    background: linear-gradient(180deg, #4f7cff 0%, #41c6a8 100%);
  }

  &:active {
    transform: scale(0.99);
    box-shadow: 0 2rpx 12rpx rgba(26, 29, 41, 0.04);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20rpx;
  }

  &__customer {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 18rpx;
  }

  &__avatar {
    flex-shrink: 0;
    width: 72rpx;
    height: 72rpx;
    border-radius: 22rpx;
    background: linear-gradient(135deg, rgba($primary, 0.95), rgba(#41c6a8, 0.95));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10rpx 22rpx rgba(67, 124, 255, 0.22);

    text {
      font-size: 32rpx;
      font-weight: 800;
      color: #fff;
      line-height: 1;
    }
  }

  &__name-wrap {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-main;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__phone {
    margin-top: 6rpx;
    font-size: 24rpx;
    color: $text-hint;
    line-height: 1.4;
  }

  &__status {
    flex-shrink: 0;
    margin-top: 2rpx;
    padding: 8rpx 18rpx;
    border-radius: 999rpx;
    font-size: 22rpx;
    font-weight: 600;
    line-height: 1.4;

    &--1 {
      background: rgba($green, 0.1);
      color: $green;
    }
    &--2 {
      background: rgba($red, 0.1);
      color: $red;
    }
    &--3 {
      background: rgba($orange, 0.1);
      color: $orange;
    }
    &--4 {
      background: rgba($primary, 0.1);
      color: $primary;
    }
  }

  &__body {
    margin-top: 24rpx;
    padding: 22rpx;
    background: rgba(246, 249, 253, 0.9);
    border: 1rpx solid #eef2f7;
    border-radius: 18rpx;
  }

  &__row {
    display: flex;
    gap: 16rpx;

    & + & {
      margin-top: 18rpx;
    }
  }

  &__field {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  &__label {
    font-size: 22rpx;
    color: $text-light;
    line-height: 1.4;
    margin-bottom: 4rpx;
  }

  &__value {
    font-size: 26rpx;
    font-weight: 500;
    color: $text-body;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--primary {
      font-weight: 700;
      color: #2f68e8;
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    padding: 16rpx 0 0;
  }

  &__tag {
    padding: 6rpx 16rpx;
    border-radius: 999rpx;
    font-size: 20rpx;
    font-weight: 500;

    &--primary {
      color: $primary;
      background: rgba($primary, 0.08);
    }
    &--success {
      color: $green;
      background: rgba($green, 0.08);
    }
    &--error {
      color: $red;
      background: rgba($red, 0.08);
    }
    &--warning {
      color: $orange;
      background: rgba($orange, 0.08);
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16rpx;
    padding: 18rpx 0 20rpx;
    border-top: 1rpx solid $border;
    gap: 16rpx;
  }

  &__time {
    flex: 1;
    min-width: 0;
    font-size: 22rpx;
    color: $text-light;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__actions {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__link {
    font-size: 24rpx;
    color: $primary;
    font-weight: 500;
    &:active {
      opacity: 0.6;
    }
  }

  &__btn {
    min-width: 92rpx;
    height: 52rpx;
    padding: 0 22rpx;
    border-radius: 999rpx;
    border: 1rpx solid $border;
    background: $bg;
    display: flex;
    align-items: center;
    justify-content: center;

    &--primary {
      background: linear-gradient(135deg, #4f7cff, $purple);
      border-color: $primary;
      box-shadow: 0 8rpx 18rpx rgba(67, 124, 255, 0.24);
      .card__btn-text {
        color: #fff;
      }
    }

    &:active {
      opacity: 0.7;
    }
  }

  &__btn-text {
    font-size: 24rpx;
    font-weight: 500;
    color: $text-body;
  }
}
</style>
