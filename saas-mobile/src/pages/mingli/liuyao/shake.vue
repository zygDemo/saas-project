<template>
  <view class="shake-page">
    <!-- 进度提示 -->
    <view class="progress">
      <text class="progress-text">{{ currentStep }}/6</text>
      <text class="progress-desc">{{ stepDesc }}</text>
    </view>

    <!-- 已摇爻展示 -->
    <view class="yao-display">
      <view class="yao-row" v-for="(yao, i) in yaoList" :key="i">
        <view class="yao-line" :class="{ yang: yao === 7 || yao === 9, yin: yao === 6 || yao === 8, dong: yao === 6 || yao === 9 }">
          <template v-if="yao === 7 || yao === 9">
            <view class="line solid"></view>
          </template>
          <template v-else>
            <view class="line broken"></view>
          </template>
        </view>
      </view>
    </view>

    <!-- 铜钱区域 -->
    <view class="coin-area" :class="{ shaking: isShaking }">
      <view class="coin" v-for="i in 3" :key="i">
        <view class="coin-face">{{ coinFaces[i-1] }}</view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <button class="shake-btn" @click="shake" :disabled="isShaking || currentStep >= 6">
      {{ currentStep >= 6 ? '查看结果' : '摇卦' }}
    </button>

    <!-- 重新开始 -->
    <view class="restart" v-if="currentStep >= 6" @click="restart">重新摇卦</view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { yaoGua, getYinYang, isDongYao } from '@/common/mingli/liuyao'
import { APP_ROUTES } from '@/common/navigation'

const currentStep = ref(0)
const yaoList = ref<number[]>([])
const isShaking = ref(false)
const coinFaces = ref(['字', '花', '字'])

const stepDesc = computed(() => {
  if (currentStep.value === 0) return '请心中默念所问之事'
  if (currentStep.value < 6) return '请继续摇卦'
  return '摇卦完成'
})

const shake = async () => {
  if (currentStep.value >= 6) {
    // 跳转结果页
    uni.navigateTo({
      url: `${APP_ROUTES.mingli.liuyao.result}?values=${yaoList.value.join(',')}`
    })
    return
  }

  isShaking.value = true

  // 模拟铜钱动画
  for (let i = 0; i < 10; i++) {
    coinFaces.value = [
      Math.random() > 0.5 ? '字' : '花',
      Math.random() > 0.5 ? '字' : '花',
      Math.random() > 0.5 ? '字' : '花'
    ]
    await new Promise(r => setTimeout(r, 100))
  }

  // 生成爻值
  const values = yaoGua()
  const newValue = values[currentStep.value]
  yaoList.value.push(newValue)
  currentStep.value++

  isShaking.value = false
}

const restart = () => {
  currentStep.value = 0
  yaoList.value = []
}
</script>

<style scoped>
.shake-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0f1923 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 32rpx;
}

.progress {
  text-align: center;
  margin-bottom: 48rpx;
}

.progress-text {
  display: block;
  font-size: 48rpx;
  color: #e6b422;
  font-weight: bold;
}

.progress-desc {
  display: block;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8rpx;
}

.yao-display {
  margin-bottom: 64rpx;
  min-height: 300rpx;
}

.yao-row {
  margin-bottom: 16rpx;
  display: flex;
  justify-content: center;
}

.yao-line {
  width: 200rpx;
  height: 20rpx;
  position: relative;
}

.line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
}

.line.solid {
  background: #e6b422;
}

.line.broken {
  background: transparent;
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

.yao-line.dong .line {
  animation: dongYao 0.5s ease-in-out infinite alternate;
}

@keyframes dongYao {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

.coin-area {
  display: flex;
  gap: 32rpx;
  margin-bottom: 64rpx;
}

.coin-area.shaking {
  animation: shakeAnim 0.1s ease-in-out infinite;
}

@keyframes shakeAnim {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10rpx) rotate(-5deg); }
  75% { transform: translateX(10rpx) rotate(5deg); }
}

.coin {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #d4a017 0%, #e6b422 50%, #d4a017 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #b8860b;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.5);
}

.coin-face {
  font-size: 36rpx;
  font-weight: bold;
  color: #1a1a2e;
}

.shake-btn {
  width: 400rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #e6b422 0%, #d4a017 100%);
  color: #1a1a2e;
  font-size: 36rpx;
  font-weight: bold;
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shake-btn[disabled] {
  opacity: 0.5;
}

.restart {
  margin-top: 32rpx;
  color: rgba(255, 255, 255, 0.4);
  font-size: 28rpx;
}
</style>
