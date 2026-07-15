<template>
  <view class="mystic-nav" :class="{ transparent }">
    <view class="nav-safe" />
    <view class="nav-row">
      <view class="nav-side nav-back" role="button" aria-label="返回" @click="goBack">
        <text class="back-arrow">‹</text>
      </view>
      <text class="nav-title">{{ title }}</text>
      <view class="nav-side nav-action" role="button" @click="$emit('action')">
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
.mystic-nav { position: relative; z-index: 30; color: #f7e9bf; background: #0b1730; }
.mystic-nav.transparent { background: transparent; }
.nav-safe { height: var(--status-bar-height); }
.nav-row { height: 88rpx; display: flex; align-items: center; justify-content: space-between; padding: 0 24rpx; }
.nav-side { width: 140rpx; height: 72rpx; display: flex; align-items: center; }
.nav-back { justify-content: flex-start; }
.back-arrow { width: 62rpx; height: 62rpx; line-height: 56rpx; text-align: center; border: 1rpx solid rgba(231, 195, 112, .36); border-radius: 50%; font-size: 54rpx; background: rgba(8, 20, 43, .45); }
.nav-title { font-family: STKaiti, KaiTi, serif; font-size: 32rpx; letter-spacing: 5rpx; font-weight: 600; }
.nav-action { justify-content: flex-end; color: #d9b85f; font-size: 25rpx; }
</style>
