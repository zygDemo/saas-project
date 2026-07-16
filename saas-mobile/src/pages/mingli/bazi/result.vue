<template>
  <view :class="['page', themeClass]">
    <view class="hero">
      <mystic-sky />
      <mystic-nav title="八字命盘" action-text="星卷" transparent @action="goHistory" />
      <view v-if="result" class="hero-content">
        <text class="eyebrow">DESTINY SPECTRUM</text>
        <text class="date">{{ result.solarDate }}</text>
        <text v-if="params?.lunarInfo" class="lunar-info">{{ params.lunarInfo }}</text>
        <view class="day-master">
          <view class="halo halo-a" /><view class="halo halo-b" />
          <text class="master-label">日主</text><text class="master-char">{{ result.riZhu }}</text><text class="master-element">{{ result.riZhuWuXing }}命</text>
        </view>
        <text class="hero-summary">{{ summaryText }}</text>
      </view>
    </view>

    <view v-if="result" class="theme-panel enter enter-3">
      <view class="theme-panel__head">
        <text class="theme-panel__title">主题切换</text>
        <text class="theme-panel__current">{{ themeLabel }}</text>
      </view>
      <view class="theme-seg">
        <view v-for="item in themeOptions" :key="item.value" class="theme-seg__item" :class="{ active: themeMode === item.value }" hover-class="tap-active" @tap="setTheme(item.value as MingliThemeMode)">
          <text>{{ item.label }}</text>
        </view>
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
      <button class="again-btn" hover-class="tap-active" @tap="again">重新排盘</button>
      <text class="disclaimer">传统文化推演结果仅供参考，请理性看待</text>
    </view>

    <view v-else class="empty"><text>星盘未能展开</text><button @tap="again">重新录入</button></view>
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
import { useMingliTheme, type MingliThemeMode } from '../theme'

interface BaZiParams { birthDate: string; birthHour: number; gender: 'male' | 'female'; isLunar: boolean; timeLabel: string; lunarInfo?: string }
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
const { themeClass, themeMode, themeLabel, themeOptions, setTheme } = useMingliTheme()

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
    timeLabel: decodeURIComponent(String(options?.timeLabel || '时辰不详')),
    lunarInfo: decodeURIComponent(String(options?.lunarInfo || '')),
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
.page{min-height:100vh;background:var(--ming-paper);color:#172747}.hero{position:relative;min-height:650rpx;overflow:hidden;background:var(--ming-gradient-hero)}.hero-content{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:22rpx}.eyebrow{color:var(--ming-text-purple-soft);font:18rpx Georgia,serif;letter-spacing:7rpx}.date{margin-top:10rpx;color:var(--ming-text-purple-soft);font-size:24rpx;letter-spacing:2rpx}.lunar-info{margin-top:6rpx;color:var(--ming-purple-soft);font:20rpx STKaiti,serif;letter-spacing:2rpx}.day-master{position:relative;width:260rpx;height:260rpx;margin-top:28rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1rpx solid var(--ming-border-purple);border-radius:50%;box-shadow:0 0 45rpx var(--ming-shadow-purple),inset 0 0 40rpx var(--ming-purple-faint);animation:masterPulse 4s ease-in-out infinite}.halo{position:absolute;border:1rpx solid var(--ming-purple-faint);border-radius:50%;animation:spin 20s linear infinite}.halo-a{inset:-28rpx;border-style:dashed}.halo-b{inset:22rpx;animation-direction:reverse;animation-duration:14s}.master-label,.master-element{color:var(--ming-text-purple-soft);font-size:21rpx;letter-spacing:3rpx}.master-char{color:var(--ming-text-purple);font:700 98rpx STKaiti,serif;line-height:1;text-shadow:0 0 32rpx var(--ming-purple-soft);animation:charGlow 3s ease-in-out infinite}.hero-summary{margin-top:32rpx;color:var(--ming-text-purple);font:26rpx STKaiti,serif;letter-spacing:3rpx}.theme-panel { margin: -18rpx 6rpx 24rpx; padding: 24rpx 24rpx 22rpx; border-radius: 28rpx; background: linear-gradient(180deg, rgba(18, 19, 48, .92), rgba(30, 24, 63, .88)); border: 1rpx solid rgba(143, 99, 247, .16); box-shadow: 0 16rpx 34rpx rgba(25, 19, 65, .12), inset 0 0 0 1rpx rgba(255,255,255,.03); }
.theme-panel__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.theme-panel__title { font: 700 28rpx STKaiti, serif; letter-spacing: 4rpx; color: var(--ming-text-purple); }
.theme-panel__current { color: rgba(247,244,255,.68); font-size: 22rpx; }
.theme-seg { display: flex; gap: 12rpx; }
.theme-seg__item { flex: 1; height: 72rpx; display: flex; align-items: center; justify-content: center; border-radius: 18rpx; color: rgba(247,244,255,.74); background: rgba(255,255,255,.04); border: 1rpx solid rgba(227,220,255,.08); font-size: 23rpx; }
.theme-seg__item.active { color: #fff; background: linear-gradient(135deg, rgba(168,148,255,.18), rgba(111,83,247,.84)); border-color: rgba(178,159,255,.20); box-shadow: 0 10rpx 22rpx rgba(111, 83, 247, .16); }.paper-body{position:relative;margin-top:12rpx;padding:46rpx 26rpx calc(50rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:linear-gradient(135deg,rgba(101,72,30,.035) 25%,transparent 25%) 0 0/18rpx 18rpx,var(--ming-paper)}.section-title{display:flex;align-items:center;justify-content:center;gap:20rpx;color:#9f7730;text-align:center}.section-title view,.card-heading view{display:flex;flex-direction:column}.title-main{color:#1b2d4d;font:700 39rpx STKaiti,serif;letter-spacing:5rpx}.title-sub,.card-subtitle{margin-top:3rpx;color:#8b7b60;font-size:19rpx;letter-spacing:3rpx}
.pillars-card{margin-top:28rpx;padding:30rpx 16rpx;display:flex;border:1rpx solid rgba(163,120,43,.5);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(251,245,228,.88),rgba(240,229,200,.78));box-shadow:0 14rpx 34rpx rgba(65,46,18,.1),inset 0 0 0 4rpx rgba(255,255,255,.22)}.pillar{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;border-right:1rpx solid rgba(146,110,48,.16)}.pillar:last-child{border-right:0}.pillar.master::before{content:'';position:absolute;inset:-14rpx 6rpx;border:1rpx solid var(--ming-border-purple);border-radius:14rpx;background:var(--ming-purple-faint);box-shadow:0 0 16rpx var(--ming-purple-faint)}.pillar-label,.ten-god,.stem,.branch,.nayin{position:relative;z-index:1}.pillar-label{color:#6b604a;font-size:22rpx;letter-spacing:1rpx}.ten-god{margin-top:14rpx;color:#9c7938;font-size:22rpx;font-weight:600}.stem,.branch{font:700 60rpx STKaiti,serif;line-height:1.15;text-shadow:0 2rpx 3rpx rgba(0,0,0,.1)}.nayin{margin-top:14rpx;color:#7a6d56;font-size:19rpx;writing-mode:vertical-rl;letter-spacing:3rpx}
.spectrum-card,.fortune-card{margin-top:28rpx;padding:32rpx;border:1rpx solid rgba(158,117,42,.4);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(250,243,224,.82),rgba(242,231,202,.72));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09),inset 0 0 0 4rpx rgba(255,255,255,.18)}.card-heading{display:flex;justify-content:space-between;align-items:center}.card-title{color:#1d3050;font:700 33rpx STKaiti,serif;letter-spacing:3rpx}.card-mark{width:58rpx;height:58rpx;line-height:58rpx;text-align:center;border:1rpx solid rgba(160,116,39,.45);border-radius:50%;color:#9f762d;font:22rpx/58rpx STKaiti,serif;background:rgba(255,250,235,.5)}.element-chart{margin-top:28rpx}.element-row{display:flex;align-items:center;margin:18rpx 0}.element-name{width:90rpx;display:flex;align-items:center;gap:10rpx;font:700 27rpx STKaiti,serif}.element-dot{width:14rpx;height:14rpx;border-radius:50%;box-shadow:0 0 14rpx currentColor}.bar-track{flex:1;height:22rpx;overflow:hidden;border-radius:11rpx;background:rgba(42,52,64,.12);box-shadow:inset 0 2rpx 4rpx rgba(42,52,64,.1)}.bar-fill{position:relative;height:100%;border-radius:11rpx;animation:grow 1s ease both;box-shadow:0 0 12rpx rgba(255,255,255,.2);overflow:hidden}.bar-fill::after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.4) 50%,transparent 100%);animation:barShine 3.5s ease-in-out infinite}.bar-glow{position:absolute;right:0;top:0;width:24rpx;height:100%;background:#fff;opacity:.4;box-shadow:0 0 12rpx 6rpx rgba(255,255,255,.4)}.element-count{width:42rpx;text-align:right;color:#5e5644;font-size:24rpx;font-weight:700}.spectrum-note{margin-top:26rpx;padding-top:20rpx;border-top:1rpx solid rgba(145,105,39,.18);display:flex;justify-content:space-between;color:#6e6353;font-size:22rpx}
.fortune-scroll{margin-top:26rpx;white-space:nowrap;position:relative}.fortune-scroll::after{content:'滑动查看更多 →';position:absolute;right:0;bottom:-32rpx;color:#a89060;font-size:18rpx;opacity:.6}.fortune-list{display:inline-flex;gap:18rpx;padding:8rpx 4rpx}.fortune-item{width:112rpx;padding:20rpx 8rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid rgba(151,111,44,.25);border-radius:14rpx;background:rgba(255,251,238,.55);transition:.2s}.fortune-item.current{border-color:var(--ming-purple-strong);box-shadow:0 0 0 4rpx var(--ming-purple-faint),0 6rpx 16rpx var(--ming-purple-faint);background:var(--ming-purple-faint);animation:fortuneGlow 2s ease-in-out infinite}.fortune-age{color:#7e705a;font-size:20rpx;font-weight:600}.fortune-gz{margin:13rpx 0;font:700 36rpx STKaiti,serif;letter-spacing:4rpx}.fortune-god{color:#9b7535;font-size:21rpx}.insight-card{margin-top:30rpx;padding:30rpx;display:flex;gap:18rpx;border-top:1rpx solid rgba(154,112,40,.32);border-bottom:1rpx solid rgba(154,112,40,.32)}.insight-star{color:#a77a2d;font-size:42rpx}.insight-title,.insight-text{display:block}.insight-title{font:700 30rpx STKaiti,serif;color:#2a3a55}.insight-text{margin-top:8rpx;color:#6e6353;font-size:22rpx;line-height:1.65}.again-btn{margin-top:32rpx;height:92rpx;border:0;border-radius:46rpx;color:var(--ming-text-purple);background:var(--ming-gradient-btn-soft);box-shadow:0 12rpx 26rpx var(--ming-purple-faint),inset 0 0 0 2rpx var(--ming-border-purple);font:700 29rpx STKaiti,serif;letter-spacing:4rpx}.again-btn::after{border:0}.again-btn:active{transform:translateY(2rpx)}.disclaimer{display:block;margin-top:26rpx;text-align:center;color:#8a7b63;font-size:19rpx}.empty{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:30rpx;color:#786b54}.empty button{font-size:24rpx}
@keyframes spin{to{transform:rotate(360deg)}}@keyframes grow{from{width:0}}@keyframes charGlow{0%,100%{text-shadow:0 0 32rpx var(--ming-purple-soft)}50%{text-shadow:0 0 50rpx var(--ming-purple),0 0 90rpx var(--ming-purple-faint)}}@keyframes masterPulse{0%,100%{box-shadow:0 0 45rpx var(--ming-shadow-purple),inset 0 0 40rpx var(--ming-purple-faint)}50%{box-shadow:0 0 75rpx var(--ming-shadow-glow),inset 0 0 50rpx var(--ming-purple-soft)}}@keyframes barShine{0%{transform:translateX(-100%)}50%{transform:translateX(100%)}100%{transform:translateX(100%)}}@keyframes fortuneGlow{0%,100%{box-shadow:0 0 0 4rpx var(--ming-purple-faint),0 6rpx 16rpx var(--ming-purple-faint)}50%{box-shadow:0 0 0 4rpx var(--ming-purple-soft),0 6rpx 24rpx var(--ming-shadow-glow)}}

.tap-active { transform: scale(0.98); opacity: 0.92; }
@media (prefers-reduced-motion: reduce){.halo,.day-master,.bar-fill,.fortune-item.current,.theme-seg__item.active{animation:none!important}}
</style>
