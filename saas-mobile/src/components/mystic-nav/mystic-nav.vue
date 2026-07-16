<template>
  <view class="mystic-nav" :class="{ transparent }">
    <view class="nav-safe" />
    <view class="nav-row">
      <view class="nav-side nav-back" hover-class="tap-active" role="button" aria-label="返回" @tap="goBack">
        <text class="back-arrow">‹</text>
      </view>
      <text class="nav-title">{{ title }}</text>
      <view class="nav-side nav-action" hover-class="tap-active" role="button" @tap="$emit('action')">
        <text v-if="actionText">{{ actionText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string; actionText?: string; transparent?: boolean }>(), {
  actionText: '',
  transparent: false
})
defineEmits<{ action: [] }>()

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
    return
  }
  uni.reLaunch({ url: '/pages/mingli/index' })
}
</script>

<style scoped>
.mystic-nav { position: relative; z-index: 30; color: #f5e7c8; background: linear-gradient(180deg, rgba(28, 20, 14, .98) 0%, rgba(28, 20, 14, .92) 100%); }
.mystic-nav.transparent { background: transparent; }
.nav-safe { height: var(--status-bar-height); }
.nav-row { height: 88rpx; display: flex; align-items: center; justify-content: space-between; padding: 8rpx 24rpx; }
.nav-side { width: 140rpx; height: 72rpx; display: flex; align-items: center; }
.nav-back { justify-content: flex-start; }
.back-arrow { width: 62rpx; height: 62rpx; line-height: 56rpx; text-align: center; border: 1rpx solid rgba(215, 179, 107, .34); border-radius: 50%; font-size: 54rpx; background: linear-gradient(180deg, rgba(52, 33, 20, .94) 0%, rgba(34, 22, 14, .82) 100%); box-shadow: inset 0 1rpx 0 rgba(255,255,255,.08), 0 8rpx 18rpx rgba(0,0,0,.22); }
.nav-title { font-family: STKaiti, KaiTi, serif; font-size: 32rpx; letter-spacing: 5rpx; font-weight: 600; }
.nav-action { justify-content: flex-end; color: #d9b56b; font-size: 25rpx; letter-spacing: 2rpx; }

.tap-active { transform: scale(0.98); opacity: 0.92; }
</style>
