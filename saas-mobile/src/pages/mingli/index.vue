<template>
  <view class="mingli-page">
    <!-- 顶部标题 -->
    <view class="header">
      <text class="title">命理</text>
      <text class="subtitle">八字看命 · 六爻看事</text>
    </view>

    <!-- 功能入口 -->
    <view class="menu-grid">
      <view class="menu-item bazi" @click="goBazi">
        <view class="icon">☰</view>
        <text class="name">八字排盘</text>
        <text class="desc">看一生运势</text>
      </view>
      <view class="menu-item liuyao" @click="goLiuyao">
        <view class="icon">☯</view>
        <text class="name">六爻摇卦</text>
        <text class="desc">看具体事情</text>
      </view>
    </view>

    <!-- 历史记录入口 -->
    <view class="history-entry" @click="goHistory">
      <text>历史记录</text>
      <text class="arrow">›</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { APP_ROUTES } from '@/common/navigation'

const goBazi = () => {
  uni.navigateTo({ url: APP_ROUTES.mingli.bazi.input })
}

const goLiuyao = () => {
  uni.navigateTo({ url: APP_ROUTES.mingli.liuyao.shake })
}

const goHistory = () => {
  uni.navigateTo({ url: APP_ROUTES.mingli.history })
}
</script>

<style scoped>
.mingli-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 0 32rpx;
}

.header {
  padding: 120rpx 0 60rpx;
  text-align: center;
}

.title {
  display: block;
  font-size: 64rpx;
  color: #e6b422;
  font-weight: bold;
  letter-spacing: 16rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: rgba(230, 180, 34, 0.6);
  margin-top: 16rpx;
}

.menu-grid {
  display: flex;
  gap: 24rpx;
  margin-top: 40rpx;
}

.menu-item {
  flex: 1;
  padding: 48rpx 24rpx;
  border-radius: 24rpx;
  text-align: center;
  border: 2rpx solid rgba(230, 180, 34, 0.3);
  background: rgba(230, 180, 34, 0.05);
}

.menu-item.bazi { border-color: rgba(255, 69, 0, 0.4); }
.menu-item.liuyao { border-color: rgba(30, 144, 255, 0.4); }

.icon {
  font-size: 72rpx;
  margin-bottom: 16rpx;
}

.name {
  display: block;
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 8rpx;
}

.history-entry {
  margin-top: 48rpx;
  padding: 24rpx 32rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 28rpx;
}

.arrow {
  color: rgba(255, 255, 255, 0.3);
  font-size: 36rpx;
}
</style>
