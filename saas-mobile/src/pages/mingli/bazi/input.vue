<template>
  <view class="page">
    <view class="night-head">
      <mystic-sky />
      <mystic-nav title="八字排盘" transparent />
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
            <picker :range="shiChenList" range-key="label" :value="shiChenIndex" @change="onShiChenChange">
              <view class="picker-box" :class="{ placeholder: shiChenIndex < 0 }">
                <view><text class="picker-main">{{ displayTime }}</text><text v-if="shiChenIndex >= 0" class="picker-note">{{ selectedShiChen?.range }}</text></view>
                <text class="picker-arrow">⌄</text>
              </view>
            </picker>
          </view>

          <view class="field">
            <view class="field-label"><text class="field-index">叁</text><text>命主性别</text></view>
            <view class="gender-tabs">
              <view class="gender-item" :class="{ active: form.gender === 'male' }" @click="form.gender = 'male'">
                <text class="gender-symbol">乾</text><view><text class="gender-name">男命</text><text class="gender-note">阳刚之序</text></view>
              </view>
              <view class="gender-item" :class="{ active: form.gender === 'female' }" @click="form.gender = 'female'">
                <text class="gender-symbol">坤</text><view><text class="gender-name">女命</text><text class="gender-note">阴柔之序</text></view>
              </view>
            </view>
          </view>

          <view class="calendar-toggle">
            <view><text class="toggle-title">农历输入</text><text class="toggle-note">开启后按农历日期记录（当前算法按公历近似推演）</text></view>
            <switch :checked="form.isLunar" color="#b88932" @change="onLunarToggle" />
          </view>
        </view>

        <button class="submit-btn" :disabled="!canSubmit" @click="submit">
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
import { APP_ROUTES } from '@/common/navigation'
import MysticNav from '@/components/mystic-nav/mystic-nav.vue'
import MysticSky from '@/components/mystic-sky/mystic-sky.vue'

const shiChenList = [
  { label: '不确定', value: 12, range: '暂以午时近似推演' },
  { label: '子时', value: 0, range: '23:00—01:00' }, { label: '丑时', value: 2, range: '01:00—03:00' },
  { label: '寅时', value: 4, range: '03:00—05:00' }, { label: '卯时', value: 6, range: '05:00—07:00' },
  { label: '辰时', value: 8, range: '07:00—09:00' }, { label: '巳时', value: 10, range: '09:00—11:00' },
  { label: '午时', value: 12, range: '11:00—13:00' }, { label: '未时', value: 14, range: '13:00—15:00' },
  { label: '申时', value: 16, range: '15:00—17:00' }, { label: '酉时', value: 18, range: '17:00—19:00' },
  { label: '戌时', value: 20, range: '19:00—21:00' }, { label: '亥时', value: 22, range: '21:00—23:00' }
]
const form = ref({ birthDate: '', birthHour: 12, gender: 'male' as 'male' | 'female', isLunar: false })
const shiChenIndex = ref(-1)
const selectedShiChen = computed(() => shiChenIndex.value >= 0 ? shiChenList[shiChenIndex.value] : undefined)
const displayDate = computed(() => form.value.birthDate || '请选择出生日期')
const displayTime = computed(() => selectedShiChen.value?.label || '请选择出生时辰')
const dateRange = computed(() => ({ start: '1920-01-01', end: new Date().toISOString().slice(0, 10) }))
const canSubmit = computed(() => Boolean(form.value.birthDate))

function onDateChange(event: { detail: { value: string } }) { form.value.birthDate = event.detail.value }
function onShiChenChange(event: { detail: { value: string | number } }) {
  shiChenIndex.value = Number(event.detail.value)
  form.value.birthHour = shiChenList[shiChenIndex.value].value
}
function onLunarToggle(event: { detail: { value: boolean } }) { form.value.isLunar = event.detail.value }
function submit() {
  if (!canSubmit.value) return uni.showToast({ title: '请先选择出生日期', icon: 'none' })
  const params = {
    birthDate: form.value.birthDate,
    birthHour: String(form.value.birthHour),
    gender: form.value.gender,
    isLunar: form.value.isLunar ? '1' : '0',
    timeLabel: selectedShiChen.value?.label || '时辰不详'
  }
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')
  uni.navigateTo({ url: `${APP_ROUTES.mingli.bazi.result}?${query}` })
}
</script>

<style scoped lang="scss">
.page { min-height:100vh; background:#eee2c8; color:#172747; }
.night-head { position:relative; height:520rpx; overflow:hidden; background:radial-gradient(circle at 50% 80%,#29466b,#102543 48%,#07152c 88%); }
.head-copy { position:relative; z-index:3; display:flex; flex-direction:column; align-items:center; padding-top:30rpx; }.seal { width:72rpx;height:72rpx;line-height:72rpx;text-align:center;border:2rpx solid #d9b55d;color:#edcf84;font:46rpx/72rpx STKaiti,serif;transform:rotate(-5deg);box-shadow:0 0 24rpx rgba(224,184,86,.2); }.head-title{margin-top:18rpx;color:#f3dfaa;font:700 48rpx STKaiti,serif;letter-spacing:7rpx}.head-subtitle{margin-top:8rpx;color:rgba(239,218,163,.64);font-size:22rpx;letter-spacing:3rpx}
.time-ripple{position:absolute;z-index:2;left:50%;bottom:-160rpx;width:430rpx;height:430rpx;margin-left:-215rpx;border:1rpx solid rgba(230,194,104,.38);border-radius:50%;animation:pulse 4s ease-out infinite}.time-ripple::before,.time-ripple::after{content:'';position:absolute;border:1rpx solid rgba(230,194,104,.28);border-radius:50%}.time-ripple::before{inset:58rpx}.time-ripple::after{inset:118rpx}.ripple-dot{position:absolute;left:50%;top:24rpx;width:12rpx;height:12rpx;border-radius:50%;background:#e8c26a;box-shadow:0 0 24rpx #e8c26a}
.paper-body{position:relative;margin-top:-16rpx;padding:38rpx 28rpx calc(48rpx + env(safe-area-inset-bottom));border-radius:34rpx 34rpx 0 0;background:linear-gradient(135deg,rgba(105,77,35,.04) 25%,transparent 25%) 0 0/20rpx 20rpx,#eee2c8}.intro-line{display:flex;justify-content:center;gap:14rpx;color:#8b713d;font-size:21rpx;letter-spacing:2rpx;margin-bottom:26rpx}.form-card{position:relative;padding:12rpx 30rpx 20rpx;border:1rpx solid rgba(174,129,44,.55);border-radius:26rpx 8rpx;background:rgba(250,243,224,.78);box-shadow:0 14rpx 38rpx rgba(62,45,20,.1),inset 0 0 0 5rpx rgba(255,255,255,.24)}
.field{padding:28rpx 0;border-bottom:1rpx solid rgba(139,106,48,.2)}.field-label{display:flex;align-items:center;gap:12rpx;margin-bottom:16rpx;font:700 28rpx STKaiti,serif;letter-spacing:2rpx}.field-index{width:36rpx;height:36rpx;line-height:36rpx;text-align:center;border-radius:50%;color:#f7e8bf;background:#253758;font-size:20rpx}.picker-box{min-height:92rpx;padding:0 22rpx;display:flex;align-items:center;justify-content:space-between;border:1rpx solid rgba(167,126,51,.4);border-radius:14rpx;background:rgba(255,252,241,.7)}.picker-box.placeholder .picker-main{color:#948873}.picker-main,.picker-note,.gender-name,.gender-note,.toggle-title,.toggle-note{display:block}.picker-main{font-size:29rpx;color:#233657}.picker-note{margin-top:5rpx;color:#9c7d43;font-size:20rpx}.picker-arrow{color:#9a7432;font-size:34rpx}
.gender-tabs{display:flex;gap:18rpx}.gender-item{flex:1;padding:20rpx;display:flex;align-items:center;gap:14rpx;border:1rpx solid rgba(160,123,55,.28);border-radius:16rpx;background:rgba(255,252,242,.45);transition:.25s}.gender-item.active{border-color:#a87b2d;background:#203556;color:#f3dfaa;box-shadow:0 8rpx 20rpx rgba(25,47,79,.18)}.gender-symbol{width:58rpx;height:58rpx;line-height:58rpx;text-align:center;border:1rpx solid currentColor;border-radius:50%;font:32rpx/58rpx STKaiti,serif}.gender-name{font:700 28rpx STKaiti,serif}.gender-note{margin-top:3rpx;color:#988665;font-size:19rpx}.active .gender-note{color:rgba(241,220,166,.58)}
.calendar-toggle{display:flex;justify-content:space-between;align-items:center;padding:28rpx 0 8rpx}.toggle-title{font:700 27rpx STKaiti,serif}.toggle-note{max-width:470rpx;margin-top:5rpx;color:#887b65;font-size:19rpx}.submit-btn{position:relative;height:104rpx;margin:34rpx 4rpx 0;border:none;border-radius:52rpx;color:#f6e7bd;background:linear-gradient(90deg,#172b4c,#2b4163,#172b4c);box-shadow:0 16rpx 30rpx rgba(18,41,73,.25),inset 0 0 0 2rpx rgba(224,188,99,.55);font:700 31rpx STKaiti,serif;letter-spacing:5rpx;overflow:hidden}.submit-btn::after{border:none}.submit-btn[disabled]{opacity:.45}.btn-star{margin-right:16rpx;color:#dfbd65}.btn-arrow{margin-left:16rpx}.btn-orbit{position:absolute;width:220rpx;height:220rpx;border:1rpx solid rgba(224,190,105,.18);border-radius:50%;left:50%;top:-58rpx;margin-left:-110rpx;animation:spin 12s linear infinite}.tips{margin:30rpx 14rpx 0;padding:22rpx 26rpx;border-left:4rpx solid #af8436;display:flex;flex-direction:column;gap:10rpx;color:#786c57;font-size:21rpx;line-height:1.55}.tips-title{color:#273856;font:700 26rpx STKaiti,serif;letter-spacing:2rpx}
@keyframes pulse{50%{opacity:.55;transform:scale(1.07)}}@keyframes spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.time-ripple,.btn-orbit{animation:none}}
</style>
