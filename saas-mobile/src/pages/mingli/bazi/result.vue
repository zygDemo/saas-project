<template>
  <view class="page">
    <view class="hero">
      <mystic-sky />
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

      <view v-if="result.cangGan?.length" class="canggan-card">
        <view class="card-heading"><view><text class="card-title">地支藏干</text><text class="card-subtitle">地支中暗藏的天干</text></view><text class="card-mark">藏</text></view>
        <view class="canggan-grid">
          <view v-for="(item, index) in result.cangGan" :key="index" class="canggan-item">
            <text class="canggan-zhi">{{ item.zhi }}</text>
            <view class="canggan-gans">
              <text v-for="(gan, i) in item.gan" :key="i" class="canggan-gan" :style="{ color: wuxingColor[item.wuXing[i]] }">{{ gan }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="result.shenSha?.length" class="shensha-card">
        <view class="card-heading"><view><text class="card-title">神煞</text><text class="card-subtitle">命中的吉神凶煞</text></view><text class="card-mark">煞</text></view>
        <view class="shensha-list">
          <view v-for="(item, index) in result.shenSha" :key="index" class="shensha-item">
            <text class="shensha-name">{{ item.name }}</text>
            <text class="shensha-desc">{{ item.description }}</text>
            <text class="shensha-pos">{{ item.position }}</text>
          </view>
        </view>
      </view>

      <view v-if="result.shiShenDetail" class="shishen-card">
        <view class="card-heading"><view><text class="card-title">十神详解</text><text class="card-subtitle">日主{{ result.riZhu }}的{{ result.shiShenDetail.shiShen }}</text></view><text class="card-mark">神</text></view>
        <view class="shishen-grid">
          <view class="shishen-item"><text class="shishen-label">性格</text><text class="shishen-text">{{ result.shiShenDetail.personality }}</text></view>
          <view class="shishen-item"><text class="shishen-label">事业</text><text class="shishen-text">{{ result.shiShenDetail.career }}</text></view>
          <view class="shishen-item"><text class="shishen-label">财运</text><text class="shishen-text">{{ result.shiShenDetail.wealth }}</text></view>
          <view class="shishen-item"><text class="shishen-label">感情</text><text class="shishen-text">{{ result.shiShenDetail.love }}</text></view>
          <view class="shishen-item"><text class="shishen-label">健康</text><text class="shishen-text">{{ result.shiShenDetail.health }}</text></view>
        </view>
      </view>

      <view v-if="result.liuNian" class="liunian-card">
        <view class="card-heading"><view><text class="card-title">{{ result.liuNian.year }}年运势</text><text class="card-subtitle">{{ result.liuNian.ganZhi }}年</text></view><text class="card-mark">年</text></view>
        <view class="liunian-content">
          <view class="liunian-ganzhi">
            <text class="liunian-gan" :style="{ color: wuxingColor[result.liuNian.ganWuXing] }">{{ result.liuNian.ganZhi[0] }}</text>
            <text class="liunian-zhi" :style="{ color: wuxingColor[result.liuNian.zhiWuXing] }">{{ result.liuNian.ganZhi[1] }}</text>
          </view>
          <view class="liunian-info">
            <text class="liunian-yunshi">{{ result.liuNian.yunshi }}</text>
            <text class="liunian-jianyi">{{ result.liuNian.jianyi }}</text>
          </view>
        </view>
      </view>

      <view class="insight-card">
        <text class="insight-star">✧</text><view><text class="insight-title">命盘寄语</text><text class="insight-text">五行不是好坏的评分，而是理解自身节奏的一张光谱。看见强弱，方能更从容地调整方向。</text></view>
      </view>
      <button class="again-btn" hover-class="tap-active" aria-label="重新排盘" @tap="again">重新排盘</button>
      <text class="disclaimer">传统文化推演结果仅供参考，请理性看待</text>
    </view>

    <view v-else class="empty"><text>星盘未能展开</text><button @tap="again">重新录入</button></view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { APP_ROUTES } from '@/common/navigation'
import { paiPan, WUXING_COLOR, type BaZiResult, type WuXing, type Zhu } from '@/common/mingli/bazi'
import { getMingliHistory, getMingliRecord, saveMingliRecord } from '@/common/mingli/history'
import { getBaziState, clearBaziState } from '@/common/mingli/state'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'

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

const historyCount = ref(0)

onShow(() => {
  historyCount.value = getMingliHistory().length
})
const goHome = () => uni.reLaunch({ url: APP_ROUTES.portal.home })
function goBack() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: APP_ROUTES.portal.home })
}

onLoad((options) => {
  const historyId = String(options?.historyId || '')
  if (historyId) {
    const record = getMingliRecord(historyId)
    if (record?.type === 'bazi') build(record.data as unknown as BaZiParams, false)
    return
  }

  // 优先从内存状态读取完整结果对象，避免 URL query 长度限制和重复计算
  const state = getBaziState()
  if (state) {
    params.value = {
      birthDate: state.birthDate,
      birthHour: state.birthHour,
      gender: state.gender,
      isLunar: state.isLunar,
      timeLabel: state.timeLabel,
      lunarInfo: state.lunarInfo,
    }
    result.value = state.result
    saveResult()
    clearBaziState()
    return
  }

  // fallback：从 URL query 重新计算（支持刷新或直接分享链接）
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
  if (shouldSave) saveResult()
}

function saveResult() {
  if (!result.value || !params.value) return
  saveMingliRecord({
    type: 'bazi', title: `${result.value.siZhu.day.gan}${result.value.siZhu.day.zhi}日主命盘`,
    subtitle: `${params.value.birthDate} · ${params.value.timeLabel} · ${params.value.gender === 'male' ? '男命' : '女命'}`,
    data: { ...params.value }
  })
}
function again() { uni.redirectTo({ url: APP_ROUTES.mingli.bazi.input }) }
function goHistory() { uni.navigateTo({ url: APP_ROUTES.mingli.history }) }
</script>

<style scoped lang="scss">
.page{min-height:100vh;background:var(--ming-bg-deep);color:var(--ming-text-primary)}
.topbar { position: fixed; top: 30rpx; left: 0; right: 0; z-index: 40; padding: calc(var(--status-bar-height) + 14rpx) 24rpx 12rpx; display: flex; justify-content: flex-start; align-items: center; pointer-events: none; }
.capsule { pointer-events: auto; height: 64rpx; display: flex; align-items: center; border: 1rpx solid var(--ming-border-purple); border-radius: 32rpx; background: rgba(255,255,255,.08); overflow: hidden; box-shadow: inset 0 1rpx 0 rgba(255,255,255,.05); }
.capsule-left { width: 70rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); font-size: 58rpx; line-height: 1; }
.capsule-left text { transform: translateY(-2rpx); }
.capsule-mid { width: 70rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); }
.capsule-mid .home-icon { font-size: 38rpx; line-height: 1; }
.capsule-divider { width: 1rpx; height: 36rpx; background: rgba(255,255,255,.16); }
.capsule-right { min-width: 70rpx; height: 64rpx; padding: 0 18rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); font-size: 24rpx; }
.capsule-right text { margin-left: 12rpx; }
.capsule-right text:first-child { margin-left: 0; }
.history-count { min-width: 30rpx; height: 30rpx; line-height: 30rpx; border-radius: 50%; text-align: center; color: var(--ming-bg-deep); background: var(--ming-cyan); font-size: 20rpx; box-shadow: 0 0 10rpx var(--ming-cyan-soft); }
.hero{position:relative;min-height:710rpx;overflow:hidden;background:var(--ming-gradient-hero)}.hero-content{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:calc(var(--status-bar-height) + 110rpx)}.eyebrow{color:var(--ming-text-purple-soft);font:18rpx Georgia,serif;letter-spacing:7rpx;text-shadow:0 0 10rpx rgba(79,195,247,.3)}.date{margin-top:10rpx;color:var(--ming-text-primary);font-size:24rpx;letter-spacing:2rpx;text-shadow:0 0 8rpx rgba(79,195,247,.22)}.lunar-info{margin-top:6rpx;color:var(--ming-cyan);font:20rpx STKaiti,serif;letter-spacing:2rpx}.day-master{position:relative;width:260rpx;height:260rpx;margin-top:28rpx;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1rpx solid var(--ming-border-purple);border-radius:50%;box-shadow:0 0 45rpx var(--ming-shadow-purple),inset 0 0 40rpx var(--ming-purple-faint);animation:masterPulse 4s ease-in-out infinite}.halo{position:absolute;border:1rpx solid var(--ming-purple-faint);border-radius:50%;animation:spin 20s linear infinite}.halo-a{inset:-28rpx;border-style:dashed}.halo-b{inset:22rpx;animation-direction:reverse;animation-duration:14s}.master-label,.master-element{color:var(--ming-text-primary);font-size:21rpx;letter-spacing:3rpx;text-shadow:0 0 8rpx rgba(79,195,247,.2)}.master-char{color:var(--ming-text-purple);font:700 98rpx STKaiti,serif;line-height:1;text-shadow:0 0 32rpx var(--ming-purple-soft);animation:charGlow 3s ease-in-out infinite}.hero-summary{margin-top:32rpx;color:var(--ming-text-primary);font:26rpx STKaiti,serif;letter-spacing:3rpx;text-shadow:0 0 8rpx rgba(79,195,247,.2)}
.paper-body{position:relative;margin-top:12rpx;padding:46rpx 26rpx calc(50rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:radial-gradient(circle at 50% 0,rgba(22,36,73,.55) 0,transparent 60%),var(--ming-bg-deep)}.section-title{display:flex;align-items:center;justify-content:center;gap:20rpx;color:var(--ming-cyan);text-align:center}.section-title view,.card-heading view{display:flex;flex-direction:column}.title-main{color:var(--ming-text-primary);font:700 39rpx STKaiti,serif;letter-spacing:5rpx}.title-sub,.card-subtitle{margin-top:3rpx;color:var(--ming-text-primary);font-size:19rpx;letter-spacing:3rpx;text-shadow:0 0 6rpx rgba(79,195,247,.18)}
.pillars-card{margin-top:28rpx;padding:30rpx 16rpx;display:flex;border:1rpx solid rgba(79,195,247,.28);border-radius:24rpx 8rpx;background:linear-gradient(135deg,rgba(16,28,56,.86),rgba(10,18,38,.92));box-shadow:0 14rpx 34rpx rgba(0,0,0,.18),inset 0 0 0 1rpx rgba(255,255,255,.05)}.pillar{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;border-right:1rpx solid rgba(79,195,247,.14)}.pillar:last-child{border-right:0}.pillar.master::before{content:'';position:absolute;inset:-14rpx 6rpx;border:1rpx solid var(--ming-border-purple);border-radius:14rpx;background:var(--ming-purple-faint);box-shadow:0 0 16rpx var(--ming-purple-faint)}.pillar-label,.ten-god,.stem,.branch,.nayin{position:relative;z-index:1}.pillar-label{color:var(--ming-text-purple-soft);font-size:22rpx;letter-spacing:1rpx}.ten-god{margin-top:14rpx;color:var(--ming-violet-light);font-size:22rpx;font-weight:600}.stem,.branch{font:700 60rpx STKaiti,serif;line-height:1.15;text-shadow:0 2rpx 3rpx rgba(0,0,0,.1)}.nayin{margin-top:14rpx;color:var(--ming-text-primary);font-size:19rpx;writing-mode:vertical-rl;letter-spacing:3rpx;text-shadow:0 0 6rpx rgba(79,195,247,.18)}
.spectrum-card,.fortune-card,.canggan-card,.shensha-card,.shishen-card,.liunian-card{margin-top:28rpx;padding:32rpx;border:1rpx solid rgba(79,195,247,.28);border-radius:24rpx 8rpx;background:linear-gradient(135deg,rgba(16,28,56,.86),rgba(10,18,38,.92));box-shadow:0 14rpx 34rpx rgba(0,0,0,.18),inset 0 0 0 1rpx rgba(255,255,255,.05)}.card-heading{display:flex;justify-content:space-between;align-items:center}.card-title{color:var(--ming-text-primary);font:700 33rpx STKaiti,serif;letter-spacing:3rpx}.card-mark{width:58rpx;height:58rpx;line-height:58rpx;text-align:center;border:1rpx solid var(--ming-border-gold);border-radius:50%;color:var(--ming-violet-light);font:22rpx/58rpx STKaiti,serif;background:rgba(124,92,255,.12);box-shadow:0 0 16rpx rgba(124,92,255,.18)}.element-chart{margin-top:28rpx}.element-row{display:flex;align-items:center;margin:18rpx 0}.element-name{width:90rpx;display:flex;align-items:center;gap:10rpx;font:700 27rpx STKaiti,serif}.element-dot{width:14rpx;height:14rpx;border-radius:50%;box-shadow:0 0 14rpx currentColor}.bar-track{flex:1;height:22rpx;overflow:hidden;border-radius:11rpx;background:rgba(79,195,247,.12);box-shadow:inset 0 2rpx 4rpx rgba(0,0,0,.2)}.bar-fill{position:relative;height:100%;border-radius:11rpx;animation:grow 1s ease both;box-shadow:0 0 12rpx rgba(79,195,247,.2);overflow:hidden}.bar-fill::after{content:'';position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.4) 50%,transparent 100%);animation:barShine 3.5s ease-in-out infinite}.bar-glow{position:absolute;right:0;top:0;width:24rpx;height:100%;background:#fff;opacity:.4;box-shadow:0 0 12rpx 6rpx rgba(79,195,247,.35)}.element-count{width:42rpx;text-align:right;color:var(--ming-text-primary);font-size:24rpx;font-weight:700}.spectrum-note{margin-top:26rpx;padding-top:20rpx;border-top:1rpx solid rgba(79,195,247,.14);display:flex;justify-content:space-between;color:var(--ming-text-primary);font-size:22rpx;text-shadow:0 0 6rpx rgba(79,195,247,.18)}
.fortune-scroll{margin-top:26rpx;white-space:nowrap;position:relative}.fortune-scroll::after{content:'滑动查看更多 →';position:absolute;right:0;bottom:-32rpx;color:var(--ming-text-purple-soft);font-size:18rpx;opacity:.8}.fortune-list{display:inline-flex;gap:18rpx;padding:8rpx 4rpx}.fortune-item{width:112rpx;padding:20rpx 8rpx;display:flex;flex-direction:column;align-items:center;border:1rpx solid rgba(79,195,247,.18);border-radius:14rpx;background:rgba(10,16,34,.55);transition:.2s}.fortune-item.current{border-color:var(--ming-cyan);box-shadow:0 0 0 4rpx rgba(79,195,247,.1),0 6rpx 16rpx rgba(79,195,247,.12);background:rgba(41,182,246,.12);animation:fortuneGlow 2s ease-in-out infinite}.fortune-age{color:var(--ming-text-primary);font-size:20rpx;font-weight:600;text-shadow:0 0 6rpx rgba(79,195,247,.18)}.fortune-gz{margin:13rpx 0;font:700 36rpx STKaiti,serif;letter-spacing:4rpx}.fortune-god{color:var(--ming-cyan);font-size:21rpx}.insight-card{margin-top:30rpx;padding:30rpx;display:flex;gap:18rpx;border:1rpx solid rgba(79,195,247,.18);border-radius:24rpx;background:linear-gradient(135deg,rgba(16,28,56,.6),rgba(10,18,38,.72));box-shadow:0 14rpx 34rpx rgba(0,0,0,.12),inset 0 0 0 1rpx rgba(255,255,255,.05)}.insight-star{color:var(--ming-cyan);font-size:42rpx;text-shadow:0 0 14rpx var(--ming-cyan-soft)}.insight-title,.insight-text{display:block}.insight-title{font:700 30rpx STKaiti,serif;color:var(--ming-text-primary)}.insight-text{margin-top:8rpx;color:var(--ming-text-primary);font-size:22rpx;line-height:1.65;text-shadow:0 0 6rpx rgba(79,195,247,.18)}.again-btn{margin-top:32rpx;height:92rpx;border:0;border-radius:46rpx;color:var(--ming-text-primary);background:var(--ming-gradient-btn);box-shadow:0 12rpx 26rpx rgba(41,182,246,.22),inset 0 0 0 1rpx rgba(255,255,255,.1);font:700 29rpx STKaiti,serif;letter-spacing:4rpx;display:flex;align-items:center;justify-content:center;line-height:1}.again-btn::after{display:none;border:0}.again-btn:active{transform:translateY(2rpx)}.disclaimer{display:block;margin-top:26rpx;text-align:center;color:var(--ming-text-purple-soft);font-size:19rpx}.empty{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:30rpx;color:var(--ming-text-primary)}.empty button{font-size:24rpx;display:flex;align-items:center;justify-content:center;height:78rpx;border-radius:40rpx;line-height:1;color:var(--ming-text-primary);background:var(--ming-gradient-btn);box-shadow:0 8rpx 20rpx rgba(41,182,246,.22)}
.canggan-grid{display:flex;justify-content:space-around;margin-top:24rpx;padding:8rpx 0}.canggan-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:14rpx;border-right:1rpx solid rgba(79,195,247,.12)}.canggan-item:last-child{border-right:0}.canggan-zhi{font:700 40rpx STKaiti,serif;color:var(--ming-text-primary);text-shadow:0 2rpx 4rpx rgba(0,0,0,.1)}.canggan-gans{display:flex;gap:10rpx}.canggan-gan{font:600 24rpx STKaiti,serif;padding:4rpx 12rpx;border-radius:8rpx;background:rgba(79,195,247,.08)}
.shensha-list{display:flex;flex-direction:column;gap:18rpx;margin-top:24rpx}.shensha-item{display:flex;align-items:center;padding:20rpx 24rpx;border-radius:18rpx;background:linear-gradient(135deg,rgba(16,28,56,.7),rgba(10,18,38,.5));border:1rpx solid rgba(79,195,247,.12);transition:all .3s}.shensha-name{min-width:150rpx;padding:8rpx 20rpx;border-radius:24rpx;font:700 24rpx STKaiti,serif;color:var(--ming-text-primary);text-align:center;background:linear-gradient(135deg,#1a6fff,#29b6f6)}.shensha-desc{flex:1;margin:0 20rpx;color:var(--ming-text-primary);font-size:24rpx;line-height:1.6;text-shadow:0 0 6rpx rgba(79,195,247,.18)}.shensha-pos{padding:6rpx 16rpx;border-radius:12rpx;color:var(--ming-cyan);font-size:20rpx;background:rgba(79,195,247,.1)}
.shishen-grid{display:flex;flex-direction:column;gap:24rpx;margin-top:24rpx}.shishen-item{display:flex;gap:20rpx;padding:20rpx;border-radius:16rpx;background:rgba(79,195,247,.08);border-left:4rpx solid var(--ming-cyan)}.shishen-label{width:70rpx;color:var(--ming-cyan);font:700 26rpx STKaiti,serif;flex-shrink:0;padding-top:2rpx}.shishen-text{flex:1;color:var(--ming-text-primary);font-size:25rpx;line-height:1.75;text-shadow:0 0 6rpx rgba(79,195,247,.18)}
.liunian-content{display:flex;align-items:center;gap:32rpx;margin-top:28rpx;padding:24rpx;border-radius:20rpx;background:rgba(79,195,247,.08)}.liunian-ganzhi{display:flex;gap:16rpx;padding:16rpx 24rpx;border-radius:16rpx;background:rgba(10,16,34,.5)}.liunian-gan,.liunian-zhi{font:700 60rpx STKaiti,serif;color:var(--ming-text-primary)}.liunian-info{flex:1}.liunian-yunshi{display:block;font:700 28rpx STKaiti,serif;color:var(--ming-text-primary);letter-spacing:2rpx}.liunian-jianyi{display:block;margin-top:14rpx;padding:16rpx 20rpx;border-radius:12rpx;color:var(--ming-text-primary);font-size:24rpx;line-height:1.7;background:rgba(79,195,247,.06);text-shadow:0 0 6rpx rgba(79,195,247,.18)}
@keyframes spin{to{transform:rotate(360deg)}}@keyframes grow{from{width:0}}@keyframes charGlow{0%,100%{text-shadow:0 0 32rpx var(--ming-purple-soft)}50%{text-shadow:0 0 50rpx var(--ming-purple),0 0 90rpx var(--ming-purple-faint)}}@keyframes masterPulse{0%,100%{box-shadow:0 0 45rpx var(--ming-shadow-purple),inset 0 0 40rpx var(--ming-purple-faint)}50%{box-shadow:0 0 75rpx var(--ming-shadow-glow),inset 0 0 50rpx var(--ming-purple-soft)}}@keyframes barShine{0%{transform:translateX(-100%)}50%{transform:translateX(100%)}100%{transform:translateX(100%)}}@keyframes fortuneGlow{0%,100%{box-shadow:0 0 0 4rpx rgba(79,195,247,.1),0 6rpx 16rpx rgba(79,195,247,.12)}50%{box-shadow:0 0 0 4rpx rgba(79,195,247,.2),0 6rpx 24rpx rgba(79,195,247,.2)}}

.tap-active { transform: scale(0.98); opacity: 0.92; }
</style>
