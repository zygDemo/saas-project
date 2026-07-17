<template>
  <view
    v-if="visible"
    class="update-notice"
    :style="{ zIndex }"
  >
    <view class="update-notice__card">
      <view class="update-notice__header">
        <view class="update-notice__icon">
          <text class="update-notice__icon-text">↑</text>
        </view>
        <text class="update-notice__title">系统更新</text>
        <text class="update-notice__close" @click="handleDismiss">×</text>
      </view>

      <view class="update-notice__body">
        <text class="update-notice__description">
          为了您更好的体验，我们升级了系统，请您刷新页面体验最新版本！
        </text>
        <text v-if="versionInfo.buildTime" class="update-notice__build-time">
          发布时间：{{ formatBuildTime(versionInfo.buildTime) }}
        </text>
      </view>

      <view class="update-notice__actions">
        <view class="update-notice__btn update-notice__btn--text" @click="handleDismiss">
          <text>忽略</text>
        </view>
        <view class="update-notice__btn update-notice__btn--primary" @click="handleRefresh">
          <text>刷新</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { VersionInfo } from '@/common/update-notice'
import { onBeforeUnmount, ref } from 'vue'

withDefaults(defineProps<{
  /** 层级 */
  zIndex?: number
}>(), {
  zIndex: 10080,
})

const visible = ref(false)
const versionInfo = ref<VersionInfo>({})
let currentHash = ''

/**
 * 显示更新通知
 */
function show(info: VersionInfo) {
  versionInfo.value = info
  currentHash = info.hash || info.version || ''
  visible.value = true
}

/**
 * 隐藏更新通知
 */
function hide() {
  visible.value = false
}

/**
 * 忽略更新
 */
function handleDismiss() {
  if (currentHash) {
    uni.setStorageSync('sys-update-notice-dismissed-hash', currentHash)
  }
  hide()
}

/**
 * 刷新页面
 */
function handleRefresh() {
  hide()
  // #ifdef H5
  window.location.reload()
  // #endif

  // #ifndef H5
  // 小程序/App 环境提示用户手动重启
  uni.showToast({
    title: '请重启应用以更新',
    icon: 'none',
    duration: 2000,
  })
  // #endif
}

/**
 * 格式化构建时间
 */
function formatBuildTime(buildTime: string): string {
  try {
    const date = new Date(buildTime)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}`
  }
  catch {
    return buildTime
  }
}

onBeforeUnmount(() => {
  hide()
})

defineExpose({ show, hide, formatBuildTime })
</script>

<style lang="scss" scoped>
.update-notice {
  position: fixed;
  right: 24rpx;
  bottom: calc(40rpx + env(safe-area-inset-bottom));
  width: 560rpx;
  max-width: calc(100vw - 48rpx);

  &__card {
    background: #ffffff;
    border-radius: 16rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    padding: 24rpx 28rpx 16rpx;
    position: relative;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #4f7cff, #6b9bff);
    margin-right: 16rpx;
    flex-shrink: 0;

    &-text {
      color: #ffffff;
      font-size: 28rpx;
      font-weight: bold;
    }
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: #1a1a1a;
    flex: 1;
  }

  &__close {
    font-size: 40rpx;
    color: #999999;
    line-height: 1;
    padding: 0 8rpx;
    flex-shrink: 0;
  }

  &__body {
    padding: 0 28rpx 20rpx;
  }

  &__description {
    display: block;
    font-size: 26rpx;
    color: #666666;
    line-height: 1.6;
  }

  &__build-time {
    display: block;
    margin-top: 8rpx;
    font-size: 22rpx;
    color: #aaaaaa;
  }

  &__actions {
    display: flex;
    border-top: 1rpx solid #f0f0f0;
  }

  &__btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx 0;
    font-size: 28rpx;
    transition: background 0.2s;

    &--text {
      color: #999999;
      border-right: 1rpx solid #f0f0f0;

      &:active {
        background: #f9f9f9;
      }
    }

    &--primary {
      color: #4f7cff;
      font-weight: 600;

      &:active {
        background: #f0f5ff;
      }
    }
  }
}

/* 动画 */
.update-notice {
  animation: update-notice-slide-in 0.3s ease-out;
}

@keyframes update-notice-slide-in {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
