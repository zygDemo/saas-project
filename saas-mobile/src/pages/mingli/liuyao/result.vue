<template>
  <view class="liuyao-result-page">
    <!-- 卦名 -->
    <view class="gua-header">
      <text class="gua-name">{{ result?.benGua?.fullName }}</text>
      <text class="gua-ci">{{ result?.benGua?.guaCi }}</text>
      <view class="bian-gua" v-if="result?.bianGua">
        <text class="bian-label">变卦：</text>
        <text class="bian-name">{{ result.bianGua.fullName }}</text>
      </view>
    </view>

    <!-- 卦象展示 -->
    <view class="yao-section">
      <!-- 六神 -->
      <view class="yao-row header-row">
        <text class="col-shen">六神</text>
        <text class="col-qin">六亲</text>
        <text class="col-gua">本卦</text>
        <text class="col-zhi">地支</text>
        <text class="col-bian">变卦</text>
      </view>

      <!-- 六爻（从上往下显示） -->
      <view class="yao-row" v-for="(yao, i) in reversedYaoList" :key="i"
            :class="{ shi: yao.position === result?.benGua?.shiYao, ying: yao.position === result?.benGua?.yingYao, dong: yao.isDong }">
        <text class="col-shen">{{ yao.liuShen }}</text>
        <text class="col-qin">{{ yao.liuQin }}</text>
        <view class="col-gua">
          <view class="yao-line" :class="{ yang: yao.yinYang === '阳', yin: yao.yinYang === '阴' }">
            <template v-if="yao.yinYang === '阳'">
              <view class="line solid"></view>
            </template>
            <template v-else>
              <view class="line broken"></view>
            </template>
          </view>
        </view>
        <text class="col-zhi">{{ yao.diZhi }}</text>
        <view class="col-bian">
          <view v-if="yao.bianYinYang" class="yao-line" :class="{ yang: yao.bianYinYang === '阳', yin: yao.bianYinYang === '阴' }">
            <template v-if="yao.bianYinYang === '阳'">
              <view class="line solid"></view>
            </template>
            <template v-else>
              <view class="line broken"></view>
            </template>
          </view>
          <text v-else class="no-bian">×</text>
        </view>
      </view>
    </view>

    <!-- 标记说明 -->
    <view class="legend">
      <view class="legend-item">
        <view class="marker shi-marker"></view>
        <text>世爻</text>
      </view>
      <view class="legend-item">
        <view class="marker ying-marker"></view>
        <text>应爻</text>
      </view>
      <view class="legend-item">
        <view class="marker dong-marker"></view>
        <text>动爻</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { liuYaoPaiPan, type LiuYaoResult } from '@/common/mingli/liuyao'

const result = ref<LiuYaoResult | null>(null)

const reversedYaoList = computed(() => {
  if (!result.value) return []
  return [...result.value.yaoList].reverse()
})

onMounted(() => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  const { values } = page.$page?.options || page.options || {}

  if (values) {
    result.value = liuYaoPaiPan('')
  }
})
</script>

<style scoped>
.liuyao-result-page {
  min-height: 100vh;
  background: #0f1923;
  padding: 24rpx;
}

.gua-header {
  text-align: center;
  padding: 32rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  margin-bottom: 24rpx;
}

.gua-name {
  display: block;
  font-size: 48rpx;
  color: #e6b422;
  font-weight: bold;
}

.gua-ci {
  display: block;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 12rpx;
}

.bian-gua {
  margin-top: 16rpx;
  display: flex;
  justify-content: center;
  gap: 8rpx;
}

.bian-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 24rpx;
}

.bian-name {
  color: #4fc3f7;
  font-size: 24rpx;
}

.yao-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24rpx;
  padding: 24rpx;
}

.yao-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

.yao-row.header-row {
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
  padding-bottom: 16rpx;
  margin-bottom: 8rpx;
}

.yao-row.shi { background: rgba(230, 180, 34, 0.1); }
.yao-row.ying { background: rgba(79, 195, 247, 0.1); }
.yao-row.dong { border-left: 4rpx solid #e6b422; }

.col-shen { width: 100rpx; font-size: 24rpx; color: rgba(255, 255, 255, 0.6); }
.col-qin { width: 80rpx; font-size: 24rpx; color: #e6b422; }
.col-gua { width: 120rpx; display: flex; justify-content: center; }
.col-zhi { width: 60rpx; text-align: center; font-size: 28rpx; color: #fff; }
.col-bian { width: 120rpx; display: flex; justify-content: center; }

.yao-line {
  width: 80rpx;
  height: 12rpx;
}

.line {
  width: 100%;
  height: 100%;
}

.line.solid {
  background: #e6b422;
}

.line.broken {
  background: transparent;
  position: relative;
}

.line.broken::before,
.line.broken::after {
  content: '';
  position: absolute;
  top: 0;
  height: 100%;
  width: 45%;
  background: #e6b422;
}

.line.broken::before { left: 0; }
.line.broken::after { right: 0; }

.no-bian {
  color: rgba(255, 255, 255, 0.1);
  font-size: 24rpx;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 32rpx;
  margin-top: 24rpx;
  padding: 16rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.marker {
  width: 24rpx;
  height: 24rpx;
  border-radius: 4rpx;
}

.shi-marker { background: rgba(230, 180, 34, 0.3); }
.ying-marker { background: rgba(79, 195, 247, 0.3); }
.dong-marker { background: #e6b422; }
</style>
