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
          <view v-if="records.length" class="capsule-actions">
            <view class="capsule-action" hover-class="tap-active" @tap="exportHistory">
              <text>导出</text>
            </view>
            <view class="capsule-divider" />
            <view class="capsule-action" hover-class="tap-active" @tap="clearAll">
              <text>清空</text>
            </view>
          </view>
        </view>
      </view>
      <view class="hero-copy">
        <text class="eyebrow">YOUR CELESTIAL ARCHIVE</text>
        <text class="hero-title">星卷</text>
        <text class="hero-subtitle">每一次问道，都有迹可循</text>
        <view class="stats-row">
          <view class="stat-item">
            <text class="stat-num">{{ records.length }}</text>
            <text class="stat-label">总记录</text>
          </view>
          <view class="stat-item">
            <text class="stat-num">{{ baziCount }}</text>
            <text class="stat-label">八字</text>
          </view>
          <view class="stat-item">
            <text class="stat-num">{{ liuyaoCount }}</text>
            <text class="stat-label">六爻</text>
          </view>
        </view>
      </view>
      <view class="archive-orbit"><text>{{ records.length }}</text><text class="archive-unit">卷</text></view>
    </view>

    <view class="paper-body">
      <view class="filter-tabs">
        <view v-for="item in filters" :key="item.value" class="filter-item" :class="{ active: activeFilter === item.value }" hover-class="tap-active" @tap="activeFilter = item.value">
          <text>{{ item.label }}</text><text class="filter-count">{{ item.count }}</text>
        </view>
      </view>

      <view v-if="filteredRecords.length" class="timeline">
        <view v-for="(item, index) in filteredRecords" :key="item.id" class="record-row" :style="{ animationDelay: `${index * 70}ms` }" hover-class="tap-active" @tap="viewDetail(item)" @longpress="removeRecord(item)">
          <view class="timeline-axis"><view class="timeline-star" :class="item.type">✦</view><view class="timeline-line" /></view>
          <view class="record-card" :class="item.type">
            <view class="card-head"><view class="type-tag"><text>{{ item.type === 'bazi' ? '命' : '卦' }}</text><text class="inline-text">{{ item.type === 'bazi' ? '八字排盘' : '六爻问事' }}</text></view><text class="record-time">{{ item.time }}</text></view>
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
        <button class="plain-btn" hover-class="tap-active" @tap="goHome">去问一卦</button>
      </view>
      <text v-if="filteredRecords.length" class="longpress-tip">长按记录可删除 · 最多保留 50 条星卷</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { APP_ROUTES } from '@/common/navigation'
import { clearMingliHistory, getMingliHistory, removeMingliRecord, exportMingliHistoryAsText, type MingliHistoryRecord, type MingliRecordType } from '@/common/mingli/history'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'

type FilterValue = 'all' | MingliRecordType
const records = ref<MingliHistoryRecord[]>([])
const activeFilter = ref<FilterValue>('all')

onShow(() => { records.value = getMingliHistory() })

const baziCount = computed(() => records.value.filter(r => r.type === 'bazi').length)
const liuyaoCount = computed(() => records.value.filter(r => r.type === 'liuyao').length)

function goBack() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: APP_ROUTES.portal.home })
}
function goHome() { uni.redirectTo({ url: APP_ROUTES.mingli.index }) }

const filters = computed(() => [
  { label: '全部', value: 'all' as const, count: records.value.length },
  { label: '八字', value: 'bazi' as const, count: baziCount.value },
  { label: '六爻', value: 'liuyao' as const, count: liuyaoCount.value }
])
const filteredRecords = computed(() => activeFilter.value === 'all' ? records.value : records.value.filter(item => item.type === activeFilter.value))
function viewDetail(item: MingliHistoryRecord) {
  const path = item.type === 'bazi' ? APP_ROUTES.mingli.bazi.result : APP_ROUTES.mingli.liuyao.result
  uni.navigateTo({ url: `${path}?historyId=${encodeURIComponent(item.id)}` })
}
function removeRecord(item: MingliHistoryRecord) {
  uni.showModal({ title: '移除此卷？', content: `将删除"${item.title}"，操作不可撤回。`, confirmColor: '#29b6f6', success: ({ confirm }) => {
    if (!confirm) return
    removeMingliRecord(item.id)
    records.value = getMingliHistory()
    uni.showToast({ title: '已移除', icon: 'none' })
  } })
}
function clearAll() {
  if (!records.value.length) return
  uni.showModal({ title: '清空全部星卷？', content: '所有八字与六爻记录都将被删除，此操作不可撤回。', confirmColor: '#7c5cff', success: ({ confirm }) => {
    if (!confirm) return
    clearMingliHistory(); records.value = []
  } })
}

function exportHistory() {
  const text = exportMingliHistoryAsText()
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    }
  })
}
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
.capsule-actions { display: flex; align-items: center; }
.capsule-action { min-width: 70rpx; height: 64rpx; padding: 0 18rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); font-size: 24rpx; }
.hero{position:relative;height:620rpx;overflow:hidden;background:var(--ming-gradient-hero)}.hero-copy{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;padding-top:calc(var(--status-bar-height) + 110rpx)}.eyebrow{color:var(--ming-text-purple-soft);font:17rpx Georgia,serif;letter-spacing:6rpx;text-shadow:0 0 10rpx rgba(79,195,247,.3)}.hero-title{margin-top:22rpx;color:var(--ming-text-purple);font:700 64rpx STKaiti,KaiTi,serif;letter-spacing:12rpx;text-shadow:0 0 30rpx var(--ming-purple-soft);animation:titleGlow 4s ease-in-out infinite}.hero-subtitle{margin-top:14rpx;color:var(--ming-text-primary);font:28rpx STKaiti,KaiTi,serif;letter-spacing:3rpx;text-shadow:0 0 8rpx rgba(79,195,247,.22)}
.stats-row{display:flex;gap:48rpx;margin-top:28rpx}.stat-item{display:flex;flex-direction:column;align-items:center}.stat-num{color:var(--ming-text-purple);font:700 42rpx STKaiti,serif;text-shadow:0 0 20rpx var(--ming-purple-soft)}.stat-label{color:var(--ming-text-primary);font-size:20rpx;letter-spacing:2rpx;text-shadow:0 0 6rpx rgba(79,195,247,.18)}
.archive-orbit{position:absolute;z-index:3;left:50%;bottom:-78rpx;width:250rpx;height:250rpx;margin-left:-125rpx;padding-top:52rpx;box-sizing:border-box;border:2rpx solid var(--ming-border-purple);border-radius:50%;text-align:center;color:var(--ming-text-purple);box-shadow:0 0 60rpx var(--ming-shadow-purple),inset 0 0 30rpx var(--ming-purple-faint);animation:archiveBreathe 4s ease-in-out infinite, archiveSpin 30s linear infinite}.archive-orbit::before,.archive-orbit::after{content:'';position:absolute;border:1rpx dashed var(--ming-border-purple);border-radius:50%}.archive-orbit::before{inset:-26rpx;animation:archiveSpinReverse 24s linear infinite}.archive-orbit::after{inset:32rpx;animation:archiveSpin 18s linear infinite}.archive-orbit text{position:relative;z-index:2;font:700 78rpx STKaiti,serif;text-shadow:0 0 24rpx var(--ming-purple-soft)}.archive-orbit small{position:relative;z-index:2;margin-left:6rpx;font:24rpx STKaiti,serif}
.paper-body{position:relative;margin-top:-18rpx;min-height:500rpx;padding:40rpx 25rpx calc(48rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:radial-gradient(circle at 50% 0,rgba(22,36,73,.55) 0,transparent 60%),var(--ming-bg-deep)}.filter-tabs{display:flex;padding:7rpx;border:1rpx solid rgba(79,195,247,.28);border-radius:40rpx;background:rgba(10,16,34,.55);box-shadow:0 10rpx 28rpx rgba(0,0,0,.18)}.filter-item{flex:1;height:62rpx;display:flex;align-items:center;justify-content:center;gap:8rpx;border-radius:32rpx;color:var(--ming-text-primary);font-size:23rpx;transition:all .35s cubic-bezier(.2,.8,.2,1)}.filter-item.active{color:var(--ming-text-primary);background:linear-gradient(135deg,rgba(41,182,246,.2),rgba(124,92,255,.2));box-shadow:0 0 18rpx rgba(79,195,247,.18)}.filter-count{min-width:28rpx;height:28rpx;line-height:28rpx;text-align:center;border-radius:50%;background:rgba(79,195,247,.14);font-size:17rpx}.active .filter-count{background:rgba(79,195,247,.24)}
.timeline{margin-top:34rpx}.record-row{display:flex;animation:enter .55s both}.timeline-axis{width:66rpx;display:flex;flex-direction:column;align-items:center}.timeline-star{position:relative;z-index:2;width:46rpx;height:46rpx;line-height:44rpx;text-align:center;border:2rpx solid var(--ming-cyan);border-radius:50%;color:var(--ming-cyan);background:var(--ming-bg-deep);font-size:21rpx;box-shadow:0 0 12rpx rgba(79,195,247,.25)}.timeline-star.liuyao{color:var(--ming-violet);border-color:var(--ming-violet);box-shadow:0 0 12rpx rgba(124,92,255,.25)}.timeline-line{flex:1;width:2rpx;background:linear-gradient(180deg,var(--ming-cyan),rgba(79,195,247,.1))}.record-row:last-child .timeline-line{background:transparent}.record-card{position:relative;flex:1;min-width:0;margin-bottom:22rpx;padding:26rpx 28rpx;overflow:hidden;border:1rpx solid rgba(79,195,247,.28);border-radius:20rpx 7rpx;background:linear-gradient(135deg,rgba(16,28,56,.86),rgba(10,18,38,.92));box-shadow:0 14rpx 34rpx rgba(0,0,0,.18),inset 0 0 0 1rpx rgba(255,255,255,.05);transition:.3s cubic-bezier(.2,.8,.2,1)}.record-card:active{transform:scale(.985) translateY(2rpx);box-shadow:0 6rpx 18rpx rgba(0,0,0,.22),0 0 24rpx rgba(79,195,247,.18)}.record-card.liuyao{color:var(--ming-purple-light);border-color:rgba(124,92,255,.32);background:linear-gradient(135deg,rgba(20,24,56,.86),rgba(10,16,34,.92));box-shadow:0 14rpx 34rpx rgba(0,0,0,.18),inset 0 0 0 1rpx rgba(255,255,255,.05)}.card-head{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center}.type-tag{display:flex;align-items:center;gap:10rpx}.type-tag>text{width:40rpx;height:40rpx;line-height:38rpx;text-align:center;border:1rpx solid var(--ming-cyan);border-radius:50%;color:var(--ming-cyan);font:21rpx/38rpx STKaiti,serif;background:rgba(79,195,247,.1)}.liuyao .type-tag>text{color:var(--ming-violet-light);border-color:var(--ming-violet-light);background:rgba(124,92,255,.1)}.type-tag span{color:var(--ming-cyan);font-size:21rpx;font-weight:600}.liuyao .type-tag span{color:var(--ming-violet-light)}.record-time{color:var(--ming-text-purple-soft);font-size:19rpx}.record-title{position:relative;z-index:2;display:block;margin-top:14rpx;font:700 31rpx STKaiti,serif;letter-spacing:3rpx;color:var(--ming-text-primary)}.record-subtitle{position:relative;z-index:2;display:block;margin-top:6rpx;color:var(--ming-text-primary);font-size:22rpx;text-shadow:0 0 6rpx rgba(79,195,247,.18)}.card-foot{position:relative;z-index:2;display:flex;align-items:center;gap:8rpx;margin-top:16rpx;color:var(--ming-cyan);font-size:21rpx}.arrow{font-size:26rpx}.watermark{position:absolute;right:-16rpx;bottom:-18rpx;font:700 120rpx STKaiti,serif;color:rgba(79,195,247,.08);line-height:1;pointer-events:none}.record-card.liuyao .watermark{color:rgba(124,92,255,.08)}
.empty-card{margin-top:55rpx;display:flex;flex-direction:column;align-items:center;text-align:center}.empty-sky{position:relative;width:190rpx;height:190rpx;display:flex;align-items:center;justify-content:center;color:var(--ming-cyan);font-size:58rpx;text-shadow:0 0 24rpx var(--ming-cyan-soft)}.empty-orbit{position:absolute;inset:20rpx;border:1rpx dashed rgba(79,195,247,.45);border-radius:50%;animation:spin 18s linear infinite}.empty-sky::before{content:'';position:absolute;inset:48rpx;border-radius:50%;background:rgba(41,182,246,.12);box-shadow:0 0 32rpx rgba(79,195,247,.18)}.empty-title{font:700 34rpx STKaiti,serif;letter-spacing:4rpx;color:var(--ming-text-primary)}.empty-desc{max-width:520rpx;margin-top:10rpx;color:var(--ming-text-primary);font-size:21rpx;line-height:1.6;text-shadow:0 0 6rpx rgba(79,195,247,.18)}.empty-card button{width:300rpx;height:78rpx;margin-top:26rpx;border:0;border-radius:40rpx;color:var(--ming-text-primary);background:var(--ming-gradient-btn);font:700 25rpx STKaiti,serif;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 8rpx 24rpx rgba(41,182,246,.25)}.empty-card button::after{display:none;border:0}.longpress-tip{display:block;margin-top:18rpx;text-align:center;color:var(--ming-text-purple-soft);font-size:18rpx}
@keyframes enter{from{opacity:0;transform:translateY(22rpx) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes titleGlow{0%,100%{text-shadow:0 0 30rpx var(--ming-purple-soft)}50%{text-shadow:0 0 50rpx var(--ming-purple),0 0 90rpx var(--ming-purple-faint)}}@keyframes archiveBreathe{0%,100%{box-shadow:0 0 60rpx var(--ming-shadow-purple),inset 0 0 30rpx var(--ming-purple-faint);transform:scale(1)}50%{box-shadow:0 0 90rpx var(--ming-shadow-glow),inset 0 0 40rpx var(--ming-purple-soft);transform:scale(1.03)}}@keyframes archiveSpin{to{transform:rotate(360deg)}}@keyframes archiveSpinReverse{to{transform:rotate(-360deg)}}

.tap-active { transform: scale(0.98); opacity: 0.92; }
</style>
