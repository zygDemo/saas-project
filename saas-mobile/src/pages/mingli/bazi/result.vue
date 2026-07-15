<template>
  <view class="page">
    <view class="hero">
      <mystic-sky />
      <mystic-nav title="八字命盘" action-text="星卷" transparent @action="goHistory" />
      <view v-if="result" class="hero-content">
        <text class="eyebrow">DESTINY SPECTRUM</text>
        <text class="date">{{ result.solarDate }}</text>
        <view class="day-master">
          <view class="halo halo-a" /><view class="halo halo-b" />
          <text class="master-label">日主</text><text class="master-char">{{ result.riZhu }}</text><text class="master-element">{{ result.riZhuWuXing }}命</text>
        </view>
        <text class="hero-summary">{{ summaryText }}</text>
      </view>
    </view>

    <view v-if="result" class="paper-body">
      <view class="section-title"><text>✦</text><view><text class="title-main">四柱命盘</text><text class="title-sub">年 · 月 · 日 · 时</text></view><text>✦</text></view>
      <view class="pillars-card">
        <view v-for="(pillar, index) in pillars" :key="pillar.label" class="pillar" :class="{ master: index === 2 }">
          <text class="pillar-label">{{ pillar.label }}</text>
          <text class="ten-god">{{ pillar.value.shiShen }}</text>
          <text class="stem" :style="{ color: wuxingColor[pillar.value.ganWuXing] }">{{ pillar.value.gan }}</text>
          <text class="branch" :style="{ color: wuxingColor[pillar.value.zhiWuXing] }">{{ pillar.value.zhi }}</text>
          <text class="nayin">{{ pillar.value.naYin }}</text>
        </view>
      </view>

      <view class="spectrum-card">
        <view class="card-heading"><view><text class="card-title">五行光谱</text><text class="card-subtitle">八字中的能量比例</text></view><text class="card-mark">五行</text></view>
        <view class="element-chart">
          <view v-for="item in elementItems" :key="item.name" class="element-row">
            <view class="element-name" :style="{ color: item.color }"><text class="element-dot" :style="{ background: item.color }" />{{ item.name }}</view>
            <view class="bar-track"><view class="bar-fill" :style="{ width: `${item.percent}%`, background: item.gradient }"><view class="bar-glow" /></view></view>
            <text class="element-count">{{ item.count }}</text>
          </view>
        </view>
        <view class="spectrum-note"><text>能量最显：{{ strongestElement }}</text><text>相对偏弱：{{ weakestElement }}</text></view>
      </view>

      <view class="fortune-card">
        <view class="card-heading"><view><text class="card-title">大运流转</text><text class="card-subtitle">十年一步，顺势而观</text></view><text class="card-mark">运</text></view>
        <scroll-view scroll-x class="fortune-scroll" :show-scrollbar="false">
          <view class="fortune-list">
            <view v-for="(item, index) in result.daYun" :key="index" class="fortune-item" :class="{ current: index === 0 }">
              <text class="fortune-age">{{ item.startAge }}岁</text>
              <text class="fortune-gz"><text :style="{ color: wuxingColor[item.ganWuXing] }">{{ item.gan }}</text><text :style="{ color: wuxingColor[item.zhiWuXing] }">{{ item.zhi }}</text></text>
              <text class="fortune-god">{{ item.shiShen }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="insight-card">
        <text class="insight-star">✧</text><view><text class="insight-title">命盘寄语</text><text class="insight-text">五行不是好坏的评分，而是理解自身节奏的一张光谱。看见强弱，方能更从容地调整方向。</text></view>
      </view>
      <button class="again-btn" @click="again">重新排盘</button>
      <text class="disclaimer">传统文化推演结果仅供参考，请理性看待</text>
    </view>

    <view v-else class="empty"><text>星盘未能展开</text><button @click="again">重新录入</button></view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { APP_ROUTES } from '@/common/navigation'
import { paiPan, WUXING_COLOR, type BaZiResult, type WuXing, type Zhu } from '@/common/mingli/bazi'
import { getMingliRecord, saveMingliRecord } from '@/common/mingli/history'
import MysticNav from '@/components/mystic-nav/mystic-nav.vue'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'

interface BaZiParams { birthDate: string; birthHour: number; gender: 'male' | 'female'; isLunar: boolean; timeLabel: string }
const result = ref<BaZiResult | null>(null)
const params = ref<BaZiParams | null>(null)
const wuxingColor = WUXING_COLOR
const pillars = computed(() => {
  if (!result.value) return []
  const { siZhu } = result.value
  return [
    { label: '年柱', value: siZhu.year }, { label: '月柱', value: siZhu.month },
    { label: '日柱', value: siZhu.day }, { label: '时柱', value: siZhu.hour }
  ] as Array<{ label: string; value: Zhu }>
})
const elementItems = computed(() => {
  if (!result.value) return []
  return (Object.entries(result.value.wuXingCount) as Array<[WuXing, number]>).map(([name, count]) => ({
    name, count, percent: Math.max(8, count * 25), color: wuxingColor[name],
    gradient: `linear-gradient(90deg, ${wuxingColor[name]}88, ${wuxingColor[name]})`
  }))
})
const strongestElement = computed(() => [...elementItems.value].sort((a, b) => b.count - a.count)[0]?.name || '—')
const weakestElement = computed(() => [...elementItems.value].sort((a, b) => a.count - b.count)[0]?.name || '—')
const summaryText = computed(() => `${strongestElement.value}气较显 · ${weakestElement.value}气待养 · 顺势而行`)

onLoad((options) => {
  const historyId = String(options?.historyId || '')
  if (historyId) {
    const record = getMingliRecord(historyId)
    if (record?.type === 'bazi') build(record.data as unknown as BaZiParams, false)
    return
  }
  const birthDate = String(options?.birthDate || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return
  build({
    birthDate,
    birthHour: Number(options?.birthHour || 12),
    gender: options?.gender === 'female' ? 'female' : 'male',
    isLunar: options?.isLunar === '1',
    timeLabel: decodeURIComponent(String(options?.timeLabel || '时辰不详'))
  }, true)
})

function build(input: BaZiParams, shouldSave: boolean) {
  const [year, month, day] = input.birthDate.split('-').map(Number)
  if (![year, month, day, input.birthHour].every(Number.isFinite)) return
  params.value = input
  result.value = paiPan(year, month, day, input.birthHour, input.gender)
  if (shouldSave) {
    saveMingliRecord({
      type: 'bazi', title: `${result.value.siZhu.day.gan}${result.value.siZhu.day.zhi}日主命盘`,
      subtitle: `${input.birthDate} · ${input.timeLabel} · ${input.gender === 'male' ? '男命' : '女命'}`,
      data: { ...input }
    })
  }
}
function again() { uni.redirectTo({ url: APP_ROUTES.mingli.bazi.input }) }
function goHistory() { uni.navigateTo({ url: APP_ROUTES.mingli.history }) }
</script>

<style scoped lang="scss">
.page{min-height:100vh;background:#eee2c8;color:#172747}.hero{position:relative;min-height:650rpx;overflow:hidden;background:radial-gradient(circle at 50% 58%,#2c4b70,#102644 50%,#07152c 88%)}.hero-content{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:22rpx}.eyebrow{color:rgba(224,192,116,.55);font:18rpx Georgia,serif;letter-spacing:7rpx}.date{margin-top:10rpx;color:rgba(244,226,177,.76);font-size:24rpx;letter-spacing:2rpx}.day-master{position:relative;width:260rpx;height:260rpx;margin-top:28rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1rpx solid rgba(228,193,106,.54);border-radius:50%;box-shadow:0 0 45rpx rgba(222,181,80,.18),inset 0 0 40rpx rgba(217,177,84,.08)}.halo{position:absolute;border:1rpx solid rgba(226,190,100,.3);border-radius:50%;animation:spin 20s linear infinite}.halo-a{inset:-28rpx;border-style:dashed}.halo-b{inset:22rpx;animation-direction:reverse;animation-duration:14s}.master-label,.master-element{color:rgba(240,219,165,.66);font-size:21rpx;letter-spacing:3rpx}.master-char{color:#f1d78d;font:700 98rpx STKaiti,serif;line-height:1;text-shadow:0 0 32rpx rgba(236,195,98,.42)}.hero-summary{margin-top:32rpx;color:#eddba8;font:26rpx STKaiti,serif;letter-spacing:3rpx}.paper-body{position:relative;margin-top:-20rpx;padding:46rpx 26rpx calc(50rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:linear-gradient(135deg,rgba(101,72,30,.035) 25%,transparent 25%) 0 0/18rpx 18rpx,#eee2c8}.section-title{display:flex;align-items:center;justify-content:center;gap:20rpx;color:#9f7730;text-align:center}.section-title view,.card-heading view{display:flex;flex-direction:column}.title-main{color:#1b2d4d;font:700 39rpx STKaiti,serif;letter-spacing:5rpx}.title-sub,.card-subtitle{margin-top:3rpx;color:#8b7b60;font-size:19rpx;letter-spacing:3rpx}
.pillars-card{margin-top:26rpx;padding:25rpx 12rpx;display:flex;border:1rpx solid rgba(163,120,43,.5);border-radius:24rpx 8rpx;background:rgba(250,244,227,.78);box-shadow:0 12rpx 30rpx rgba(65,46,18,.09)}.pillar{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;border-right:1rpx solid rgba(146,110,48,.18)}.pillar:last-child{border-right:0}.pillar.master::before{content:'';position:absolute;inset:-12rpx 5rpx;border:1rpx solid rgba(173,128,43,.45);border-radius:12rpx;background:rgba(220,190,122,.08)}.pillar-label,.ten-god,.stem,.branch,.nayin{position:relative;z-index:1}.pillar-label{color:#71664f;font-size:20rpx}.ten-god{margin-top:12rpx;color:#9c7938;font-size:20rpx}.stem,.branch{font:700 56rpx STKaiti,serif;line-height:1.15;text-shadow:0 2rpx 2rpx rgba(0,0,0,.08)}.nayin{margin-top:12rpx;color:#786b54;font-size:18rpx;writing-mode:vertical-rl;letter-spacing:3rpx}
.spectrum-card,.fortune-card{margin-top:24rpx;padding:30rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:24rpx 8rpx;background:rgba(249,242,222,.72);box-shadow:0 12rpx 28rpx rgba(61,44,20,.08)}.card-heading{display:flex;justify-content:space-between;align-items:center}.card-title{color:#1d3050;font:700 32rpx STKaiti,serif;letter-spacing:3rpx}.card-mark{width:58rpx;height:58rpx;line-height:58rpx;text-align:center;border:1rpx solid rgba(160,116,39,.45);border-radius:50%;color:#9f762d;font:22rpx/58rpx STKaiti,serif}.element-chart{margin-top:26rpx}.element-row{display:flex;align-items:center;margin:15rpx 0}.element-name{width:85rpx;display:flex;align-items:center;gap:9rpx;font:700 25rpx STKaiti,serif}.element-dot{width:12rpx;height:12rpx;border-radius:50%;box-shadow:0 0 12rpx currentColor}.bar-track{flex:1;height:18rpx;overflow:hidden;border-radius:10rpx;background:rgba(42,52,64,.1)}.bar-fill{position:relative;height:100%;border-radius:10rpx;animation:grow 1s ease both}.bar-glow{position:absolute;right:0;top:0;width:20rpx;height:100%;background:#fff;opacity:.36;filter:blur(5rpx)}.element-count{width:38rpx;text-align:right;color:#6e644f;font-size:22rpx}.spectrum-note{margin-top:24rpx;padding-top:18rpx;border-top:1rpx solid rgba(145,105,39,.18);display:flex;justify-content:space-between;color:#77694f;font-size:21rpx}
.fortune-scroll{margin-top:24rpx;white-space:nowrap}.fortune-list{display:inline-flex;gap:16rpx;padding:6rpx}.fortune-item{width:108rpx;padding:18rpx 8rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid rgba(151,111,44,.25);border-radius:14rpx;background:rgba(255,251,238,.5)}.fortune-item.current{border-color:#a97d2f;box-shadow:0 0 0 4rpx rgba(169,125,47,.08)}.fortune-age{color:#82745d;font-size:19rpx}.fortune-gz{margin:12rpx 0;font:700 34rpx STKaiti,serif;letter-spacing:4rpx}.fortune-god{color:#9b7535;font-size:20rpx}.insight-card{margin-top:26rpx;padding:26rpx;display:flex;gap:18rpx;border-top:1rpx solid rgba(154,112,40,.32);border-bottom:1rpx solid rgba(154,112,40,.32)}.insight-star{color:#a77a2d;font-size:40rpx}.insight-title,.insight-text{display:block}.insight-title{font:700 28rpx STKaiti,serif}.insight-text{margin-top:7rpx;color:#756a56;font-size:21rpx;line-height:1.6}.again-btn{margin-top:28rpx;height:88rpx;border:1rpx solid #203555;border-radius:44rpx;color:#f1ddaa;background:#203555;font:700 28rpx STKaiti,serif;letter-spacing:4rpx}.again-btn::after{border:0}.disclaimer{display:block;margin-top:24rpx;text-align:center;color:#8a7b63;font-size:18rpx}.empty{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:30rpx;color:#786b54}.empty button{font-size:24rpx}
@keyframes spin{to{transform:rotate(360deg)}}@keyframes grow{from{width:0}}@media(prefers-reduced-motion:reduce){.halo,.bar-fill{animation:none}}
</style>
