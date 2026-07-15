<template>
  <view class="page">
    <view class="hero">
      <mystic-sky />
      <mystic-nav title="星卷" :action-text="records.length ? '清空' : ''" transparent @action="clearAll" />
      <view class="hero-copy">
        <text class="eyebrow">YOUR CELESTIAL ARCHIVE</text>
        <text class="hero-title">每一次问道，都有迹可循</text>
        <text class="hero-subtitle">收藏命盘与卦象，回看时间留下的答案</text>
      </view>
      <view class="archive-orbit"><text>{{ records.length }}</text><small>卷</small></view>
    </view>

    <view class="paper-body">
      <view class="filter-tabs">
        <view v-for="item in filters" :key="item.value" class="filter-item" :class="{ active: activeFilter === item.value }" @click="activeFilter = item.value">
          <text>{{ item.label }}</text><text class="filter-count">{{ item.count }}</text>
        </view>
      </view>

      <view v-if="filteredRecords.length" class="timeline">
        <view v-for="(item, index) in filteredRecords" :key="item.id" class="record-row" :style="{ animationDelay: `${index * 70}ms` }" @click="viewDetail(item)" @longpress="removeRecord(item)">
          <view class="timeline-axis"><view class="timeline-star" :class="item.type">✦</view><view class="timeline-line" /></view>
          <view class="record-card" :class="item.type">
            <view class="card-head"><view class="type-tag"><text>{{ item.type === 'bazi' ? '命' : '卦' }}</text><span>{{ item.type === 'bazi' ? '八字排盘' : '六爻问事' }}</span></view><text class="record-time">{{ item.time }}</text></view>
            <text class="record-title">{{ item.title }}</text>
            <text class="record-subtitle">{{ item.subtitle }}</text>
            <view class="card-foot"><text>{{ item.type === 'bazi' ? '重观五行光谱' : '重读卦意变化' }}</text><text class="arrow">→</text></view>
            <view class="watermark">{{ item.type === 'bazi' ? '八字' : '六爻' }}</view>
          </view>
        </view>
      </view>

      <view v-else class="empty-card">
        <view class="empty-sky"><view class="empty-orbit" /><text>✧</text></view>
        <text class="empty-title">星卷尚空</text>
        <text class="empty-desc">完成一次八字排盘或六爻问事后，记录会自动收藏于此。</text>
        <button @click="goHome">去问一卦</button>
      </view>
      <text v-if="filteredRecords.length" class="longpress-tip">长按记录可删除 · 最多保留 50 条星卷</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { APP_ROUTES } from '@/common/navigation'
import { clearMingliHistory, getMingliHistory, removeMingliRecord, type MingliHistoryRecord, type MingliRecordType } from '@/common/mingli/history'
import MysticNav from '@/components/mystic-nav/mystic-nav.vue'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'

type FilterValue = 'all' | MingliRecordType
const records = ref<MingliHistoryRecord[]>([])
const activeFilter = ref<FilterValue>('all')
onShow(() => { records.value = getMingliHistory() })
const filters = computed(() => [
  { label: '全部', value: 'all' as const, count: records.value.length },
  { label: '八字', value: 'bazi' as const, count: records.value.filter(item => item.type === 'bazi').length },
  { label: '六爻', value: 'liuyao' as const, count: records.value.filter(item => item.type === 'liuyao').length }
])
const filteredRecords = computed(() => activeFilter.value === 'all' ? records.value : records.value.filter(item => item.type === activeFilter.value))
function viewDetail(item: MingliHistoryRecord) {
  const path = item.type === 'bazi' ? APP_ROUTES.mingli.bazi.result : APP_ROUTES.mingli.liuyao.result
  uni.navigateTo({ url: `${path}?historyId=${encodeURIComponent(item.id)}` })
}
function removeRecord(item: MingliHistoryRecord) {
  uni.showModal({ title: '移除此卷？', content: `将删除“${item.title}”，操作不可撤回。`, confirmColor: '#9b7028', success: ({ confirm }) => {
    if (!confirm) return
    removeMingliRecord(item.id)
    records.value = getMingliHistory()
    uni.showToast({ title: '已移除', icon: 'none' })
  } })
}
function clearAll() {
  if (!records.value.length) return
  uni.showModal({ title: '清空全部星卷？', content: '所有八字与六爻记录都将被删除，此操作不可撤回。', confirmColor: '#a04438', success: ({ confirm }) => {
    if (!confirm) return
    clearMingliHistory(); records.value = []
  } })
}
function goHome() { uni.redirectTo({ url: APP_ROUTES.mingli.index }) }
</script>

<style scoped lang="scss">
.page{min-height:100vh;background:#eee2c8;color:#172747}.hero{position:relative;height:500rpx;overflow:hidden;background:radial-gradient(circle at 50% 70%,#29466c,#102543 50%,#07142b 88%)}.hero-copy{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:26rpx}.eyebrow{color:rgba(227,194,115,.55);font:17rpx Georgia,serif;letter-spacing:6rpx}.hero-title{margin-top:16rpx;color:#f1dca3;font:700 42rpx STKaiti,serif;letter-spacing:5rpx}.hero-subtitle{margin-top:8rpx;color:rgba(240,220,166,.6);font-size:21rpx;letter-spacing:2rpx}.archive-orbit{position:absolute;z-index:3;left:50%;bottom:-72rpx;width:230rpx;height:230rpx;margin-left:-115rpx;padding-top:48rpx;box-sizing:border-box;border:1rpx solid rgba(227,190,99,.5);border-radius:50%;text-align:center;color:#eed184;box-shadow:0 0 48rpx rgba(217,169,64,.17);animation:breathe 4s ease-in-out infinite}.archive-orbit::before,.archive-orbit::after{content:'';position:absolute;border:1rpx dashed rgba(226,191,102,.25);border-radius:50%}.archive-orbit::before{inset:-24rpx}.archive-orbit::after{inset:30rpx}.archive-orbit text{position:relative;z-index:2;font:700 70rpx STKaiti,serif}.archive-orbit small{position:relative;z-index:2;margin-left:6rpx;font:22rpx STKaiti,serif}.paper-body{position:relative;margin-top:-18rpx;min-height:500rpx;padding:40rpx 25rpx calc(48rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:linear-gradient(135deg,rgba(96,69,29,.035) 25%,transparent 25%) 0 0/18rpx 18rpx,#eee2c8}.filter-tabs{display:flex;padding:7rpx;border:1rpx solid rgba(157,115,40,.4);border-radius:40rpx;background:rgba(248,241,221,.72)}.filter-item{flex:1;height:62rpx;display:flex;align-items:center;justify-content:center;gap:8rpx;border-radius:32rpx;color:#796b54;font-size:23rpx;transition:.25s}.filter-item.active{color:#f2deaa;background:#203655;box-shadow:0 7rpx 18rpx rgba(27,50,80,.18)}.filter-count{min-width:28rpx;height:28rpx;line-height:28rpx;text-align:center;border-radius:50%;background:rgba(154,116,50,.14);font-size:17rpx}.active .filter-count{background:rgba(231,196,111,.18)}
.timeline{margin-top:30rpx}.record-row{display:flex;animation:enter .55s both}.timeline-axis{width:64rpx;display:flex;flex-direction:column;align-items:center}.timeline-star{position:relative;z-index:2;width:42rpx;height:42rpx;line-height:42rpx;text-align:center;border:1rpx solid #b48837;border-radius:50%;color:#b48837;background:#eee2c8;font-size:20rpx}.timeline-star.liuyao{color:#536f91;border-color:#536f91}.timeline-line{flex:1;width:1rpx;background:linear-gradient(#b99858,rgba(185,152,88,.15))}.record-row:last-child .timeline-line{background:transparent}.record-card{position:relative;flex:1;min-width:0;margin-bottom:20rpx;padding:24rpx 26rpx;overflow:hidden;border:1rpx solid rgba(160,117,40,.44);border-radius:20rpx 7rpx;background:linear-gradient(135deg,rgba(251,245,228,.9),rgba(235,218,181,.78));box-shadow:0 10rpx 25rpx rgba(62,44,18,.08)}.record-card.liuyao{color:#f0dfb2;border-color:rgba(217,180,91,.42);background:linear-gradient(135deg,#1c3153,#2c3f61)}.card-head{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center}.type-tag{display:flex;align-items:center;gap:9rpx}.type-tag>text{width:38rpx;height:38rpx;line-height:38rpx;text-align:center;border:1rpx solid #9c722a;border-radius:50%;color:#956b27;font:21rpx/38rpx STKaiti,serif}.liuyao .type-tag>text{color:#e0bc62;border-color:#d4ad50}.type-tag span{color:#8b6a30;font-size:20rpx}.liuyao .type-tag span{color:#d4b767}.record-time{color:#92856e;font-size:18rpx}.liuyao .record-time{color:rgba(240,222,174,.45)}.record-title,.record-subtitle{position:relative;z-index:2;display:block}.record-title{margin-top:18rpx;font:700 31rpx STKaiti,serif;letter-spacing:2rpx}.record-subtitle{margin-top:7rpx;max-width:570rpx;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#776c58;font-size:20rpx}.liuyao .record-subtitle{color:rgba(240,225,185,.58)}.card-foot{position:relative;z-index:2;margin-top:19rpx;padding-top:14rpx;display:flex;justify-content:space-between;border-top:1rpx solid rgba(149,108,38,.17);color:#99732f;font-size:20rpx}.liuyao .card-foot{color:#dbb85f;border-color:rgba(222,187,100,.16)}.arrow{font-size:27rpx}.watermark{position:absolute;right:-10rpx;bottom:-24rpx;color:rgba(133,95,30,.07);font:86rpx STKaiti,serif;transform:rotate(-10deg)}.liuyao .watermark{color:rgba(239,209,134,.05)}
.empty-card{margin-top:55rpx;display:flex;flex-direction:column;align-items:center;text-align:center}.empty-sky{position:relative;width:190rpx;height:190rpx;display:flex;align-items:center;justify-content:center;color:#a57a2e;font-size:58rpx}.empty-orbit{position:absolute;inset:20rpx;border:1rpx dashed rgba(160,118,43,.5);border-radius:50%;animation:spin 18s linear infinite}.empty-sky::before{content:'';position:absolute;inset:48rpx;border-radius:50%;background:rgba(190,151,73,.15);box-shadow:0 0 32rpx rgba(184,141,56,.18)}.empty-title{font:700 34rpx STKaiti,serif;letter-spacing:4rpx}.empty-desc{max-width:520rpx;margin-top:10rpx;color:#7a6e59;font-size:21rpx;line-height:1.6}.empty-card button{width:300rpx;height:78rpx;margin-top:26rpx;border:0;border-radius:40rpx;color:#f0ddaa;background:#203655;font:700 25rpx STKaiti,serif}.empty-card button::after{border:0}.longpress-tip{display:block;margin-top:18rpx;text-align:center;color:#958872;font-size:18rpx}
@keyframes enter{from{opacity:0;transform:translateY(22rpx)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes breathe{50%{box-shadow:0 0 76rpx rgba(217,169,64,.3);transform:scale(1.03)}}@media(prefers-reduced-motion:reduce){.record-row,.archive-orbit,.empty-orbit{animation:none}}
</style>
