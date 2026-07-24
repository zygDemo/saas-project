<template>
  <view
    class="list-card"
    :class="statusClass ? `status-${statusClass}` : ''"
    :style="{ animationDelay: `${index * 0.06}s` }"
    @click="handleClick"
  >
    <view v-if="statusBadge" class="status-badge">
      <text class="status-text">{{ statusBadge }}</text>
    </view>

    <view class="list-header">
      <view class="header-left">
        <view
          class="avatar"
          :class="avatarClass ? `avatar--${avatarClass}` : ''"
        >
          {{ avatarText }}
        </view>
        <view class="title-block">
          <text class="name">{{ item.name || `客户${index + 1}` }}</text>
          <text class="sub-info">{{ item.phone || '-' }}</text>
        </view>
      </view>
    </view>

    <view class="list-body">
      <slot name="body" :item="item"></slot>
    </view>

    <view class="list-footer">
      <view class="footer-left">
        <slot name="left" :item="item"></slot>
      </view>
      <view class="footer-actions">
        <slot name="actions" :item="item"></slot>
        <view v-if="!$slots.default" class="footer-right">
          <slot></slot>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

type ListCardItem = Record<string, any>;

const props = defineProps<{
  item: ListCardItem;
  index: number;
  statusClass?: string;
  avatarClass?: string;
  statusBadge?: string;
}>();

const emit = defineEmits<{
  (e: "click", item: ListCardItem): void;
}>();

const avatarText = computed(() => {
  const name = props.item.name
  return typeof name === "string" && name.length > 0 ? name.charAt(0) : "?"
});

const handleClick = () => {
  emit("click", props.item);
};
</script>

<style lang="scss" scoped>
.list-card {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  padding: 0;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04), 0 8rpx 24rpx rgba(0, 0, 0, 0.03), 0 0 0 1rpx rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  animation: slideUp 0.5s ease-out both;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6rpx;
    border-radius: 24rpx 0 0 24rpx;
    background: #cbd5e1;
    transition: all 0.3s ease;
  }

  &.status-warning::before {
    background: linear-gradient(180deg, #f59e0b, #fbbf24);
  }
  &.status-info::before {
    background: linear-gradient(180deg, var(--u-type-primary), #60a5fa);
  }
  &.status-success::before {
    background: linear-gradient(180deg, #10b981, #34d399);
  }
  &.status-error::before {
    background: linear-gradient(180deg, #ef4444, #f87171);
  }
  &.status-primary::before {
    background: linear-gradient(180deg, var(--u-type-primary), var(--u-type-primary));
  }

  &:active {
    transform: scale(0.985) translateY(2rpx);
    box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.05),
    0 4rpx 12rpx rgba(0, 0, 0, 0.03);
  }
}

.status-badge {
  position: absolute;
  top: 0;
  right: 0;
  padding: 8rpx 20rpx;
  border-radius: 0 24rpx 0 24rpx;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  z-index: 2;

  .status-text {
    font-size: 22rpx;
    font-weight: 600;
    color: #64748b;
  }
}

.list-card.status-warning .status-badge {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  .status-text {
    color: #b45309;
  }
}
.list-card.status-info .status-badge {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  .status-text {
    color: #1d4ed8;
  }
}
.list-card.status-success .status-badge {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  .status-text {
    color: #047857;
  }
}
.list-card.status-error .status-badge {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  .status-text {
    color: #b91c1c;
  }
}
.list-card.status-primary .status-badge {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  .status-text {
    color: #1e40af;
  }
}

.list-header {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx 16rpx 32rpx;
  border-bottom: 1rpx solid #f1f5f9;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
  position: relative;
  background: linear-gradient(135deg, #94a3b8, #cbd5e1);

  &::after {
    content: "";
    position: absolute;
    inset: -3rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(255, 255, 255, 0.5);
  }

  &--warning {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    box-shadow: 0 4rpx 16rpx rgba(245, 158, 11, 0.35);
  }
  &--info {
    background: linear-gradient(135deg, var(--u-type-primary), #60a5fa);
    box-shadow: 0 4rpx 16rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.35);
  }
  &--success {
    background: linear-gradient(135deg, #10b981, #34d399);
    box-shadow: 0 4rpx 16rpx rgba(16, 185, 129, 0.35);
  }
  &--error {
    background: linear-gradient(135deg, #ef4444, #f87171);
    box-shadow: 0 4rpx 16rpx rgba(239, 68, 68, 0.35);
  }
  &--primary {
    background: linear-gradient(135deg, var(--u-type-primary), var(--u-type-primary));
    box-shadow: 0 4rpx 16rpx rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.35);
  }
  &--default {
    background: linear-gradient(135deg, #94a3b8, #cbd5e1);
    box-shadow: 0 4rpx 16rpx rgba(148, 163, 184, 0.3);
  }
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5rpx;
  line-height: 1.3;
}

.sub-info {
  font-size: 24rpx;
  color: #94a3b8;
  font-weight: 500;
  font-family: "Helvetica Neue", sans-serif;
}

.list-body {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 12rpx 28rpx 12rpx 32rpx;
}

.list-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12rpx 28rpx 16rpx 32rpx;
  border-top: 1rpx solid #f1f5f9;
  margin-top: 4rpx;
}

.footer-left {
  display: flex;
  align-items: center;
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 24rpx;
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.08);
  transition: all 0.2s ease;

  &:active {
    background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.15);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
