<template>
  <transition name="fade">
    <view v-if="visible" class="global-loading-wrapper">
      <!-- 锁定操作遮罩 -->
      <view v-if="locked" class="global-loading-lock" @touchmove.stop.prevent></view>
      <view class="global-loading-card">
        <u-loading mode="circle" :show="true" :color="themeColor" :size="36" />
        <text class="global-loading-text">加载中...</text>
      </view>
    </view>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGlobalLoading } from '@/composables/useGlobalLoading'

const { visible, locked } = useGlobalLoading()

const themeColor = computed(() => {
  if (typeof document !== 'undefined') {
    return (
      getComputedStyle(document.documentElement).getPropertyValue(
        '--u-type-primary',
      ).trim() || '#5240FE'
    )
  }
  return '#5240FE'
})
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

.global-loading-lock {
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
  height: 220rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 28rpx;
  box-shadow:
    0 24rpx 64rpx rgba(0, 0, 0, 0.12),
    0 4rpx 16rpx rgba(0, 0, 0, 0.06),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
  gap: 24rpx;
}

.global-loading-text {
  font-size: 26rpx;
  color: #6b7280;
  font-weight: 500;
  letter-spacing: 1rpx;
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
