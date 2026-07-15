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
        <view v-for="yao in reversedYaoList" :key="yao.position" class="hex-row" :class="{ shi: yao.position === result.benGua.shiYao, ying: yao.position === result.benGua.yingYao, dong: yao.isDong }">
          <text class="small-col">{{ yao.liuShen }}</text>
          <text class="small-col">{{ yao.liuQin }}</text>
          <view class="line-col"><view class="yao-line" :class="{ broken: yao.yinYang === '阴' }" /><text v-if="yao.position === result.benGua.shiYao" class="marker">世</text><text v-if="yao.position === result.benGua.yingYao" class="marker">应</text></view>
          <text class="small-col branch">{{ yao.diZhi }}</text>
          <view class="change-col"><view v-if="yao.isDong" class="change-line" :class="{ broken: yao.bianYinYang === '阴' }" /><text v-else>·</text></view>
        </view>
        <view class="legend"><text><i class="dot dot-shi" />世爻</text><text><i class="dot dot-ying" />应爻</text><text><i class="dot dot-dong" />动爻</text></view>
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
.hexagram-card{padding:22rpx 14rpx;border:1rpx solid rgba(161,118,41,.48);border-radius:24rpx 8rpx;background:rgba(250,244,227,.78);box-shadow:0 12rpx 30rpx rgba(63,45,20,.09)}.hex-header,.hex-row{display:flex;align-items:center;text-align:center}.hex-header{height:50rpx;color:#897654;font-size:19rpx;border-bottom:1rpx solid rgba(148,108,40,.2)}.hex-header>text,.small-col,.change-col{width:16%}.hex-header .hex-main,.line-col{width:36%}.hex-row{position:relative;min-height:72rpx;border-bottom:1rpx solid rgba(141,103,40,.12)}.hex-row:last-of-type{border-bottom:0}.hex-row.shi{background:linear-gradient(90deg,transparent,rgba(205,168,81,.13),transparent)}.hex-row.ying{background:linear-gradient(90deg,transparent,rgba(71,118,157,.1),transparent)}.hex-row.dong::before{content:'';position:absolute;left:0;width:5rpx;height:32rpx;border-radius:3rpx;background:#b55b42;box-shadow:0 0 10rpx rgba(181,91,66,.3)}.small-col{color:#655b49;font-size:20rpx}.branch{color:#956e2c;font:700 24rpx STKaiti,serif}.line-col{position:relative;display:flex;justify-content:center;align-items:center}.yao-line,.change-line{width:150rpx;height:13rpx;background:linear-gradient(90deg,#a87c2e,#dfbf67,#a87c2e)}.yao-line.broken,.change-line.broken{background:linear-gradient(90deg,#a87c2e 0 42%,transparent 42% 58%,#a87c2e 58%)}.marker{position:absolute;right:4rpx;width:32rpx;height:32rpx;line-height:32rpx;border:1rpx solid #9a712d;border-radius:50%;color:#8b6527;font:18rpx/32rpx STKaiti,serif}.change-col{display:flex;justify-content:center;color:#a19278}.change-line{width:62rpx;height:8rpx}.legend{padding-top:18rpx;display:flex;justify-content:center;gap:28rpx;color:#80735d;font-size:18rpx}.legend text{display:flex;align-items:center;gap:7rpx}.dot{width:12rpx;height:12rpx;border-radius:50%}.dot-shi{background:#c29a45}.dot-ying{background:#6589a8}.dot-dong{background:#b55b42}
.reading-card{margin-top:24rpx;padding:28rpx;border:1rpx solid rgba(157,115,39,.42);border-radius:24rpx 8rpx;background:rgba(249,242,222,.75)}.card-heading{display:flex;justify-content:space-between;align-items:center}.card-title{font:700 32rpx STKaiti,serif;letter-spacing:3rpx}.seal{width:58rpx;height:58rpx;line-height:58rpx;text-align:center;border:2rpx solid #a4772a;color:#9d722a;font:30rpx/58rpx STKaiti,serif;transform:rotate(-5deg)}.reading-lead{margin-top:24rpx;padding:22rpx;display:flex;color:#283957;background:rgba(217,198,153,.22);font:24rpx STKaiti,serif;line-height:1.6}.lead-mark{margin-right:8rpx;color:#a1742a;font-size:45rpx;line-height:.8}.reading-grid{display:grid;grid-template-columns:1fr 1fr;gap:18rpx;margin-top:20rpx}.reading-grid>view{padding:18rpx;border:1rpx solid rgba(154,113,43,.2);border-radius:12rpx}.reading-label,.reading-text{display:block}.reading-label{color:#966f2c;font:700 23rpx STKaiti,serif}.reading-text{margin-top:8rpx;color:#766a55;font-size:20rpx;line-height:1.55}.focus-line{margin-top:20rpx;display:flex;align-items:center;gap:14rpx;color:#76674e;font-size:21rpx}.focus-line>text:first-child{width:46rpx;height:46rpx;line-height:46rpx;text-align:center;border-radius:50%;color:#f5e5b8;background:#243858;font:23rpx/46rpx STKaiti,serif}.meta-card{margin-top:22rpx;padding:18rpx 24rpx;border-top:1rpx solid rgba(155,113,40,.28);border-bottom:1rpx solid rgba(155,113,40,.28)}.meta-card view{display:flex;justify-content:space-between;padding:7rpx 0;color:#7b705c;font-size:20rpx}.meta-card view text:last-child{color:#30405b}.again-btn{margin-top:28rpx;height:90rpx;border:0;border-radius:45rpx;color:#f3dfaa;background:#203555;font:700 28rpx STKaiti,serif;letter-spacing:4rpx}.again-btn::after{border:0}.disclaimer{display:block;margin-top:22rpx;text-align:center;color:#887a63;font-size:18rpx}.empty{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24rpx;color:#776b56}.empty button{font-size:24rpx}
@keyframes spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.gua-name-wrap::before,.gua-name-wrap::after{animation:none}}
</style>
