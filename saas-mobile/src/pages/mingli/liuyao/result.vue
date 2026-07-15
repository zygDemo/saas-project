<template>
  <view class="page">
    <view class="hero">
      <mystic-sky />
      <mystic-nav title="六爻卦象" action-text="星卷" transparent @action="goHistory" />
      <view v-if="result" class="hero-content">
        <text class="eyebrow">THE HEXAGRAM REVEALS</text>
        <view class="gua-name-wrap"><text class="gua-name">{{ result.benGua.name }}</text><view class="gua-halo" /></view>
        <text class="gua-full">{{ result.benGua.fullName }}</text>
        <text class="gua-ci">“{{ result.benGua.guaCi }}”</text>
        <view v-if="result.bianGua" class="change-pill"><text>本卦</text><text class="change-arrow">流转 →</text><text>{{ result.bianGua.fullName }}</text></view>
        <view v-else class="change-pill"><text>静卦 · 守正观时</text></view>
      </view>
    </view>

    <view v-if="result" class="paper-body">
      <view class="question-banner"><text class="question-label">所问</text><text class="question-text">{{ result.question }}</text></view>
      <view class="section-title"><text>✦</text><view><text class="title-main">六爻成象</text><text class="title-sub">由上爻至初爻</text></view><text>✦</text></view>

      <view class="hexagram-card">
        <view class="hex-header"><text>六神</text><text>六亲</text><text class="hex-main">本卦</text><text>地支</text><text>变象</text></view>
        <view v-for="(yao, idx) in reversedYaoList" :key="yao.position" class="hex-row" :class="{ shi: yao.position === result.benGua.shiYao, ying: yao.position === result.benGua.yingYao, dong: yao.isDong }">
          <text class="small-col">{{ yao.liuShen }}</text>
          <text class="small-col">{{ yao.liuQin }}</text>
          <view class="line-col"><view class="yao-line" :class="{ broken: yao.yinYang === '阴' }" /><text v-if="yao.position === result.benGua.shiYao" class="marker">世</text><text v-if="yao.position === result.benGua.yingYao" class="marker">应</text></view>
          <text class="small-col branch">{{ yao.diZhi }}</text>
          <view class="change-col"><view v-if="yao.isDong" class="change-line" :class="{ broken: yao.bianYinYang === '阴' }" /><text v-else>·</text></view>
        </view>
        <view class="legend"><text><i class="dot dot-shi" />世爻</text><text><i class="dot dot-ying" />应爻</text><text><i class="dot dot-dong" />动爻</text></view>
      </view>

      <view class="yao-ci-card">
        <view class="card-heading"><view><text class="card-title">爻辞</text><text class="card-subtitle">逐爻解读</text></view><text class="seal">辞</text></view>
        <view v-for="(yao, idx) in reversedYaoList" :key="'ci-' + yao.position" class="yao-ci-row">
          <text class="ci-label">{{ yao.name }}</text>
          <view class="ci-content"><text class="ci-line" :class="{ dong: yao.isDong }">{{ getYaoCi(idx) }}</text><text v-if="yao.isDong" class="ci-dong-mark">动</text></view>
        </view>
      </view>

      <view class="reading-card">
        <view class="card-heading"><view><text class="card-title">卦意启示</text><text class="card-subtitle">观结构，也观变化</text></view><text class="seal">解</text></view>
        <view class="reading-lead"><text class="lead-mark">“</text><text>{{ readingLead }}</text></view>
        <view class="reading-grid">
          <view><text class="reading-label">当下之势</text><text class="reading-text">{{ currentReading }}</text></view>
          <view><text class="reading-label">变化之机</text><text class="reading-text">{{ changeReading }}</text></view>
        </view>
        <view class="focus-line"><text>宜</text><text>{{ adviceText }}</text></view>
      </view>

      <view class="meta-card"><view><text>起卦时间</text><text>{{ result.time }}</text></view><view><text>动爻</text><text>{{ dongYaoText }}</text></view><view><text>日辰</text><text>{{ result.riGanZhi }} · {{ result.riWuXing }}</text></view></view>
      <button class="again-btn" @click="again">再问一卦</button>
      <text class="disclaimer">卦象是观察当下的镜子，请结合现实信息独立判断</text>
    </view>
    <view v-else class="empty"><text>卦象未能展开</text><button @click="again">重新起卦</button></view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { APP_ROUTES } from '@/common/navigation'
import { liuYaoPaiPan, type LiuYaoResult } from '@/common/mingli/liuyao'
import { getMingliRecord, saveMingliRecord } from '@/common/mingli/history'
import MysticNav from '@/components/mystic-nav/mystic-nav.vue'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'

interface LiuYaoParams { values: number[]; question: string }
const result = ref<LiuYaoResult | null>(null)
const reversedYaoList = computed(() => result.value ? [...result.value.yaoList].reverse() : [])
const dongYaoText = computed(() => result.value?.dongYao.length ? result.value.dongYao.map(item => `${item}爻`).join('、') : '无动爻')
const readingLead = computed(() => result.value?.bianGua ? `由“${result.value.benGua.fullName}”向“${result.value.bianGua.fullName}”流转，变化已在局中。` : `“${result.value?.benGua.fullName}”为静卦，眼下更宜稳住根基。`)
const currentReading = computed(() => result.value?.dongYao.length ? '局中已有变量显现。先辨清主次，不必因一时起伏扰乱全局。' : '整体结构相对稳定，短期不宜频繁改变方向，守住已有节奏更重要。')
const changeReading = computed(() => {
  const count = result.value?.dongYao.length || 0
  if (count === 0) return '变化尚未明朗，耐心观察比立刻行动更有价值。'
  if (count <= 2) return '关键变化集中，抓住少数真正影响结果的节点即可。'
  return '多处同时变化，信息尚未沉淀，宜降低预期并保留回旋空间。'
})
const adviceText = computed(() => (result.value?.dongYao.length || 0) > 2 ? '缓行、复核、留有余地' : '守心、辨势、顺时而动')

// reversedYaoList 是从上爻到初爻，对应 yaoCi 数组索引 5,4,3,2,1,0
function getYaoCi(reversedIdx: number): string {
  if (!result.value) return ''
  const yaoCi = result.value.benGua.yaoCi
  if (!yaoCi?.length) return '—'
  const realIdx = 5 - reversedIdx // 上爻→索引5，初爻→索引0
  return yaoCi[realIdx] || '—'
}

onLoad((options) => {
  const historyId = String(options?.historyId || '')
  if (historyId) {
    const record = getMingliRecord(historyId)
    if (record?.type === 'liuyao') build(record.data as unknown as LiuYaoParams, false)
    return
  }
  const values = String(options?.values || '').split(',').map(Number).filter(value => [6, 7, 8, 9].includes(value))
  if (values.length !== 6) return
  build({ values, question: decodeURIComponent(String(options?.question || '心中所问')) }, true)
})
function build(input: LiuYaoParams, shouldSave: boolean) {
  result.value = liuYaoPaiPan(input.question, input.values)
  if (shouldSave) saveMingliRecord({
    type: 'liuyao', title: result.value.benGua.fullName,
    subtitle: `${input.question} · ${result.value.bianGua ? `变 ${result.value.bianGua.fullName}` : '静卦'}`,
    data: { values: [...input.values], question: input.question }
  })
}
function again() { uni.redirectTo({ url: APP_ROUTES.mingli.liuyao.shake }) }
function goHistory() { uni.navigateTo({ url: APP_ROUTES.mingli.history }) }
</script>

<style scoped lang="scss">
.page{min-height:100vh;background:#eee2c8;color:#172747}.hero{position:relative;min-height:680rpx;overflow:hidden;background:radial-gradient(circle at 50% 58%,#2a476d,#102543 50%,#07142b 88%)}.hero-content{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:12rpx}.eyebrow{color:rgba(226,194,116,.54);font:18rpx Georgia,serif;letter-spacing:7rpx}.gua-name-wrap{position:relative;width:230rpx;height:230rpx;margin-top:22rpx;display:flex;align-items:center;justify-content:center;border:1rpx solid rgba(228,192,103,.55);border-radius:50%}.gua-name-wrap::before,.gua-name-wrap::after{content:'';position:absolute;border:1rpx dashed rgba(228,192,103,.25);border-radius:50%;animation:spin 20s linear infinite}.gua-name-wrap::before{inset:-26rpx}.gua-name-wrap::after{inset:24rpx;animation-direction:reverse}.gua-name{position:relative;z-index:2;color:#f0d486;font:700 106rpx STKaiti,serif;text-shadow:0 0 34rpx rgba(231,189,88,.43)}.gua-halo{position:absolute;inset:68rpx;border-radius:50%;background:rgba(234,194,94,.28);box-shadow:0 0 70rpx 35rpx rgba(220,172,66,.2)}.gua-full{margin-top:26rpx;color:#f4e0aa;font:700 38rpx STKaiti,serif;letter-spacing:5rpx}.gua-ci{margin-top:8rpx;max-width:610rpx;color:rgba(239,220,168,.64);font:22rpx STKaiti,serif;text-align:center}.change-pill{margin-top:18rpx;padding:10rpx 22rpx;display:flex;gap:16rpx;border:1rpx solid rgba(224,187,96,.3);border-radius:26rpx;color:#ddbd6a;background:rgba(5,18,38,.4);font-size:20rpx}.change-arrow{color:rgba(229,205,144,.5)}
.paper-body{position:relative;margin-top:-18rpx;padding:38rpx 26rpx calc(48rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:linear-gradient(135deg,rgba(96,69,29,.035) 25%,transparent 25%) 0 0/18rpx 18rpx,#eee2c8}.question-banner{padding:18rpx 24rpx;display:flex;align-items:center;gap:18rpx;border-left:4rpx solid #a97d2e;background:rgba(248,240,218,.72)}.question-label{padding:5rpx 12rpx;border:1rpx solid #9d742a;border-radius:16rpx;color:#936b27;font:20rpx STKaiti,serif}.question-text{flex:1;color:#263654;font-size:23rpx}.section-title{margin:30rpx 0 22rpx;display:flex;align-items:center;justify-content:center;gap:20rpx;color:#a07831;text-align:center}.section-title view,.card-heading view{display:flex;flex-direction:column}.title-main{color:#1b2e4e;font:700 38rpx STKaiti,serif;letter-spacing:5rpx}.title-sub,.card-subtitle{margin-top:3rpx;color:#8a7a60;font-size:18rpx;letter-spacing:3rpx}
.hexagram-card{padding:26rpx 16rpx;border:1rpx solid rgba(161,118,41,.48);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(251,245,228,.88),rgba(242,231,202,.78));box-shadow:0 14rpx 34rpx rgba(63,45,20,.1),inset 0 0 0 4rpx rgba(255,255,255,.2)}.hex-header,.hex-row{display:flex;align-items:center;text-align:center}.hex-header{height:54rpx;color:#7a6c52;font-size:20rpx;font-weight:600;border-bottom:1rpx solid rgba(148,108,40,.22)}.hex-header>text,.small-col,.change-col{width:16%}.hex-header .hex-main,.line-col{width:36%}.hex-row{position:relative;min-height:76rpx;border-bottom:1rpx solid rgba(141,103,40,.1)}.hex-row:last-of-type{border-bottom:0}.hex-row.shi{background:linear-gradient(90deg,transparent,rgba(205,168,81,.16),transparent)}.hex-row.ying{background:linear-gradient(90deg,transparent,rgba(71,118,157,.13),transparent)}.hex-row.dong::before{content:'';position:absolute;left:0;top:50%;width:6rpx;height:40rpx;margin-top:-20rpx;border-radius:3rpx;background:linear-gradient(180deg,#c2503a,#a03e2c);box-shadow:0 0 12rpx rgba(181,91,66,.4)}.small-col{color:#5e5644;font-size:21rpx;font-weight:500}.branch{color:#956e2c;font:700 25rpx STKaiti,serif}.line-col{position:relative;display:flex;justify-content:center;align-items:center}.yao-line,.change-line{width:155rpx;height:14rpx;background:linear-gradient(90deg,#a87c2e,#dfbf67,#a87c2e);box-shadow:0 0 10rpx rgba(168,124,46,.2)}.yao-line.broken,.change-line.broken{background:linear-gradient(90deg,#a87c2e 0 42%,transparent 42% 58%,#a87c2e 58%)}.marker{position:absolute;right:2rpx;width:36rpx;height:36rpx;line-height:34rpx;border:1rpx solid #9a712d;border-radius:50%;color:#7a5c22;font:700 19rpx/34rpx STKaiti,serif;background:rgba(255,250,235,.7);box-shadow:0 2rpx 6rpx rgba(154,113,45,.18)}.change-col{display:flex;justify-content:center;color:#a19278}.change-line{width:64rpx;height:9rpx}.legend{padding-top:20rpx;display:flex;justify-content:center;gap:30rpx;color:#6e6353;font-size:19rpx;font-weight:500}.legend text{display:flex;align-items:center;gap:8rpx}.dot{width:14rpx;height:14rpx;border-radius:50%;box-shadow:0 0 8rpx currentColor}.dot-shi{background:#c29a45;color:#c29a45}.dot-ying{background:#6589a8;color:#6589a8}.dot-dong{background:#b55b42;color:#b55b42}
.reading-card{margin-top:28rpx;padding:32rpx;border:1rpx solid rgba(157,115,39,.42);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(250,243,224,.85),rgba(240,229,200,.75));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09),inset 0 0 0 4rpx rgba(255,255,255,.18)}
.yao-ci-card{margin-top:28rpx;padding:28rpx 24rpx;border:1rpx solid rgba(157,115,39,.42);border-radius:24rpx 8rpx;background:linear-gradient(180deg,rgba(250,243,224,.85),rgba(240,229,200,.75));box-shadow:0 14rpx 32rpx rgba(61,44,20,.09),inset 0 0 0 4rpx rgba(255,255,255,.18)}
.yao-ci-row{display:flex;align-items:flex-start;gap:16rpx;padding:16rpx 0;border-bottom:1rpx solid rgba(148,108,40,.12)}.yao-ci-row:last-child{border-bottom:0}
.ci-label{width:60rpx;color:#8b713d;font:700 22rpx STKaiti,serif;text-align:center;flex-shrink:0}
.ci-content{flex:1;display:flex;align-items:center;gap:10rpx}
.ci-line{flex:1;color:#4a4035;font-size:23rpx;line-height:1.6}.ci-line.dong{color:#b14b3b;font-weight:600}
.ci-dong-mark{width:32rpx;height:32rpx;line-height:32rpx;text-align:center;border-radius:50%;color:#fff;background:#c2503a;font-size:18rpx;flex-shrink:0}.card-heading{display:flex;justify-content:space-between;align-items:center}.card-title{font:700 33rpx STKaiti,serif;letter-spacing:3rpx;color:#1d3050}.seal{width:60rpx;height:60rpx;line-height:60rpx;text-align:center;border:2rpx solid #a4772a;color:#9d722a;font:31rpx/60rpx STKaiti,serif;transform:rotate(-5deg);background:rgba(255,250,235,.5)}.reading-lead{margin-top:26rpx;padding:24rpx;display:flex;color:#283957;background:rgba(217,198,153,.28);font:25rpx STKaiti,serif;line-height:1.65;border-radius:12rpx;border-left:4rpx solid #a1742a}.lead-mark{margin-right:8rpx;color:#a1742a;font-size:46rpx;line-height:.8}.reading-grid{display:grid;grid-template-columns:1fr 1fr;gap:18rpx;margin-top:22rpx}.reading-grid>view{padding:20rpx;border:1rpx solid rgba(154,113,43,.22);border-radius:14rpx;background:rgba(255,251,238,.5)}.reading-label,.reading-text{display:block}.reading-label{color:#8c6526;font:700 24rpx STKaiti,serif}.reading-text{margin-top:10rpx;color:#6e6353;font-size:21rpx;line-height:1.6}.focus-line{margin-top:22rpx;padding:16rpx 20rpx;display:flex;align-items:center;gap:14rpx;color:#6e6353;font-size:22rpx;background:rgba(36,56,88,.06);border-radius:12rpx}.focus-line>text:first-child{width:48rpx;height:48rpx;line-height:48rpx;text-align:center;border-radius:50%;color:#f5e5b8;background:linear-gradient(135deg,#243858,#1a2a45);font:24rpx/48rpx STKaiti,serif;box-shadow:0 4rpx 10rpx rgba(26,40,67,.25)}.meta-card{margin-top:24rpx;padding:20rpx 26rpx;border-top:1rpx solid rgba(155,113,40,.28);border-bottom:1rpx solid rgba(155,113,40,.28)}.meta-card view{display:flex;justify-content:space-between;padding:8rpx 0;color:#6e6353;font-size:21rpx}.meta-card view text:last-child{color:#2a3a55;font-weight:600}.again-btn{margin-top:32rpx;height:92rpx;border:0;border-radius:46rpx;color:#f3dfaa;background:linear-gradient(135deg,#1a2f50,#284060);box-shadow:0 12rpx 26rpx rgba(26,47,79,.22),inset 0 0 0 2rpx rgba(224,188,99,.4);font:700 29rpx STKaiti,serif;letter-spacing:4rpx}.again-btn::after{border:0}.again-btn:active{transform:translateY(2rpx)}.disclaimer{display:block;margin-top:24rpx;text-align:center;color:#8a7b63;font-size:19rpx}.empty{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24rpx;color:#776b56}.empty button{font-size:24rpx}
@keyframes spin{to{transform:rotate(360deg)}}
</style>
