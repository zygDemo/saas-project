<template>
  <view class="history-page">
    <view class="empty" v-if="records.length === 0">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无记录</text>
    </view>

    <view class="record-list" v-else>
      <view class="record-item" v-for="(item, index) in records" :key="index" @click="viewDetail(item)">
        <view class="record-type" :class="item.type">
          {{ item.type === 'bazi' ? '八字' : '六爻' }}
        </view>
        <view class="record-info">
          <text class="record-title">{{ item.title }}</text>
          <text class="record-time">{{ item.time }}</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Record {
  type: 'bazi' | 'liuyao'
  title: string
  time: string
  data: any
}

const records = ref<Record[]>([])

onMounted(() => {
  // 从本地存储加载历史记录
  const stored = uni.getStorageSync('mingli_history')
  if (stored) {
    records.value = JSON.parse(stored)
  }
})

const viewDetail = (item: Record) => {
  // TODO: 查看详情
  uni.showToast({ title: '查看详情', icon: 'none' })
}
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background: #0f1923;
  padding: 24rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  color: rgba(255, 255, 255, 0.3);
  font-size: 28rpx;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.record-type {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #fff;
  margin-right: 24rpx;
}

.record-type.bazi { background: #e65100; }
.record-type.liuyao { background: #1565c0; }

.record-info {
  flex: 1;
}

.record-title {
  display: block;
  font-size: 28rpx;
  color: #fff;
}

.record-time {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8rpx;
}

.arrow {
  color: rgba(255, 255, 255, 0.3);
  font-size: 36rpx;
}
</style>
