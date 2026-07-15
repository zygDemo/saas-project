<template>
  <view class="mystic-sky" aria-hidden="true">
    <view class="nebula nebula-one" />
    <view class="nebula nebula-two" />
    <view v-for="star in stars" :key="star.id" class="star" :style="star.style" />
    <view class="orbit orbit-one"><view class="orbit-dot" /></view>
    <view class="orbit orbit-two" />
  </view>
</template>

<script setup lang="ts">
const stars = Array.from({ length: 20 }, (_, index) => ({
  id: index,
  style: {
    left: `${(index * 37 + 11) % 96}%`,
    top: `${(index * 53 + 7) % 88}%`,
    width: `${index % 4 === 0 ? 6 : 3}rpx`,
    height: `${index % 4 === 0 ? 6 : 3}rpx`,
    animationDelay: `${(index % 7) * 0.4}s`,
    animationDuration: `${2.4 + (index % 5) * 0.55}s`
  }
}))
</script>

<style scoped>
.mystic-sky { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.star { position: absolute; border-radius: 50%; background: #fff3c2; box-shadow: 0 0 14rpx rgba(248, 215, 140, .9); animation: mysticTwinkle 3s ease-in-out infinite; }
.nebula { position: absolute; border-radius: 50%; filter: blur(18rpx); opacity: .36; animation: mysticFloat 10s ease-in-out infinite alternate; }
.nebula-one { width: 420rpx; height: 260rpx; top: 60rpx; right: -180rpx; background: radial-gradient(circle, rgba(126, 94, 184, .55), transparent 68%); }
.nebula-two { width: 360rpx; height: 240rpx; left: -160rpx; bottom: 20rpx; background: radial-gradient(circle, rgba(49, 117, 167, .5), transparent 70%); animation-delay: -4s; }
.orbit { position: absolute; border: 1rpx solid rgba(230, 194, 112, .2); border-radius: 50%; }
.orbit-one { width: 390rpx; height: 390rpx; top: 70rpx; left: 50%; margin-left: -195rpx; transform: rotate(-18deg); animation: mysticSpin 28s linear infinite; }
.orbit-two { width: 290rpx; height: 290rpx; top: 120rpx; left: 50%; margin-left: -145rpx; border-style: dashed; animation: mysticSpinReverse 22s linear infinite; }
.orbit-dot { position: absolute; width: 14rpx; height: 14rpx; left: 38rpx; top: 38rpx; border-radius: 50%; background: #e8c36d; box-shadow: 0 0 22rpx #e8c36d; }
@keyframes mysticTwinkle { 0%, 100% { opacity: .22; transform: scale(.7); } 50% { opacity: 1; transform: scale(1.35); } }
@keyframes mysticFloat { from { transform: translate3d(-14rpx, -8rpx, 0) scale(.95); } to { transform: translate3d(18rpx, 16rpx, 0) scale(1.08); } }
@keyframes mysticSpin { to { transform: rotate(342deg); } }
@keyframes mysticSpinReverse { to { transform: rotate(-360deg); } }
@media (prefers-reduced-motion: reduce) { .star, .nebula, .orbit { animation: none; } }
</style>
