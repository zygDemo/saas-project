<template>
  <view class="mystic-sky" :class="{ 'reduced-motion': isReduced }" aria-hidden="true">
    <!-- 中心恒星 -->
    <view class="sun-core">
      <view class="sun-glow" />
      <view class="sun-corona" />
    </view>
    <!-- 极光带 -->
    <view v-if="!isReduced" class="aurora aurora-a" />
    <view v-if="!isReduced" class="aurora aurora-b" />
    <!-- 星云 -->
    <view class="nebula nebula-one" />
    <view v-if="!isReduced" class="nebula nebula-two" />
    <view v-if="!isReduced" class="nebula nebula-three" />
    <!-- 星星（三层：远/中/近） -->
    <view v-for="star in farStars" :key="'f' + star.id" class="star star-far" :style="star.style" />
    <view v-for="star in midStars" :key="'m' + star.id" class="star star-mid" :style="star.style" />
    <view v-for="star in nearStars" :key="'n' + star.id" class="star star-near" :style="star.style" />
    <!-- 流星 -->
    <view v-if="!isReduced" class="shooting-star shooting-star-1" />
    <view v-if="!isReduced" class="shooting-star shooting-star-2" />
    <!-- 行星轨道（太阳系感） -->
    <view class="orbit orbit-one" :class="{ static: isReduced }"><view class="planet planet-1" /></view>
    <view v-if="!isReduced" class="orbit orbit-two"><view class="planet planet-2" /></view>
    <view v-if="!isReduced" class="orbit orbit-three"><view class="planet planet-3" /></view>
    <view v-if="!isReduced" class="orbit orbit-four" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  reducedMotion?: boolean
}

const props = defineProps<Props>()

function loadReducedMotionSetting(): boolean {
  try {
    return uni.getStorageSync('mingli_reduced_motion') === '1'
  }
  catch {
    return false
  }
}

const isReduced = computed(() => props.reducedMotion ?? loadReducedMotionSetting())

function makeStars(count: number, sizeRange: [number, number], prefix: string, reduced: boolean) {
  const finalCount = reduced ? Math.ceil(count / 2) : count
  return Array.from({ length: finalCount }, (_, index) => {
    const size = sizeRange[0] + ((index * 7) % (sizeRange[1] - sizeRange[0] + 1))
    return {
      id: `${prefix}-${index}`,
      style: {
        left: `${(index * 37 + 11) % 98}%`,
        top: `${(index * 53 + 7) % 92}%`,
        width: `${size}rpx`,
        height: `${size}rpx`,
        animationDelay: reduced ? '0s' : `${(index % 9) * 0.45}s`,
        animationDuration: reduced ? '0s' : `${2.2 + (index % 6) * 0.6}s`,
        opacity: reduced ? '0.55' : undefined,
      }
    }
  })
}
const farStars = computed(() => makeStars(32, [2, 3], 'far', isReduced.value))
const midStars = computed(() => makeStars(20, [3, 4], 'mid', isReduced.value))
const nearStars = computed(() => makeStars(12, [5, 7], 'near', isReduced.value))
</script>

<style scoped>
.mystic-sky { position: absolute; top: 0; right: 0; bottom: 0; left: 0; overflow: hidden; pointer-events: none; }

/* === 中心恒星（太阳系中心） === */
.sun-core { position: absolute; left: 50%; top: 50%; width: 24rpx; height: 24rpx; margin: -12rpx 0 0 -12rpx; border-radius: 50%; background: var(--ming-purple-light); box-shadow: 0 0 24rpx var(--ming-purple-glow), 0 0 60rpx var(--ming-purple); z-index: 5; animation: sunPulse 4s ease-in-out infinite; }
.sun-glow { position: absolute; inset: -20rpx; border-radius: 50%; background: radial-gradient(circle, var(--ming-purple) 0%, transparent 70%); opacity: .22; animation: sunPulse 12s ease-in-out infinite; }
.sun-corona { position: absolute; inset: -60rpx; border-radius: 50%; background: radial-gradient(circle, var(--ming-purple-soft) 0%, transparent 65%); opacity: .16; animation: sunPulse 12s ease-in-out infinite; }

/* === 极光带 === */
.aurora { position: absolute; border-radius: 50%; filter: blur(32rpx); opacity: .16; animation: auroraFlow 26s ease-in-out infinite alternate; }
.aurora-a { width: 620rpx; height: 240rpx; top: 60rpx; left: -140rpx; background: radial-gradient(ellipse, rgba(41,182,246,.22), transparent 72%); }
.aurora-b { width: 540rpx; height: 220rpx; top: 220rpx; right: -120rpx; background: radial-gradient(ellipse, rgba(124, 92, 255, .18), transparent 72%); animation-delay: -12s; }

/* === 星云 === */
.nebula { position: absolute; border-radius: 50%; opacity: .14; animation: mysticFloat 24s ease-in-out infinite alternate; }
.nebula-one { width: 460rpx; height: 280rpx; top: 50rpx; right: -200rpx; background: radial-gradient(circle, rgba(41,182,246,.12), transparent 70%); box-shadow: 0 0 140rpx 70rpx rgba(41,182,246,.08); }
.nebula-two { width: 380rpx; height: 260rpx; left: -180rpx; bottom: 10rpx; background: radial-gradient(circle, rgba(124,92,255,.10), transparent 72%); box-shadow: 0 0 120rpx 60rpx rgba(124,92,255,.06); animation-delay: -4s; }
.nebula-three { width: 300rpx; height: 200rpx; top: 340rpx; left: 40%; background: radial-gradient(circle, var(--ming-purple-faint), transparent 72%); animation-delay: -4s; }

/* === 星星（三层） === */
.star { position: absolute; border-radius: 50%; animation: mysticTwinkle 6s ease-in-out infinite; }
.star-far { background: rgba(200, 235, 255, .55); box-shadow: 0 0 4rpx rgba(129,212,250,.45); }
.star-mid { background: var(--ming-purple-light); box-shadow: 0 0 8rpx rgba(129,212,250,.38), 0 0 3rpx var(--ming-purple-light); }
.star-near { background: #d8f3ff; box-shadow: 0 0 10rpx rgba(79,195,247,.42), 0 0 5rpx rgba(129,212,250,.35), 0 0 3rpx #fff; animation-duration: 7s; }

/* === 流星 === */
.shooting-star { position: absolute; width: 4rpx; height: 4rpx; border-radius: 50%; background: var(--ming-purple-light); box-shadow: 0 0 8rpx rgba(129,212,250,.42), 0 0 4rpx rgba(79,195,247,.32); opacity: .12; }
.shooting-star::after { content: ''; position: absolute; top: 50%; right: 0; width: 90rpx; height: 2rpx; transform: translateY(-50%); background: linear-gradient(90deg, transparent, var(--ming-purple-soft), var(--ming-purple-light)); border-radius: 50%; }
.shooting-star-1 { top: 15%; left: 0; animation: shooting 18s ease-out 3s infinite; }
.shooting-star-2 { top: 35%; left: 0; animation: shooting 22s ease-out 8s infinite; }

/* === 行星轨道（太阳系感） === */
.orbit { position: absolute; border: 1rpx solid rgba(129,212,250,.14); border-radius: 50%; left: 50%; }
.orbit-one { width: 200rpx; height: 200rpx; top: 50%; margin: -100rpx 0 0 -100rpx; transform: rotate(-18deg); animation: mysticSpin 28s linear infinite; }
.orbit-two { width: 320rpx; height: 320rpx; top: 50%; margin: -160rpx 0 0 -160rpx; border-style: dashed; animation: mysticSpinReverse 36s linear infinite; }
.orbit-three { width: 440rpx; height: 440rpx; top: 50%; margin: -220rpx 0 0 -220rpx; border-style: dotted; opacity: .22; animation: mysticSpin 52s linear infinite; }
.orbit-four { width: 560rpx; height: 560rpx; top: 50%; margin: -280rpx 0 0 -280rpx; border-style: dotted; opacity: .16; animation: mysticSpinReverse 72s linear infinite; }

/* === 行星 === */
.planet { position: absolute; border-radius: 50%; background: rgba(200, 240, 255, .72); }
.planet-1 { width: 12rpx; height: 12rpx; left: 0; top: 50%; margin-top: -6rpx; box-shadow: 0 0 16rpx var(--ming-purple), 0 0 6rpx var(--ming-purple-light); }
.planet-2 { width: 16rpx; height: 16rpx; right: 0; top: 50%; margin-top: -8rpx; background: var(--ming-purple-light); box-shadow: 0 0 12rpx rgba(79,195,247,.34), 0 0 5rpx rgba(129,212,250,.3); }
.planet-3 { width: 10rpx; height: 10rpx; left: 50%; top: 0; margin-left: -5rpx; box-shadow: 0 0 8rpx rgba(129,212,250,.3); }

/* === 减少动效模式 === */
.mystic-sky.reduced-motion .star { animation: none !important; }
.mystic-sky.reduced-motion .sun-core,
.mystic-sky.reduced-motion .sun-glow,
.mystic-sky.reduced-motion .sun-corona { animation: none !important; opacity: 0.9; transform: scale(1) !important; }
.mystic-sky.reduced-motion .nebula { animation: none !important; opacity: 0.12 !important; }
.mystic-sky.reduced-motion .orbit-one.static { animation: none !important; opacity: 0.2; }

@keyframes mysticTwinkle { 0%, 100% { opacity: .22; transform: scale(.7); } 50% { opacity: 1; transform: scale(1.35); } }
@keyframes mysticFloat { from { transform: translate3d(-14rpx, -8rpx, 0) scale(.95); } to { transform: translate3d(18rpx, 16rpx, 0) scale(1.08); } }
@keyframes mysticSpin { to { transform: rotate(360deg); } }
@keyframes mysticSpinReverse { to { transform: rotate(-360deg); } }
@keyframes auroraFlow { 0% { transform: translate3d(0, 0, 0) scale(1); opacity: .3; } 50% { transform: translate3d(40rpx, -20rpx, 0) scale(1.15); opacity: .5; } 100% { transform: translate3d(-20rpx, 30rpx, 0) scale(.95); opacity: .4; } }
@keyframes shooting { 0% { transform: translate(0, 0) rotate(-15deg); opacity: .12; } 3% { opacity: 1; } 18% { transform: translate(680rpx, 200rpx) rotate(-15deg); opacity: .12; } 100% { opacity: .12; } }
@keyframes sunPulse { 0%, 100% { opacity: .85; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }
</style>
