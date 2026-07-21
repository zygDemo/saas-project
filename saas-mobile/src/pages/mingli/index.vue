<template>
  <view class="mingli-page">
    <view class="hero">
      <mystic-sky />
      <view class="particle-field">
        <view v-for="i in 12" :key="'p'+i" class="particle" />
      </view>
      <view class="hero-wave hero-wave-a" />
      <view class="hero-wave hero-wave-b" />
      <view class="hero-wave hero-wave-c" />
      <view class="topbar">
        <view class="capsule cinema-glass">
          <view class="capsule-left" hover-class="tap-active" @tap="goBack"><text>‹</text></view>
          <view class="capsule-divider" />
          <view class="capsule-mid" hover-class="tap-active" @tap="goHome"><text class="home-icon">⌂</text></view>
          <view class="capsule-divider" />
          <view class="capsule-right" hover-class="tap-active" @tap="goHistory">
            <text>星卷</text>
            <text class="history-count">{{ historyCount }}</text>
          </view>
        </view>
      </view>

      <view class="hero-copy enter enter-1">
        <text class="eyebrow">ORIENTAL ASTROLOGY</text>
        <text class="title cinema-title" data-text="观星 · 见己">观星 · 见己</text>
        <text class="subtitle">以天地为镜，读懂流动中的自己</text>
      </view>

      <view class="astrolabe enter enter-2">
        <view class="ring ring-outer"><text v-for="item in earthlyBranches" :key="item" class="branch">{{ item }}</text></view>
        <view class="ring ring-mid" />
        <view class="ring ring-inner" />
        <view class="yin-yang"><text>☯</text></view>
        <view class="glow-core" />
      </view>
      <view class="cloud cloud-left">☁</view>
      <view class="cloud cloud-right">☁</view>
    </view>

    <view class="paper-section">
      <view class="paper-grain" />
      <view class="section-heading enter enter-3">
        <text class="ornament">✦</text>
        <text class="heading-title">选择你的问道方式</text>
        <text class="heading-subtitle">一看命势流转 · 一问当下玄机</text>
      </view>

      <view class="method-card bazi-card cinema-glass enter enter-4" hover-class="tap-active" @tap="goBazi">
        <view class="card-shine" />
        <view class="card-index">壹</view>
        <view class="card-copy">
          <view class="tag">四柱 · 五行 · 大运</view>
          <text class="card-title">八字排盘</text>
          <text class="card-desc">从出生时空读取五行比例与人生节奏，观一生起伏。</text>
          <view class="card-action"><text>开启命盘</text><text class="arrow">→</text></view>
        </view>
        <view class="five-elements">
          <view v-for="(item, index) in elements" :key="item.name" class="planet" :class="`planet-${index}`">
            <text>{{ item.name }}</text>
          </view>
          <view class="element-orbit" />
        </view>
      </view>

      <view class="method-card liuyao-card cinema-glass enter enter-5" hover-class="tap-active" @tap="goLiuyao">
        <view class="card-shine" />
        <view class="card-index">贰</view>
        <view class="card-copy">
          <view class="tag">铜钱 · 六爻 · 变卦</view>
          <text class="card-title">六爻问事</text>
          <text class="card-desc">心念一事，掷钱成卦。看此时此刻，事情如何变化。</text>
          <view class="card-action"><text>静心起卦</text><text class="arrow">→</text></view>
        </view>
        <view class="hexagram-art">
          <view class="hexagram-halo" />
          <view class="hexagram-disc">
            <view class="hexagram-ring" />
            <view v-for="(line, index) in demoYao" :key="index" class="mini-yao" :class="{ broken: !line }" />
            <view class="hexagram-core" />
          </view>
        </view>
      </view>

      <view class="guide-card enter enter-6">
        <view class="guide-star">✧</view>
        <view class="guide-copy">
          <text class="guide-title">新手如何选择？</text>
          <text class="guide-text">想了解长期趋势，先看八字；心中有具体疑问，就用六爻。</text>
        </view>
      </view>
      <text class="disclaimer">命理推演仅供文化研究与自我探索，请理性看待</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { APP_ROUTES } from '@/common/navigation'
import { getMingliHistory } from '@/common/mingli/history'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'

const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
const elements = [{ name: '木' }, { name: '火' }, { name: '土' }, { name: '金' }, { name: '水' }]
const demoYao = [true, false, true, true, false, false]
const historyCount = ref(0)

onShow(() => {
  historyCount.value = getMingliHistory().length
})
const goBazi = () => uni.navigateTo({ url: APP_ROUTES.mingli.bazi.input })
const goLiuyao = () => uni.navigateTo({ url: APP_ROUTES.mingli.liuyao.shake })
const goHistory = () => uni.navigateTo({ url: APP_ROUTES.mingli.history })
const goHome = () => uni.reLaunch({ url: APP_ROUTES.portal.home })
function goBack() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: APP_ROUTES.portal.home })
}
</script>

<style scoped lang="scss">
.mingli-page { min-height: 100vh; background: var(--ming-bg-deep); color: var(--ming-text-primary); overflow: hidden; }
.hero { position: relative; height: 720rpx; overflow: hidden; background: var(--ming-gradient-hero); padding-top: calc(var(--status-bar-height) + 86rpx); }
.topbar { position: fixed; top: 36rpx; left: 0; right: 0; z-index: 40; padding: calc(var(--status-bar-height) + 14rpx) 24rpx 12rpx; display: flex; justify-content: flex-start; align-items: center; pointer-events: none; }
.capsule { pointer-events: auto; }
.capsule { height: 64rpx; display: flex; align-items: center; border: 1rpx solid var(--ming-border-purple); border-radius: 32rpx; background: rgba(255,255,255,.08); backdrop-filter: blur(18rpx); overflow: hidden; box-shadow: inset 0 1rpx 0 rgba(255,255,255,.05); }
.capsule-left { width: 70rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); font-size: 58rpx; line-height: 1; }
.capsule-left text { transform: translateY(-2rpx); }
.capsule-mid { width: 70rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); }
.capsule-mid .home-icon { font-size: 38rpx; line-height: 1; }
.capsule-divider { width: 1rpx; height: 36rpx; background: rgba(255,255,255,.16); }
.capsule-right { min-width: 70rpx; height: 64rpx; padding: 0 18rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); font-size: 24rpx; }.capsule-right text { margin-left: 12rpx; }.capsule-right text:first-child { margin-left: 0; }
.history-count { min-width: 30rpx; height: 30rpx; line-height: 30rpx; border-radius: 50%; text-align: center; color: var(--ming-bg-deep); background: var(--ming-purple-glow); font-size: 20rpx; }
.hero-copy { position: relative; z-index: 4; display: flex; flex-direction: column; align-items: center; padding-top: 60rpx; }
.eyebrow { color: var(--ming-text-purple-soft); font: 18rpx Georgia, serif; letter-spacing: 8rpx; text-shadow: 0 0 10rpx rgba(79, 195, 247, .3); }
.title { margin-top: 12rpx; color: var(--ming-text-purple); font: 700 62rpx STKaiti, KaiTi, serif; letter-spacing: 14rpx; text-shadow: 0 0 30rpx var(--ming-purple-soft); animation: titleGlow 4s ease-in-out infinite; }
.subtitle { margin-top: 8rpx; color: var(--ming-text-primary); font-size: 24rpx; letter-spacing: 3rpx; text-shadow: 0 0 8rpx rgba(79, 195, 247, .22); }
.astrolabe { position: absolute; z-index: 3; width: 400rpx; height: 400rpx; left: 50%; bottom: -46rpx; transform: translateX(-50%); animation: breathe 5s ease-in-out infinite; }
.ring { position: absolute; border-radius: 50%; border: 1rpx solid var(--ming-border-purple); box-shadow: inset 0 0 22rpx var(--ming-purple-faint), 0 0 20rpx var(--ming-purple-faint); }
.ring-outer { inset: 0; animation: spin 48s linear infinite; }
.ring-mid { inset: 45rpx; border-style: dashed; animation: spinReverse 34s linear infinite; }
.ring-inner { inset: 96rpx; border-width: 2rpx; }
.branch { position: absolute; left: 50%; top: 50%; width: 36rpx; margin-left: -18rpx; margin-top: -18rpx; text-align: center; color: var(--ming-purple); font: 24rpx STKaiti, serif; transform: rotate(calc(var(--i) * 30deg)) translateY(-180rpx); }
.branch:nth-child(1) { transform: rotate(0deg) translateY(-180rpx) rotate(0deg); }.branch:nth-child(2) { transform: rotate(30deg) translateY(-180rpx) rotate(-30deg); }.branch:nth-child(3) { transform: rotate(60deg) translateY(-180rpx) rotate(-60deg); }.branch:nth-child(4) { transform: rotate(90deg) translateY(-180rpx) rotate(-90deg); }.branch:nth-child(5) { transform: rotate(120deg) translateY(-180rpx) rotate(-120deg); }.branch:nth-child(6) { transform: rotate(150deg) translateY(-180rpx) rotate(-150deg); }.branch:nth-child(7) { transform: rotate(180deg) translateY(-180rpx) rotate(-180deg); }.branch:nth-child(8) { transform: rotate(210deg) translateY(-180rpx) rotate(-210deg); }.branch:nth-child(9) { transform: rotate(240deg) translateY(-180rpx) rotate(-240deg); }.branch:nth-child(10) { transform: rotate(270deg) translateY(-180rpx) rotate(-270deg); }.branch:nth-child(11) { transform: rotate(300deg) translateY(-180rpx) rotate(-300deg); }.branch:nth-child(12) { transform: rotate(330deg) translateY(-180rpx) rotate(-330deg); }
.yin-yang { position: absolute; inset: 130rpx; display: flex; align-items: center; justify-content: center; border: 1rpx solid var(--ming-border-purple); border-radius: 50%; color: var(--ming-gold-light); font-size: 82rpx; text-shadow: 0 0 30rpx var(--ming-purple); }
.glow-core { position: absolute; inset: 160rpx; border-radius: 50%; background: var(--ming-purple-soft); box-shadow: 0 0 80rpx 36rpx var(--ming-shadow-purple); animation: corePulse 3s ease-in-out infinite; }
.hero-aurora-sweep { position: absolute; z-index: 2; left: -50%; top: 0; width: 60%; height: 100%; background: linear-gradient(105deg, transparent 30%, var(--ming-purple-faint) 45%, var(--ming-purple-soft) 50%, var(--ming-purple-faint) 55%, transparent 70%); transform: skewX(-15deg); animation: auroraSweep 9s ease-in-out infinite; }
.cloud { position: absolute; z-index: 5; bottom: -8rpx; color: var(--ming-cyan); opacity: .10; font-size: 220rpx; }.cloud-left { left: -90rpx; }.cloud-right { right: -80rpx; transform: scaleX(-1); }
.paper-section { position: relative; z-index: 8; margin-top: -2rpx; padding: 40rpx 24rpx calc(40rpx + env(safe-area-inset-bottom)); background: radial-gradient(circle at 50% 0, rgba(22, 36, 73, .55) 0%, transparent 60%), var(--ming-bg-deep); }
.paper-section::before { content: ''; position: absolute; left: 0; right: 0; top: -34rpx; height: 70rpx; background: radial-gradient(70rpx 36rpx at 12% 100%, var(--ming-bg-deep) 98%, transparent), radial-gradient(90rpx 46rpx at 42% 100%, var(--ming-bg-deep) 98%, transparent), radial-gradient(78rpx 40rpx at 76% 100%, var(--ming-bg-deep) 98%, transparent), radial-gradient(70rpx 38rpx at 100% 100%, var(--ming-bg-deep) 98%, transparent); }
.section-heading { position: relative; display: flex; flex-direction: column; align-items: center; margin-bottom: 28rpx; }.ornament { color: var(--ming-cyan); font-size: 30rpx; text-shadow: 0 0 12rpx var(--ming-cyan-soft); }.heading-title { font: 700 40rpx STKaiti, KaiTi, serif; letter-spacing: 4rpx; color: var(--ming-text-primary); text-shadow: 0 0 22rpx rgba(79, 195, 247, .25); }.heading-subtitle { margin-top: 8rpx; font-size: 23rpx; color: var(--ming-text-primary); letter-spacing: 2rpx; text-shadow: 0 0 8rpx rgba(79, 195, 247, .2); }
.method-card { position: relative; min-height: 300rpx; margin-bottom: 22rpx; padding: 32rpx 28rpx; overflow: hidden; border: 1rpx solid var(--ming-border-purple); border-radius: 24rpx 8rpx 24rpx 8rpx; box-sizing: border-box; background: var(--ming-paper-soft); box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, .22), 0 2rpx 8rpx rgba(0,0,0,.08), inset 0 0 0 1rpx rgba(255,255,255,.06); transition: transform .3s cubic-bezier(.2,.8,.2,1), box-shadow .3s; animation: cardFloat 5s ease-in-out infinite; }.method-card:active { transform: scale(.985) translateY(2rpx); box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, .26), 0 0 30rpx var(--ming-cyan-soft); }.method-card:nth-child(2) { animation-delay: -2.5s; }
.bazi-card { background: linear-gradient(135deg, rgba(13, 24, 48, .86) 0%, rgba(10, 18, 38, .94) 100%); border-color: rgba(79, 195, 247, .30); box-shadow: 0 14rpx 32rpx rgba(0, 0, 0, .18), inset 0 0 0 1rpx rgba(255,255,255,.05); }.liuyao-card { background: linear-gradient(135deg, rgba(18, 24, 56, .86) 0%, rgba(10, 16, 34, .94) 100%); color: var(--ming-text-purple); border-color: rgba(124, 92, 255, .28); box-shadow: 0 16rpx 34rpx rgba(0, 0, 0, .22), inset 0 0 0 1rpx rgba(255,255,255,.05); }
.card-index { position: absolute; right: 20rpx; top: 4rpx; color: rgba(79, 195, 247, .12); font: 96rpx STKaiti, serif; }.liuyao-card .card-index { color: rgba(124, 92, 255, .14); }
.card-copy { position: relative; z-index: 4; width: 59%; display: flex; flex-direction: column; }.tag { width: fit-content; padding: 7rpx 14rpx; border: 1rpx solid var(--ming-border-purple); border-radius: 18rpx; color: var(--ming-cyan); font-size: 19rpx; letter-spacing: 2rpx; background: rgba(79, 195, 247, .08); }.liuyao-card .tag { color: var(--ming-violet-light); border-color: rgba(124, 92, 255, .22); background: rgba(124, 92, 255, .08); }
.card-title { margin-top: 16rpx; font: 700 44rpx STKaiti, KaiTi, serif; letter-spacing: 4rpx; color: var(--ming-text-primary); }.card-desc { margin-top: 10rpx; color: var(--ming-text-primary); font-size: 23rpx; line-height: 1.6; text-shadow: 0 0 6rpx rgba(79, 195, 247, .18); }.liuyao-card .card-desc { color: rgba(230, 240, 255, .9); }
.card-action { margin-top: 18rpx; display: flex; align-items: center; color: var(--ming-cyan); font-size: 24rpx; font-weight: 600; }.liuyao-card .card-action { color: var(--ming-violet-light); }.arrow { font-size: 28rpx; margin-left: 10rpx; }
.five-elements { position: absolute; right: 18rpx; bottom: 26rpx; width: 240rpx; height: 230rpx; }.element-orbit { position: absolute; inset: 30rpx 18rpx; border: 1rpx dashed rgba(227, 220, 255, .10); border-radius: 50%; animation: spin 26s linear infinite; }.planet { position: absolute; z-index: 2; width: 62rpx; height: 62rpx; display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff8e6; font: 24rpx STKaiti, serif; box-shadow: inset -8rpx -8rpx 16rpx rgba(0,0,0,.18), 0 0 18rpx rgba(111,83,247,.10); animation: floatPlanet 4.8s ease-in-out infinite; }.planet-0{left:0;top:78rpx;background:#426d48}.planet-1{left:82rpx;top:0;background:#a94734;animation-delay:-.8s}.planet-2{right:0;top:70rpx;background:#9d763a;animation-delay:-1.6s}.planet-3{right:38rpx;bottom:0;background:#b5a374;color:#26324a;animation-delay:-2.2s}.planet-4{left:46rpx;bottom:2rpx;background:#273d65;animation-delay:-2.8s}
.hexagram-art { position: absolute; right: 18rpx; top: 48rpx; width: 236rpx; height: 236rpx; display: flex; align-items: center; justify-content: center; } .hexagram-halo { position: absolute; inset: -18rpx; border-radius: 50%; background: radial-gradient(circle at 50% 50%, rgba(143,99,247,.18) 0%, rgba(143,99,247,.08) 36%, transparent 72%); filter: blur(14rpx); animation: haloBreath 7.5s ease-in-out infinite; } .hexagram-disc { position: relative; width: 196rpx; height: 196rpx; border-radius: 50%; background: radial-gradient(circle at 50% 42%, rgba(255,255,255,.08) 0%, rgba(143,99,247,.10) 38%, rgba(12,18,46,.12) 68%, rgba(12,18,46,.02) 100%); box-shadow: inset 0 0 0 1rpx rgba(227,220,255,.10), inset 0 0 28rpx rgba(143,99,247,.08), 0 0 28rpx rgba(111,83,247,.10); display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; animation: discFloat 8.8s ease-in-out infinite; } .hexagram-ring { position: absolute; inset: 16rpx; border-radius: 50%; border: 1rpx solid rgba(227,220,255,.12); box-shadow: inset 0 0 18rpx rgba(143,99,247,.06); } .mini-yao { position: relative; z-index: 2; width: 124rpx; height: 10rpx; border-radius: 999rpx; background: linear-gradient(90deg, rgba(230,224,255,.10) 0%, rgba(143,99,247,.86) 50%, rgba(230,224,255,.10) 100%); box-shadow: 0 0 10rpx rgba(143,99,247,.16); margin-top: 12rpx; animation: lineBreath 5.2s ease-in-out infinite; } .mini-yao:first-child { margin-top: 0; } .mini-yao.broken { background: linear-gradient(90deg, rgba(143,99,247,.92) 0 36%, transparent 36% 64%, rgba(143,99,247,.92) 64%); } .hexagram-core { position: absolute; width: 46rpx; height: 46rpx; border-radius: 50%; background: radial-gradient(circle at 35% 32%, rgba(255,255,255,.12), rgba(143,99,247,.12) 52%, rgba(12,18,46,.10) 100%); box-shadow: inset 0 0 0 1rpx rgba(227,220,255,.08), 0 0 16rpx rgba(111,83,247,.08); animation: corePulseSoft 6s ease-in-out infinite; }
.guide-card { margin-top: 28rpx; display: flex; align-items: center; padding: 22rpx 24rpx; border: 1rpx solid var(--ming-border-purple); border-radius: 18rpx; background: rgba(10, 16, 34, .5); }.guide-star { color: var(--ming-cyan); font-size: 40rpx; margin-right: 18rpx; text-shadow: 0 0 14rpx var(--ming-cyan-soft); }.guide-copy { display:flex; flex-direction:column; }.guide-title { font: 700 28rpx STKaiti,serif; color:var(--ming-text-purple); }.guide-text { margin-top: 6rpx; color:var(--ming-text-primary); font-size:23rpx; line-height:1.55; text-shadow: 0 0 6rpx rgba(79, 195, 247, .18); }.disclaimer { display:block; margin-top:24rpx; text-align:center; color:var(--ming-text-purple-soft); font-size:20rpx; letter-spacing:1rpx; }
.enter { animation: enterUp .75s both; }.enter-2{animation-delay:.12s}.enter-3{animation-delay:.2s}.enter-4{animation-delay:.28s}.enter-5{animation-delay:.38s}.enter-6{animation-delay:.48s}
@keyframes haloBreath { 0%,100% { transform: scale(1); opacity: .70; } 50% { transform: scale(1.08); opacity: .95; } } @keyframes discFloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-6rpx) scale(1.02); } } @keyframes lineBreath { 0%,100% { opacity: .78; } 50% { opacity: 1; } } @keyframes corePulseSoft { 0%,100% { transform: scale(1); opacity: .90; } 50% { transform: scale(1.12); opacity: 1; } }
@keyframes enterUp { from { opacity:0; transform:translateY(28rpx); } to { opacity:1; transform:translateY(0); } } @keyframes spin { to { transform:rotate(360deg); } } @keyframes spinReverse { to { transform:rotate(-360deg); } } @keyframes breathe { 50% { box-shadow:0 0 22rpx rgba(79,195,247,.38); transform:translateX(-50%) scale(1.025); } } @keyframes floatPlanet { 50% { transform:translateY(-9rpx); } } @keyframes titleGlow { 0%,100% { text-shadow: 0 0 30rpx var(--ming-purple-soft), 0 0 60rpx var(--ming-purple-faint); } 50% { text-shadow: 0 0 40rpx var(--ming-purple), 0 0 80rpx var(--ming-purple-soft); } } @keyframes corePulse { 0%,100% { box-shadow: 0 0 80rpx 36rpx var(--ming-shadow-purple); opacity: .8; } 50% { box-shadow: 0 0 120rpx 50rpx var(--ming-shadow-glow); opacity: 1; } } @keyframes auroraSweep { 0% { transform: translateX(-30%) skewX(-15deg); opacity: 0; } 30% { opacity: 1; } 70% { opacity: 1; } 100% { transform: translateX(280%) skewX(-15deg); opacity: 0; } } @keyframes cardFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6rpx); } }

.tap-active { transform: scale(0.98); opacity: 0.92; }

/* ═══════ Mineradio Cinematic Upgrades ═══════ */

/* 环境粒子系统 */
.particle-field { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 2; }
.particle { position: absolute; width: 3rpx; height: 3rpx; background: var(--ming-particle-color, rgba(203,195,220,.35)); border-radius: 50%; animation: particleDrift linear infinite; }
.particle:nth-child(1)  { left: 8%;  width: 2rpx; height: 2rpx; animation-duration: 14s; animation-delay: 0s; }
.particle:nth-child(2)  { left: 22%; width: 3rpx; height: 3rpx; animation-duration: 18s; animation-delay: 3s; }
.particle:nth-child(3)  { left: 35%; width: 2rpx; height: 2rpx; animation-duration: 12s; animation-delay: 1s; }
.particle:nth-child(4)  { left: 48%; width: 4rpx; height: 4rpx; animation-duration: 20s; animation-delay: 5s; }
.particle:nth-child(5)  { left: 62%; width: 2rpx; height: 2rpx; animation-duration: 16s; animation-delay: 2s; }
.particle:nth-child(6)  { left: 75%; width: 3rpx; height: 3rpx; animation-duration: 15s; animation-delay: 4s; }
.particle:nth-child(7)  { left: 88%; width: 2rpx; height: 2rpx; animation-duration: 17s; animation-delay: 6s; }
.particle:nth-child(8)  { left: 15%; width: 3rpx; height: 3rpx; animation-duration: 19s; animation-delay: 7s; }
.particle:nth-child(9)  { left: 42%; width: 2rpx; height: 2rpx; animation-duration: 13s; animation-delay: 8s; }
.particle:nth-child(10) { left: 55%; width: 4rpx; height: 4rpx; animation-duration: 21s; animation-delay: 1.5s; }
.particle:nth-child(11) { left: 68%; width: 2rpx; height: 2rpx; animation-duration: 14s; animation-delay: 9s; }
.particle:nth-child(12) { left: 82%; width: 3rpx; height: 3rpx; animation-duration: 16s; animation-delay: 3.5s; }
@keyframes particleDrift { 0% { transform: translateY(100%) translateX(0); opacity: 0; } 10% { opacity: .6; } 90% { opacity: .6; } 100% { transform: translateY(-10%) translateX(30rpx); opacity: 0; } }

/* RGB 色差标题 */
.cinema-title { position: relative; }
.cinema-title::before,
.cinema-title::after { content: attr(data-text); position: absolute; left: 0; right: 0; top: 0; pointer-events: none; color: inherit; font: inherit; letter-spacing: inherit; }
.cinema-title::before { color: var(--ming-chromatic-red, rgba(255,80,80,.12)); transform: translateX(-1.5rpx); clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%); }
.cinema-title::after { color: var(--ming-chromatic-blue, rgba(80,80,255,.10)); transform: translateX(1.5rpx); clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%); }
</style>
