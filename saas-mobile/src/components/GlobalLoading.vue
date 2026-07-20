<template>
  <transition name="fade">
    <view v-if="visible" class="global-loading-overlay" @touchmove.stop.prevent>
      <view class="global-loading-card">
        <!-- 旋转圆环 -->
        <view class="spinner-ring">
          <view class="spinner-ring__arc" />
          <view class="spinner-ring__dot" />
        </view>
        <text class="global-loading-text">加载中...</text>
      </view>
    </view>
  </transition>
</template>

<script setup lang="ts">
import { useGlobalLoading } from '@/composables/useGlobalLoading'

const { visible } = useGlobalLoading()
</script>

<style scoped lang="scss">
/* ================== 遮罩层 ================== */
.global-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(6rpx);
  -webkit-backdrop-filter: blur(6rpx);
}

/* ================== 卡片 ================== */
.global-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 220rpx;
  height: 220rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  box-shadow:
    0 24rpx 64rpx rgba(0, 0, 0, 0.12),
    0 4rpx 16rpx rgba(0, 0, 0, 0.06),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
  gap: 24rpx;
}

/* ================== 旋转圆环 ================== */
.spinner-ring {
  position: relative;
  width: 72rpx;
  height: 72rpx;
}

/* 灰色底环 */
.spinner-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 5rpx solid rgba(0, 0, 0, 0.06);
}

/* 渐变弧线 — 旋转动画 */
.spinner-ring__arc {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 5rpx solid transparent;
  border-top-color: #4f7cff;
  border-right-color: #6366f1;
  animation: spin 0.8s linear infinite;
}

/* 顶部高光点 */
.spinner-ring__dot {
  position: absolute;
  top: 4rpx;
  right: 8rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4f7cff, #6366f1);
  box-shadow: 0 0 12rpx rgba(79, 124, 255, 0.4);
}

/* ================== 文字 ================== */
.global-loading-text {
  font-size: 26rpx;
  color: #6b7280;
  font-weight: 500;
  letter-spacing: 1rpx;
}

/* ================== 动画 ================== */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
