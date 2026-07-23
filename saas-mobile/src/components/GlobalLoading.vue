<template>
  <transition name="fade">
    <view
      v-if="visible"
      class="global-loading-wrapper"
      :class="'global-loading-wrapper--' + toastPosition"
    >
      <!-- 卡片区域局部遮罩 -->
      <view v-if="locked" class="global-loading-card-lock" @touchmove.stop.prevent></view>
      <view class="global-loading-card">
        <!-- 加载中 -->
        <u-loading
          v-if="toastType === 'loading'"
          mode="circle"
          :show="true"
          :color="themeColor"
          :size="36"
        />
        <!-- 成功 -->
        <view v-else-if="toastType === 'success'" class="toast-icon toast-icon--success">
          <text class="toast-icon__symbol">✓</text>
        </view>
        <!-- 失败 -->
        <view v-else-if="toastType === 'fail'" class="toast-icon toast-icon--fail">
          <text class="toast-icon__symbol">✕</text>
        </view>
        <!-- 确认框 -->
        <view v-else-if="toastType === 'confirm'" class="confirm-body">
          <text class="confirm-title">{{ text || '提示' }}</text>
          <view class="confirm-actions">
            <view class="confirm-btn confirm-btn--cancel" @click="handleCancel">{{ cancelText || '取消' }}</view>
            <view
              class="confirm-btn"
              :class="[confirmDanger ? 'confirm-btn--danger' : 'confirm-btn--primary']"
              @click="handleConfirm"
            >{{ confirmText || '确认' }}</view>
          </view>
        </view>
        <!-- 纯文字 -->
        <text v-else class="global-loading-text">{{ text || '提示' }}</text>
      </view>
    </view>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalLoading } from '@/composables/useGlobalLoading'

const {
  visible,
  locked,
  text,
  toastType,
  toastPosition,
  confirmText,
  cancelText,
  confirmDanger,
  triggerConfirm,
  triggerCancel,
} = useGlobalLoading()

const themeColor = computed(() => {
  try {
    if (typeof document !== 'undefined') {
      return (
        getComputedStyle(document.documentElement).getPropertyValue(
          '--u-type-primary',
        ).trim() || '#5240FE'
      )
    }
  } catch {
    // ignore
  }
  return '#5240FE'
})

function handleConfirm() {
  triggerConfirm()
}
function handleCancel() {
  triggerCancel()
}
</script>

<style scoped lang="scss">
.global-loading-wrapper {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.global-loading-wrapper--top {
  align-items: flex-start;
  padding-top: 160rpx;
}

.global-loading-wrapper--middle {
  align-items: center;
}

.global-loading-wrapper--bottom {
  align-items: flex-end;
  padding-bottom: 160rpx;
}

.global-loading-card-lock {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(6rpx);
  -webkit-backdrop-filter: blur(6rpx);
}

.global-loading-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 220rpx;
  min-height: 120rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  box-shadow:
    0 24rpx 64rpx rgba(0, 0, 0, 0.12),
    0 4rpx 16rpx rgba(0, 0, 0, 0.06),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
  gap: 24rpx;
  padding: 24rpx 32rpx;
}

.global-loading-text {
  font-size: 26rpx;
  color: #6b7280;
  font-weight: 500;
  letter-spacing: 1rpx;
}

.toast-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-icon__symbol {
  font-size: 40rpx;
  font-weight: 700;
  color: #ffffff;
}

.toast-icon--success {
  background: #2ED573;
  box-shadow: 0 12rpx 24rpx rgba(46, 213, 115, 0.35);
}

.toast-icon--fail {
  background: #FF4757;
  box-shadow: 0 12rpx 24rpx rgba(255, 71, 87, 0.35);
}

.confirm-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.confirm-title {
  font-size: 28rpx;
  color: #1f2937;
  font-weight: 500;
  text-align: center;
}

.confirm-actions {
  display: flex;
  gap: 16rpx;
}

.confirm-btn {
  min-width: 120rpx;
  height: 64rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #4b5563;
}

.confirm-btn--primary {
  background: #5240fe;
  color: #ffffff;
}

.confirm-btn--danger {
  background: #ff4d4f;
  color: #ffffff;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
