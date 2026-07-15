<template>
  <view class="page">
    <view class="sky-stage">
      <mystic-sky />
      <mystic-nav title="六爻问事" transparent />
      <view class="stage-copy">
        <text class="eyebrow">SIX LINES DIVINATION</text>
        <text class="stage-title">一念一问 · 六掷成卦</text>
        <text class="stage-desc">静心默念所问之事，再轻触铜钱</text>
      </view>
      <view class="moon-ring"><text>☯</text></view>
    </view>

    <view class="paper-body">
      <view v-if="currentStep === 0" class="question-card">
        <text class="question-label">所问之事</text>
        <input v-model="question" :maxlength="36" class="question-input" placeholder="例如：这次合作后续发展如何？" placeholder-class="placeholder" />
        <text class="question-count">{{ question.length }}/36</text>
      </view>

      <view class="progress-card">
        <view class="progress-copy"><text>起卦进度</text><text>{{ currentStep }}/6</text></view>
        <view class="progress-track"><view class="progress-fill" :style="{ width: `${currentStep / 6 * 100}%` }"><view class="progress-light" /></view></view>
        <text class="step-desc">{{ stepDesc }}</text>
      </view>

      <view class="yao-card">
        <view class="yao-labels"><text>上爻</text><text>初爻</text></view>
        <view class="yao-list">
          <view v-for="position in 6" :key="position" class="yao-slot" :class="{ formed: yaoAt(position), dong: isMoving(position) }">
            <text class="yao-position">{{ yaoNames[6 - position] }}</text>
            <view v-if="yaoAt(position)" class="yao-line" :class="{ broken: isYin(position) }" />
            <view v-else class="yao-empty"><text>·</text></view>
            <text class="yao-state">{{ yaoState(position) }}</text>
          </view>
        </view>
      </view>

      <view class="coin-stage" :class="{ shaking: isShaking }">
        <view v-for="(face, index) in coinFaces" :key="index" class="coin" :class="`coin-${index + 1}`">
          <view class="coin-inner"><view class="coin-hole" /><text>{{ face.label }}</text><view class="coin-pattern">乾元</view></view>
        </view>
        <view class="coin-shadow" />
      </view>

      <button class="divine-btn" :disabled="isShaking" @click="handleMainAction">
        <text class="btn-star">✦</text><text>{{ buttonText }}</text><text class="btn-star">✦</text>
      </button>
      <view class="action-row">
        <text v-if="currentStep > 0" @click="restart">重新起卦</text>
        <text v-if="currentStep === 0">铜钱正面为三，背面为二</text>
      </view>
      <view class="ritual-tip"><text>静</text><view><text class="tip-title">起卦仪式</text><text class="tip-copy">每次掷币前深呼吸一次，让问题保持清晰。卦象是观察当下的镜子，而非唯一答案。</text></view></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { APP_ROUTES } from '@/common/navigation'
import { isDongYao } from '@/common/mingli/liuyao'
import MysticNav from '@/components/mystic-nav/mystic-nav.vue'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'

interface CoinFace { label: '字' | '花'; value: 2 | 3 }
const yaoNames = ['上', '五', '四', '三', '二', '初']
const question = ref('')
const yaoList = ref<number[]>([])
const isShaking = ref(false)
const coinFaces = ref<CoinFace[]>([{ label: '字', value: 3 }, { label: '花', value: 2 }, { label: '字', value: 3 }])
const currentStep = computed(() => yaoList.value.length)
const stepDesc = computed(() => currentStep.value === 0 ? '请从初爻开始，依次由下而上' : currentStep.value < 6 ? `第 ${currentStep.value + 1} 掷 · 继续守住心念` : '六爻已成，卦门将启')
const buttonText = computed(() => isShaking.value ? '天地流转中…' : currentStep.value >= 6 ? '观卦解意' : currentStep.value === 0 ? '开始第一掷' : `掷出第 ${currentStep.value + 1} 爻`)

function yaoAt(position: number) { return yaoList.value[6 - position] }
function isYin(position: number) { return [6, 8].includes(yaoAt(position)) }
function isMoving(position: number) { const value = yaoAt(position); return value ? isDongYao(value) : false }
function yaoState(position: number) {
  const value = yaoAt(position)
  return ({ 6: '老阴 · 动', 7: '少阳', 8: '少阴', 9: '老阳 · 动' } as Record<number, string>)[value] || '待成'
}
function randomFace(): CoinFace { return Math.random() > .5 ? { label: '字', value: 3 } : { label: '花', value: 2 } }
async function shake() {
  isShaking.value = true
  for (let index = 0; index < 9; index++) {
    coinFaces.value = [randomFace(), randomFace(), randomFace()]
    await new Promise(resolve => setTimeout(resolve, 80 + index * 8))
  }
  const value = coinFaces.value.reduce((sum, coin) => sum + coin.value, 0)
  yaoList.value.push(value)
  isShaking.value = false
  uni.vibrateShort({ type: 'light' })
}
function handleMainAction() {
  if (currentStep.value >= 6) {
    const query = `values=${yaoList.value.join(',')}&question=${encodeURIComponent(question.value.trim() || '心中所问')}`
    uni.navigateTo({ url: `${APP_ROUTES.mingli.liuyao.result}?${query}` })
    return
  }
  shake()
}
function restart() {
  yaoList.value = []
  coinFaces.value = [{ label: '字', value: 3 }, { label: '花', value: 2 }, { label: '字', value: 3 }]
}
</script>

<style scoped lang="scss">
.page{min-height:100vh;background:#eee2c8;color:#172747}.sky-stage{position:relative;height:500rpx;overflow:hidden;background:radial-gradient(circle at 50% 80%,#2c476e,#102542 48%,#07142b 88%)}.stage-copy{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:20rpx}.eyebrow{color:rgba(229,197,120,.58);font:18rpx Georgia,serif;letter-spacing:6rpx}.stage-title{margin-top:14rpx;color:#f1dc9f;font:700 43rpx STKaiti,serif;letter-spacing:6rpx}.stage-desc{margin-top:10rpx;color:rgba(238,220,170,.65);font-size:22rpx;letter-spacing:2rpx}.moon-ring{position:absolute;z-index:2;left:50%;bottom:-118rpx;width:330rpx;height:330rpx;margin-left:-165rpx;display:flex;align-items:flex-start;justify-content:center;padding-top:68rpx;box-sizing:border-box;border:1rpx solid rgba(229,192,99,.4);border-radius:50%;color:#e9c872;font-size:78rpx;box-shadow:0 0 60rpx rgba(218,172,70,.14);animation:breathe 4s ease-in-out infinite}.moon-ring::before,.moon-ring::after{content:'';position:absolute;border:1rpx dashed rgba(230,194,105,.24);border-radius:50%}.moon-ring::before{inset:-30rpx}.moon-ring::after{inset:38rpx}
.paper-body{position:relative;margin-top:-18rpx;padding:38rpx 28rpx calc(45rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:linear-gradient(135deg,rgba(96,70,30,.035) 25%,transparent 25%) 0 0/18rpx 18rpx,#eee2c8}.question-card,.progress-card,.yao-card{border:1rpx solid rgba(163,120,43,.44);background:rgba(250,244,227,.76);box-shadow:0 10rpx 26rpx rgba(63,44,17,.08)}.question-card{position:relative;padding:22rpx 26rpx;border-radius:20rpx 7rpx}.question-label{display:block;color:#8d692b;font:700 24rpx STKaiti,serif}.question-input{height:70rpx;color:#203454;font-size:27rpx;border-bottom:1rpx solid rgba(157,114,43,.25)}.placeholder{color:#978a73}.question-count{position:absolute;right:24rpx;bottom:10rpx;color:#9a8b70;font-size:18rpx}.progress-card{margin-top:18rpx;padding:20rpx 25rpx;border-radius:18rpx}.progress-copy{display:flex;justify-content:space-between;color:#735f3d;font-size:22rpx}.progress-track{height:10rpx;margin-top:13rpx;overflow:hidden;border-radius:6rpx;background:rgba(40,55,75,.12)}.progress-fill{position:relative;height:100%;border-radius:6rpx;background:linear-gradient(90deg,#9f762e,#e0bc62);transition:width .45s}.progress-light{position:absolute;right:0;width:18rpx;height:100%;background:#fff;box-shadow:0 0 8rpx 4rpx rgba(255,255,255,.5)}.step-desc{display:block;margin-top:10rpx;text-align:center;color:#8a7653;font:21rpx STKaiti,serif;letter-spacing:2rpx}
.yao-card{position:relative;margin-top:18rpx;padding:30rpx 32rpx;border-radius:24rpx 8rpx}.yao-labels{position:absolute;top:36rpx;bottom:36rpx;left:18rpx;display:flex;flex-direction:column;justify-content:space-between;color:#a58b5b;font-size:18rpx}.yao-list{display:flex;flex-direction:column;gap:15rpx}.yao-slot{height:50rpx;display:flex;align-items:center;justify-content:center;gap:16rpx;opacity:.3;transition:.4s}.yao-slot.formed{opacity:1;animation:formYao .5s ease both}.yao-position,.yao-state{width:80rpx;color:#6b604a;font-size:20rpx;font-weight:600}.yao-position{text-align:right}.yao-state{color:#92703a}.yao-slot.dong .yao-state{color:#b14b3b;font-weight:700}.yao-line{width:260rpx;height:17rpx;background:linear-gradient(90deg,#a87c2e 0%,#e0c16f 50%,#a87c2e 100%);box-shadow:0 0 14rpx rgba(181,133,48,.32),inset 0 1rpx 0 rgba(255,240,200,.3)}.yao-line.broken{background:linear-gradient(90deg,#a87c2e 0 40%,transparent 40% 60%,#a87c2e 60% 100%)}.yao-empty{width:260rpx;height:17rpx;display:flex;align-items:center;justify-content:center;border-top:1rpx dashed rgba(104,86,57,.3);color:#967c50}
.coin-stage{position:relative;height:250rpx;margin-top:28rpx}.coin{position:absolute;width:130rpx;height:130rpx;border-radius:50%;padding:7rpx;box-sizing:border-box;background:linear-gradient(145deg,#6b4a18 0%,#d4a83e 30%,#f3d770 50%,#d4a83e 70%,#6b4a18 100%);box-shadow:0 20rpx 24rpx rgba(72,49,17,.28),inset 0 0 0 3rpx rgba(255,239,183,.45),inset 0 -4rpx 8rpx rgba(90,58,10,.3),inset 0 2rpx 4rpx rgba(255,245,196,.3);transition:.3s}.coin-1{left:74rpx;top:50rpx;transform:rotate(-12deg)}.coin-2{left:50%;top:20rpx;margin-left:-65rpx}.coin-3{right:74rpx;top:54rpx;transform:rotate(14deg)}.coin-inner{width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;border:2rpx solid rgba(104,67,14,.6);border-radius:50%;color:#4a3008;font:700 36rpx STKaiti,serif;text-shadow:0 1rpx rgba(255,245,196,.6);background:radial-gradient(circle at 35% 30%,rgba(255,235,160,.4),transparent 60%)}.coin-hole{position:absolute;width:34rpx;height:34rpx;border:2rpx solid rgba(93,57,11,.6);transform:rotate(45deg);box-shadow:inset 0 0 4rpx rgba(93,57,11,.3)}.coin-pattern{position:absolute;bottom:12rpx;font-size:15rpx;letter-spacing:5rpx;opacity:.7}.coin-shadow{position:absolute;left:50%;bottom:20rpx;width:380rpx;height:32rpx;margin-left:-190rpx;border-radius:50%;box-shadow:0 0 30rpx 14rpx rgba(55,38,17,.18)}.coin-stage.shaking .coin-1{animation:coinToss .32s linear infinite}.coin-stage.shaking .coin-2{animation:coinToss .27s .05s linear infinite reverse}.coin-stage.shaking .coin-3{animation:coinToss .35s .1s linear infinite}
.divine-btn{height:102rpx;border:0;border-radius:51rpx;color:#f4e3b4;background:linear-gradient(90deg,#0f2240,#2c4264 50%,#0f2240);box-shadow:0 16rpx 30rpx rgba(19,41,70,.25),inset 0 0 0 2rpx rgba(225,190,102,.55),inset 0 2rpx 0 rgba(255,255,255,.08);font:700 30rpx STKaiti,serif;letter-spacing:4rpx;transition:.2s}.divine-btn:active:not([disabled]){transform:translateY(2rpx)}.divine-btn::after{border:0}.divine-btn[disabled]{opacity:.6}.btn-star{margin:0 18rpx;color:#ddba61}.action-row{height:62rpx;display:flex;align-items:center;justify-content:center;color:#8d7751;font-size:21rpx}.ritual-tip{display:flex;gap:18rpx;padding:24rpx 26rpx;border-top:1rpx solid rgba(157,114,42,.3);border-bottom:1rpx solid rgba(157,114,42,.3)}.ritual-tip>text{width:56rpx;height:56rpx;line-height:56rpx;text-align:center;border:1rpx solid #a67b30;border-radius:50%;color:#9a712b;font:32rpx/56rpx STKaiti,serif}.ritual-tip view{flex:1}.tip-title,.tip-copy{display:block}.tip-title{font:700 26rpx STKaiti,serif;color:#2a3a55}.tip-copy{margin-top:6rpx;color:#6e6353;font-size:21rpx;line-height:1.6}
@keyframes coinToss{0%{transform:translateY(0) rotateY(0) rotate(0)}50%{transform:translateY(-52rpx) rotateY(180deg) rotate(14deg)}100%{transform:translateY(0) rotateY(360deg) rotate(0)}}@keyframes formYao{from{opacity:0;transform:scaleX(.15)}to{opacity:1;transform:scaleX(1)}}@keyframes breathe{50%{box-shadow:0 0 90rpx rgba(218,172,70,.28);transform:scale(1.04)}}
</style>
