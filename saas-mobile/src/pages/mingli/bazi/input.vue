<template>
  <view class="bazi-input-page">
    <!-- Header -->
    <view class="page-header">
      <view class="header-icon">☯</view>
      <text class="header-title">八字排盘</text>
      <text class="header-subtitle">输入出生信息，精准解析命理</text>
    </view>

    <!-- Form Card -->
    <view class="form-card">
      <!-- Birth Date -->
      <view class="form-section">
        <view class="section-label">
          <text class="label-icon">📅</text>
          <text class="label-text">出生日期</text>
        </view>
        <picker mode="date" :value="formData.birthDate" :start="dateRange.start" :end="dateRange.end" @change="onDateChange">
          <view class="picker-value" :class="{ placeholder: !formData.birthDate }">
            <text>{{ formData.birthDate || '请选择出生日期' }}</text>
            <text class="picker-arrow">▸</text>
          </view>
        </picker>
      </view>

      <!-- Birth Time -->
      <view class="form-section">
        <view class="section-label">
          <text class="label-icon">🕐</text>
          <text class="label-text">出生时辰</text>
        </view>
        <picker :range="shiChenList" :range-key="'label'" :value="shiChenIndex" @change="onShiChenChange">
          <view class="picker-value" :class="{ placeholder: shiChenIndex < 0 }">
            <text>{{ shiChenIndex >= 0 ? shiChenList[shiChenIndex].label : '请选择出生时辰' }}</text>
            <text class="picker-arrow">▸</text>
          </view>
        </picker>
      </view>

      <!-- Gender -->
      <view class="form-section">
        <view class="section-label">
          <text class="label-icon">👤</text>
          <text class="label-text">性别</text>
        </view>
        <view class="gender-group">
          <view
            class="gender-btn"
            :class="{ active: formData.gender === 'male' }"
            @tap="formData.gender = 'male'"
          >
            <text class="gender-icon">♂</text>
            <text class="gender-text">男</text>
          </view>
          <view
            class="gender-btn"
            :class="{ active: formData.gender === 'female' }"
            @tap="formData.gender = 'female'"
          >
            <text class="gender-icon">♀</text>
            <text class="gender-text">女</text>
          </view>
        </view>
      </view>

      <!-- Lunar Calendar Toggle -->
      <view class="form-section toggle-section">
        <view class="section-label">
          <text class="label-icon">🌙</text>
          <text class="label-text">农历日期</text>
        </view>
        <switch :checked="formData.isLunar" color="#c9a44a" @change="onLunarToggle" />
      </view>
    </view>

    <!-- Submit Button -->
    <view class="submit-area">
      <button class="submit-btn" :disabled="!canSubmit" @tap="onSubmit">
        <text class="btn-text">开始排盘</text>
      </button>
    </view>

    <!-- Tips -->
    <view class="tips-card">
      <view class="tips-title">
        <text class="tips-icon">💡</text>
        <text class="tips-text">温馨提示</text>
      </view>
      <view class="tips-list">
        <text class="tip-item">• 请尽量选择准确的出生时辰，时辰影响时柱的推算</text>
        <text class="tip-item">• 如果不确定具体时辰，可选择"不确定"，系统将仅排年月日三柱</text>
        <text class="tip-item">• 八字排盘结果仅供参考，不作为重大决策依据</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const APP_ROUTES = {
  mingli: {
    bazi: {
      result: '/pages/mingli/bazi/result'
    }
  }
}

const shiChenList = [
  { label: '不确定', value: '' },
  { label: '子时 (23:00-01:00)', value: 'zi' },
  { label: '丑时 (01:00-03:00)', value: 'chou' },
  { label: '寅时 (03:00-05:00)', value: 'yin' },
  { label: '卯时 (05:00-07:00)', value: 'mao' },
  { label: '辰时 (07:00-09:00)', value: 'chen' },
  { label: '巳时 (09:00-11:00)', value: 'si' },
  { label: '午时 (11:00-13:00)', value: 'wu' },
  { label: '未时 (13:00-15:00)', value: 'wei' },
  { label: '申时 (15:00-17:00)', value: 'shen' },
  { label: '酉时 (17:00-19:00)', value: 'you' },
  { label: '戌时 (19:00-21:00)', value: 'xu' },
  { label: '亥时 (21:00-23:00)', value: 'hai' }
]

const shiChenIndex = ref(-1)

const formData = ref({
  birthDate: '',
  birthTime: '',
  gender: 'male' as 'male' | 'female',
  isLunar: false
})

const dateRange = computed(() => ({
  start: '1920-01-01',
  end: new Date().toISOString().slice(0, 10)
}))

const canSubmit = computed(() => {
  return !!formData.value.birthDate
})

function onDateChange(e: any) {
  formData.value.birthDate = e.detail.value
}

function onShiChenChange(e: any) {
  shiChenIndex.value = e.detail.value
  formData.value.birthTime = shiChenList[e.detail.value].value
}

function onLunarToggle(e: any) {
  formData.value.isLunar = e.detail.value
}

function onSubmit() {
  if (!canSubmit.value) {
    uni.showToast({ title: '请选择出生日期', icon: 'none' })
    return
  }

  const params: Record<string, string> = {
    birthDate: formData.value.birthDate,
    gender: formData.value.gender,
    isLunar: formData.value.isLunar ? '1' : '0'
  }
  if (formData.value.birthTime) {
    params.birthTime = formData.value.birthTime
  }

  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')

  uni.navigateTo({
    url: `${APP_ROUTES.mingli.bazi.result}?${query}`
  })
}
</script>

<style lang="scss" scoped>
.bazi-input-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a1628 0%, #111d35 30%, #0f1a30 100%);
  padding: 0 32rpx 60rpx;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0 48rpx;
}

.header-icon {
  font-size: 72rpx;
  margin-bottom: 16rpx;
}

.header-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #c9a44a;
  letter-spacing: 8rpx;
  margin-bottom: 12rpx;
}

.header-subtitle {
  font-size: 26rpx;
  color: rgba(201, 164, 74, 0.6);
  letter-spacing: 2rpx;
}

.form-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(201, 164, 74, 0.2);
  border-radius: 24rpx;
  padding: 20rpx 32rpx;
  backdrop-filter: blur(20rpx);
}

.form-section {
  padding: 28rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);

  &:last-of-type {
    border-bottom: none;
  }
}

.section-label {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.label-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.label-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.picker-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(201, 164, 74, 0.15);
  border-radius: 16rpx;
  font-size: 30rpx;
  color: #ffffff;
  transition: all 0.2s;

  &.placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
}

.picker-arrow {
  font-size: 24rpx;
  color: rgba(201, 164, 74, 0.5);
}

.gender-group {
  display: flex;
  gap: 24rpx;
}

.gender-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(201, 164, 74, 0.15);
  border-radius: 16rpx;
  transition: all 0.25s;

  &.active {
    background: rgba(201, 164, 74, 0.15);
    border-color: #c9a44a;
    box-shadow: 0 0 20rpx rgba(201, 164, 74, 0.2);
  }
}

.gender-icon {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.5);

  .active & {
    color: #c9a44a;
  }
}

.gender-text {
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;

  .active & {
    color: #c9a44a;
  }
}

.toggle-section {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .section-label {
    margin-bottom: 0;
  }
}

.submit-area {
  padding: 48rpx 0 32rpx;
}

.submit-btn {
  width: 100%;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #c9a44a 0%, #b8902e 50%, #c9a44a 100%);
  border: none;
  border-radius: 50rpx;
  box-shadow: 0 8rpx 32rpx rgba(201, 164, 74, 0.3);
  transition: all 0.3s;

  &[disabled] {
    opacity: 0.4;
    box-shadow: none;
  }

  &:active:not([disabled]) {
    transform: scale(0.98);
    box-shadow: 0 4rpx 16rpx rgba(201, 164, 74, 0.2);
  }
}

.btn-text {
  font-size: 34rpx;
  font-weight: 700;
  color: #0a1628;
  letter-spacing: 6rpx;
}

.tips-card {
  background: rgba(201, 164, 74, 0.06);
  border: 1rpx solid rgba(201, 164, 74, 0.12);
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
}

.tips-title {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.tips-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.tips-text {
  font-size: 26rpx;
  color: #c9a44a;
  font-weight: 500;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.tip-item {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.6;
}
</style>
