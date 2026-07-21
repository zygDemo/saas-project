<template>
  <view class="page">
    <view class="night-head">
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
      <view class="head-copy">
        <text class="seal">命</text>
        <text class="head-title">录入出生时空</text>
        <text class="head-subtitle">四柱成象 · 五行流转 · 大运徐启</text>
      </view>
      <view class="time-ripple"><view class="ripple-dot" /></view>
    </view>

    <view class="paper-body">
      <view class="intro-line"><text>✦</text><text>每一刻时空，都有独特的五行印记</text><text>✦</text></view>
      <view class="form-scroll">
        <view class="form-card">
          <view class="card-corner corner-a" /><view class="card-corner corner-b" />
          <view class="field">
            <view class="field-label"><text class="field-index">壹</text><text>出生日期</text></view>
            <picker mode="date" :value="form.birthDate" :start="dateRange.start" :end="dateRange.end" @change="onDateChange">
              <view class="picker-box" :class="{ placeholder: !form.birthDate }">
                <view><text class="picker-main">{{ displayDate }}</text><text v-if="form.birthDate" class="picker-note">{{ form.isLunar ? '农历日期' : '公历日期' }}</text></view>
                <text class="picker-arrow">⌄</text>
              </view>
            </picker>
          </view>

          <view class="field">
            <view class="field-label"><text class="field-index">贰</text><text>出生时辰</text></view>
            <picker :range="SHI_CHEN_LIST" range-key="label" :value="shiChenIndex" @change="onShiChenChange">
              <view class="picker-box" :class="{ placeholder: shiChenIndex < 0 }">
                <view><text class="picker-main">{{ displayTime }}</text><text v-if="shiChenIndex >= 0" class="picker-note">{{ selectedShiChen?.range }}</text></view>
                <text class="picker-arrow">⌄</text>
              </view>
            </picker>
          </view>

          <view class="field">
            <view class="field-label"><text class="field-index">叁</text><text>命主性别</text></view>
            <view class="gender-tabs">
              <view class="gender-item" :class="{ active: form.gender === 'male' }" @tap="form.gender = 'male'">
                <text class="gender-symbol">乾</text><view><text class="gender-name">男命</text><text class="gender-note">阳刚之序</text></view>
              </view>
              <view class="gender-item" :class="{ active: form.gender === 'female' }" @tap="form.gender = 'female'">
                <text class="gender-symbol">坤</text><view><text class="gender-name">女命</text><text class="gender-note">阴柔之序</text></view>
              </view>
            </view>
          </view>

          <view class="calendar-toggle">
            <view><text class="toggle-title">农历输入</text><text class="toggle-note">开启后按农历日期记录（当前算法按公历近似推演）</text></view>
            <switch :checked="form.isLunar" color="#29b6f6" @change="onLunarToggle" />
          </view>
        </view>

        <button class="submit-btn" :disabled="!canSubmit" hover-class="tap-active" @tap="submit">
          <view class="btn-orbit" /><text class="btn-star">✦</text><text>开启命盘</text><text class="btn-arrow">→</text>
        </button>
        <view class="tips">
          <text class="tips-title">排盘小笺</text>
          <text>出生时辰影响时柱推演；若不确定，可选择“不确定”，系统将以午时作近似展示。</text>
          <text>结果用于传统文化研究与自我观察，不作为医疗、投资或人生决策依据。</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { APP_ROUTES } from '@/common/navigation'
import { lunarToSolar, getLunarDateString } from '@/common/mingli/lunar'
import { SHI_CHEN_LIST } from '@/common/mingli/shichen'
import { getMingliHistory } from '@/common/mingli/history'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'

const form = ref({ birthDate: '', birthHour: 12, gender: 'male' as 'male' | 'female', isLunar: false })
const shiChenIndex = ref(-1)
const selectedShiChen = computed(() => shiChenIndex.value >= 0 ? SHI_CHEN_LIST[shiChenIndex.value] : undefined)
const displayDate = computed(() => form.value.birthDate || '请选择出生日期')
const displayTime = computed(() => selectedShiChen.value?.label || '请选择出生时辰')
const dateRange = computed(() => ({ start: '1920-01-01', end: new Date().toISOString().slice(0, 10) }))
const canSubmit = computed(() => Boolean(form.value.birthDate))

const historyCount = ref(0)

onShow(() => {
  historyCount.value = getMingliHistory().length
})
const goHistory = () => uni.navigateTo({ url: APP_ROUTES.mingli.history })
const goHome = () => uni.reLaunch({ url: APP_ROUTES.portal.home })
function goBack() {
  if (getCurrentPages().length > 1) uni.navigateBack()
  else uni.reLaunch({ url: APP_ROUTES.portal.home })
}

function onDateChange(event: { detail: { value: string } }) {
  form.value.birthDate = event.detail.value
}
function onShiChenChange(event: { detail: { value: string | number } }) {
  shiChenIndex.value = Number(event.detail.value)
  form.value.birthHour = SHI_CHEN_LIST[shiChenIndex.value].value
}
function onLunarToggle(event: { detail: { value: boolean } }) {
  form.value.isLunar = event.detail.value
}
function submit() {
  if (!canSubmit.value) return uni.showToast({ title: '请先选择出生日期', icon: 'none' })

  let solarDate = form.value.birthDate
  let lunarInfo = ''

  if (form.value.isLunar) {
    const [lunarYear, lunarMonth, lunarDay] = form.value.birthDate.split('-').map(Number)
    const solar = lunarToSolar(lunarYear, lunarMonth, lunarDay)
    solarDate = `${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')}`
    lunarInfo = getLunarDateString(lunarYear, lunarMonth, lunarDay)
  }

  const params = {
    birthDate: solarDate,
    birthHour: String(form.value.birthHour),
    gender: form.value.gender,
    isLunar: form.value.isLunar ? '1' : '0',
    timeLabel: selectedShiChen.value?.label || '时辰不详',
    lunarInfo: lunarInfo || '',
  }
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  uni.navigateTo({ url: `${APP_ROUTES.mingli.bazi.result}?${query}` })
}
</script>

<style scoped lang="scss">
.page { min-height:100vh; background:var(--ming-bg-deep); color:var(--ming-text-primary); }
.topbar { position: fixed; top: 30rpx; left: 0; right: 0; z-index: 40; padding: calc(var(--status-bar-height) + 14rpx) 24rpx 12rpx; display: flex; justify-content: flex-start; align-items: center; pointer-events: none; }
.capsule { pointer-events: auto; height: 64rpx; display: flex; align-items: center; border: 1rpx solid var(--ming-border-purple); border-radius: 32rpx; background: rgba(255,255,255,.08); backdrop-filter: blur(18rpx); overflow: hidden; box-shadow: inset 0 1rpx 0 rgba(255,255,255,.05); }
.capsule-left { width: 70rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); font-size: 58rpx; line-height: 1; }
.capsule-left text { transform: translateY(-2rpx); }
.capsule-mid { width: 70rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); }
.capsule-mid .home-icon { font-size: 38rpx; line-height: 1; }
.capsule-divider { width: 1rpx; height: 36rpx; background: rgba(255,255,255,.16); }
.capsule-right { min-width: 70rpx; height: 64rpx; padding: 0 18rpx; display: flex; align-items: center; justify-content: center; color: var(--ming-text-purple); font-size: 24rpx; }
.capsule-right text { margin-left: 12rpx; }
.capsule-right text:first-child { margin-left: 0; }
.history-count { min-width: 30rpx; height: 30rpx; line-height: 30rpx; border-radius: 50%; text-align: center; color: var(--ming-bg-deep); background: var(--ming-cyan); font-size: 20rpx; box-shadow: 0 0 10rpx var(--ming-cyan-soft); }
.night-head { position:relative; height:580rpx; overflow:hidden; background:var(--ming-gradient-hero); }
.head-copy { position:relative; z-index:3; display:flex; flex-direction:column; align-items:center; padding-top:calc(var(--status-bar-height) + 110rpx); }.seal { width:72rpx;height:72rpx;line-height:72rpx;text-align:center;border:2rpx solid var(--ming-cyan);color:var(--ming-text-primary);font:46rpx/72rpx STKaiti,serif;transform:rotate(-5deg);box-shadow:0 0 24rpx var(--ming-cyan-soft);animation:sealFloat 3.5s ease-in-out infinite; }.head-title{margin-top:18rpx;color:var(--ming-text-primary);font:700 48rpx STKaiti,serif;letter-spacing:7rpx;text-shadow:0 0 18rpx var(--ming-cyan-soft),0 0 2rpx rgba(240,249,255,.25);animation:titleGlow 4s ease-in-out infinite}.head-subtitle{margin-top:8rpx;color:var(--ming-text-primary);font-size:22rpx;letter-spacing:3rpx;text-shadow:0 0 10rpx rgba(79,195,247,.28)}
.time-ripple{position:absolute;z-index:2;left:50%;bottom:-160rpx;width:430rpx;height:430rpx;margin-left:-215rpx;border:1rpx solid var(--ming-border-purple);border-radius:50%;animation:pulse 4s ease-out infinite}.time-ripple::before,.time-ripple::after{content:'';position:absolute;border:1rpx solid var(--ming-purple-faint);border-radius:50%}.time-ripple::before{inset:58rpx}.time-ripple::after{inset:118rpx}.ripple-dot{position:absolute;left:50%;top:24rpx;width:12rpx;height:12rpx;border-radius:50%;background:var(--ming-cyan);box-shadow:0 0 26rpx var(--ming-cyan)}
.paper-body{position:relative;margin-top:-16rpx;padding:38rpx 28rpx calc(48rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:radial-gradient(circle at 50% 0,rgba(22,36,73,.55) 0,transparent 60%),var(--ming-bg-deep)}.intro-line{display:flex;justify-content:center;gap:14rpx;color:rgba(255,255,255,.9);font-size:21rpx;letter-spacing:2rpx;margin-bottom:26rpx;text-shadow:0 0 8rpx rgba(79,195,247,.22)}.form-card{position:relative;padding:16rpx 34rpx 24rpx;border:1rpx solid rgba(79,195,247,.28);border-radius:26rpx 8rpx;background:linear-gradient(135deg,rgba(16,28,56,.86),rgba(10,18,38,.92));box-shadow:0 18rpx 44rpx rgba(0,0,0,.18),0 2rpx 8rpx rgba(0,0,0,.06),inset 0 0 0 1rpx rgba(255,255,255,.05)}
.field{padding:30rpx 0;border-bottom:1rpx solid rgba(79,195,247,.12)}.field:last-of-type{border-bottom:0}.field-label{display:flex;align-items:center;gap:12rpx;margin-bottom:18rpx;font:700 29rpx STKaiti,serif;letter-spacing:2rpx;color:var(--ming-text-primary);text-shadow:0 0 10rpx rgba(79,195,247,.22)}.field-index{width:38rpx;height:38rpx;line-height:38rpx;text-align:center;border-radius:50%;color:var(--ming-text-primary);background:var(--ming-gradient-btn-soft);font-size:20rpx;box-shadow:0 4rpx 10rpx var(--ming-cyan-faint)}.picker-box{min-height:96rpx;padding:0 24rpx;display:flex;align-items:center;justify-content:space-between;border:1rpx solid rgba(79,195,247,.22);border-radius:14rpx;background:rgba(10,16,34,.6);box-shadow:inset 0 2rpx 6rpx rgba(0,0,0,.12);transition:.2s}.picker-box:active{border-color:rgba(79,195,247,.4);background:rgba(10,16,34,.8)}.picker-box.placeholder .picker-main{color:rgba(255,255,255,.82)}.picker-main,.picker-note,.gender-name,.gender-note,.toggle-title,.toggle-note{display:block}.picker-main{font-size:30rpx;color:var(--ming-text-primary);font-weight:600}.picker-note{margin-top:5rpx;color:var(--ming-cyan);font-size:20rpx}.picker-arrow{color:var(--ming-cyan);font-size:34rpx}
.gender-tabs{display:flex;gap:18rpx}.gender-item{flex:1;padding:22rpx;display:flex;align-items:center;gap:14rpx;border:1rpx solid rgba(79,195,247,.18);border-radius:16rpx;background:rgba(10,16,34,.45);color:var(--ming-text-primary);transition:.25s}.gender-item.active{border-color:var(--ming-cyan);background:linear-gradient(135deg,rgba(41,182,246,.18),rgba(124,92,255,.14));color:var(--ming-text-primary);box-shadow:0 10rpx 24rpx rgba(79,195,247,.14),inset 0 0 0 1rpx rgba(79,195,247,.22)}.gender-symbol{width:58rpx;height:58rpx;line-height:58rpx;text-align:center;border:1rpx solid currentColor;border-radius:50%;font:32rpx/58rpx STKaiti,serif}.gender-name{font:700 29rpx STKaiti,serif}.gender-note{margin-top:3rpx;color:rgba(255,255,255,.82);font-size:19rpx}.active .gender-note{color:var(--ming-text-primary)}
.calendar-toggle{display:flex;justify-content:space-between;align-items:center;padding:28rpx 4rpx 10rpx;margin-top:8rpx;border-top:1rpx solid rgba(79,195,247,.12)}.toggle-title{font:700 28rpx STKaiti,serif;color:var(--ming-text-primary)}.toggle-note{max-width:470rpx;margin-top:5rpx;color:rgba(255,255,255,.82);font-size:19rpx;line-height:1.5}.submit-btn{position:relative;display:flex;align-items:center;justify-content:center;height:112rpx;margin:42rpx 4rpx 0;padding:0;border:none;border-radius:56rpx;color:var(--ming-text-primary);background:var(--ming-gradient-btn);box-shadow:0 18rpx 36rpx rgba(41,182,246,.22),0 0 0 1rpx rgba(79,195,247,.3),inset 0 0 0 2rpx rgba(255,255,255,.1),inset 0 2rpx 0 rgba(255,255,255,.12);font:700 33rpx STKaiti,KaiTi,serif;letter-spacing:6rpx;overflow:hidden;transition:transform .2s,box-shadow .2s;animation:subtlePulse 4s ease-in-out infinite}.submit-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.22) 50%,transparent 100%);transform:translateX(-100%);animation:shine 3.5s ease-in-out infinite}.submit-btn::after{border:none;content:'';position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,var(--ming-cyan-soft) 50%,transparent 70%);transform:translateX(-100%);animation:shinePurple 4.8s ease-in-out 1s infinite;pointer-events:none}.submit-btn:active:not([disabled]){transform:translateY(3rpx) scale(.985);box-shadow:0 10rpx 22rpx rgba(41,182,246,.2),0 0 0 1rpx rgba(79,195,247,.3),inset 0 0 0 2rpx rgba(255,255,255,.08)}.submit-btn[disabled]{opacity:.45;background:linear-gradient(90deg,#2a2f3d,#1a1f2d 50%,#2a2f3d);box-shadow:none;animation:none}.submit-btn[disabled]::before{display:none}.btn-star{margin-right:16rpx;color:var(--ming-text-primary);font-size:28rpx;text-shadow:0 0 10rpx rgba(255,255,255,.35);animation:twinkle 2.4s ease-in-out infinite}.btn-arrow{margin-left:16rpx;color:var(--ming-text-primary);text-shadow:0 0 10rpx rgba(255,255,255,.35)}.btn-orbit{position:absolute;width:260rpx;height:260rpx;border:1rpx solid var(--ming-cyan-faint);border-radius:50%;left:50%;top:-72rpx;margin-left:-130rpx;animation:spin 12s linear infinite}.btn-orbit::after{content:'';position:absolute;inset:28rpx;border:1rpx dashed var(--ming-cyan-faint);border-radius:50%;animation:spinReverse 8s linear infinite}.tips{margin:32rpx 14rpx 0;padding:24rpx 28rpx;border-left:4rpx solid var(--ming-cyan);background:rgba(41,182,246,.1);border-radius:0 12rpx 12rpx 0;display:flex;flex-direction:column;gap:10rpx;color:rgba(255,255,255,.88);font-size:22rpx;line-height:1.6}.tips-title{color:var(--ming-cyan);font:700 27rpx STKaiti,serif;letter-spacing:2rpx}
@keyframes pulse{50%{opacity:.55;transform:scale(1.07)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes spinReverse{to{transform:rotate(-360deg)}}@keyframes shine{0%{transform:translateX(-100%)}40%{transform:translateX(100%)}100%{transform:translateX(100%)}}@keyframes shinePurple{0%{transform:translateX(-100%)}40%{transform:translateX(100%)}100%{transform:translateX(100%)}}@keyframes subtlePulse{0%,100%{box-shadow:0 18rpx 36rpx rgba(41,182,246,.22),0 0 0 1rpx rgba(79,195,247,.3),inset 0 0 0 2rpx rgba(255,255,255,.1)}50%{box-shadow:0 20rpx 42rpx rgba(79,195,247,.28),0 0 0 1rpx rgba(79,195,247,.3),inset 0 0 0 2rpx rgba(255,255,255,.12)}}@keyframes twinkle{0%,100%{opacity:.6;transform:scale(.9)}50%{opacity:1;transform:scale(1.15)}}@keyframes sealFloat{0%,100%{transform:rotate(-5deg) translateY(0)}50%{transform:rotate(-3deg) translateY(-6rpx)}}@keyframes titleGlow{0%,100%{text-shadow:0 0 20rpx var(--ming-cyan-soft)}50%{text-shadow:0 0 36rpx var(--ming-cyan),0 0 60rpx var(--ming-cyan-faint)}}

.tap-active { transform: scale(0.98); opacity: 0.92; }
</style>
