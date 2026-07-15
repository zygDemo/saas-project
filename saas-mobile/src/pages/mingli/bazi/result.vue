<template>
  <view class="bazi-result-page">
    <!-- 四柱展示 -->
    <view class="sizhu-section">
      <view class="sizhu-header">
        <text class="label">年柱</text>
        <text class="label">月柱</text>
        <text class="label">日柱</text>
        <text class="label">时柱</text>
      </view>
      <view class="sizhu-gan">
        <view class="gan" v-for="(zhu, i) in zhuList" :key="i" :style="{ color: wuxingColor[zhu.ganWuXing] }">
          {{ zhu.gan }}
        </view>
      </view>
      <view class="sizhu-zhi">
        <view class="zhi" v-for="(zhu, i) in zhuList" :key="i" :style="{ color: wuxingColor[zhu.zhiWuXing] }">
          {{ zhu.zhi }}
        </view>
      </view>
      <view class="sizhu-shishen">
        <view class="shishen" v-for="(zhu, i) in zhuList" :key="i">{{ zhu.shiShen }}</view>
      </view>
      <view class="sizhu-nayin">
        <view class="nayin" v-for="(zhu, i) in zhuList" :key="i">{{ zhu.naYin }}</view>
      </view>
    </view>

    <!-- 五行统计 -->
    <view class="wuxing-section">
      <text class="section-title">五行分布</text>
      <view class="wuxing-bars">
        <view class="wuxing-item" v-for="(count, name) in result?.wuXingCount" :key="name">
          <text class="wuxing-name" :style="{ color: wuxingColor[name] }">{{ name }}</text>
          <view class="wuxing-bar">
            <view class="wuxing-fill" :style="{ width: count * 25 + '%', background: wuxingColor[name] }"></view>
          </view>
          <text class="wuxing-count">{{ count }}</text>
        </view>
      </view>
    </view>

    <!-- 大运 -->
    <view class="dayun-section">
      <text class="section-title">大运</text>
      <scroll-view scroll-x class="dayun-scroll">
        <view class="dayun-list">
          <view class="dayun-item" v-for="(dy, i) in result?.daYun" :key="i">
            <text class="dayun-age">{{ dy.startAge }}岁</text>
            <text class="dayun-gan" :style="{ color: wuxingColor[dy.ganWuXing] }">{{ dy.gan }}</text>
            <text class="dayun-zhi" :style="{ color: wuxingColor[dy.zhiWuXing] }">{{ dy.zhi }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { paiPan, WUXING_COLOR, type BaZiResult, type Zhu } from '@/common/mingli/bazi'

const result = ref<BaZiResult | null>(null)
const wuxingColor = WUXING_COLOR

const zhuList = computed<Zhu[]>(() => {
  if (!result.value) return []
  const { siZhu } = result.value
  return [siZhu.year, siZhu.month, siZhu.day, siZhu.hour]
})

onMounted(() => {
  // 从本地存储读取参数
  const params = uni.getStorageSync('bazi_params')
  console.log('八字参数:', params)

  if (params && params.year) {
    result.value = paiPan(
      Number(params.year), Number(params.month), Number(params.day),
      Number(params.hour), params.gender === 'female' ? 'female' : 'male'
    )
    console.log('排盘结果:', result.value)
    // 清除参数
    uni.removeStorageSync('bazi_params')
  }
})
</script>

<style scoped>
.bazi-result-page {
  min-height: 100vh;
  background: #0f1923;
  padding: 24rpx;
}

.sizhu-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.sizhu-header {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24rpx;
}

.label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 24rpx;
}

.sizhu-gan, .sizhu-zhi, .sizhu-shishen, .sizhu-nayin {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16rpx;
}

.gan, .zhi {
  font-size: 48rpx;
  font-weight: bold;
  width: 120rpx;
  text-align: center;
}

.shishen, .nayin {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  width: 120rpx;
  text-align: center;
}

.section-title {
  display: block;
  font-size: 28rpx;
  color: #e6b422;
  margin-bottom: 24rpx;
}

.wuxing-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.wuxing-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.wuxing-name {
  width: 48rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.wuxing-bar {
  flex: 1;
  height: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  margin: 0 16rpx;
  overflow: hidden;
}

.wuxing-fill {
  height: 100%;
  border-radius: 12rpx;
  transition: width 0.5s ease;
}

.wuxing-count {
  width: 32rpx;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
}

.dayun-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 32rpx;
}

.dayun-scroll {
  white-space: nowrap;
}

.dayun-list {
  display: inline-flex;
  gap: 24rpx;
}

.dayun-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80rpx;
}

.dayun-age {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8rpx;
}

.dayun-gan, .dayun-zhi {
  font-size: 32rpx;
  font-weight: bold;
}
</style>
