<template>
  <view class="person-card">
    <text v-if="title" class="person-label">{{ title }}</text>
    <view class="field">
      <view class="field-label"><text class="field-index">壹</text><text>出生日期</text></view>
      <picker mode="date" :value="modelValue.birthDate" :start="dateRange.start" :end="dateRange.end" :aria-label="`${title || ''}出生日期选择器，当前为${displayDate}`" @change="onDateChange">
        <view class="picker-box" :class="{ placeholder: !modelValue.birthDate }" role="button" :aria-label="`${title || ''}出生日期，${displayDate}`">
          <view>
            <text class="picker-main">{{ displayDate }}</text>
            <text v-if="modelValue.birthDate && showLunarToggle" class="picker-note">{{ modelValue.isLunar ? '农历日期' : '公历日期' }}</text>
          </view>
          <text class="picker-arrow" aria-hidden="true">⌄</text>
        </view>
      </picker>
    </view>

    <view class="field">
      <view class="field-label"><text class="field-index">贰</text><text>出生时辰</text></view>
      <picker :range="SHI_CHEN_LIST" range-key="label" :value="shiChenIndex" :aria-label="`${title || ''}出生时辰选择器，当前为${displayTime}`" @change="onShiChenChange">
        <view class="picker-box" :class="{ placeholder: shiChenIndex < 0 }" role="button" :aria-label="`${title || ''}出生时辰，${displayTime}`">
          <view>
            <text class="picker-main">{{ displayTime }}</text>
            <text v-if="shiChenIndex >= 0" class="picker-note">{{ selectedShiChen?.range }}</text>
          </view>
          <text class="picker-arrow" aria-hidden="true">⌄</text>
        </view>
      </picker>
    </view>

    <view v-if="showGender" class="field" role="radiogroup" :aria-label="`${title || ''}命主性别`">
      <view class="field-label"><text class="field-index">叁</text><text>命主性别</text></view>
      <view class="gender-tabs">
        <view class="gender-item" :class="{ active: modelValue.gender === 'male' }" role="radio" :aria-checked="modelValue.gender === 'male'" :tabindex="0" @tap="updateField('gender', 'male')">
          <text class="gender-symbol" aria-hidden="true">乾</text>
          <view>
            <text class="gender-name">男命</text>
            <text class="gender-note">阳刚之序</text>
          </view>
        </view>
        <view class="gender-item" :class="{ active: modelValue.gender === 'female' }" role="radio" :aria-checked="modelValue.gender === 'female'" :tabindex="0" @tap="updateField('gender', 'female')">
          <text class="gender-symbol" aria-hidden="true">坤</text>
          <view>
            <text class="gender-name">女命</text>
            <text class="gender-note">阴柔之序</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showLunarToggle" class="calendar-toggle">
      <view>
        <text class="toggle-title">农历输入</text>
        <text class="toggle-note">开启后按农历日期记录（当前算法按公历近似推演）</text>
      </view>
      <switch :checked="modelValue.isLunar" color="#29b6f6" :aria-label="`${title || ''}农历输入开关`" @change="onLunarToggle" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SHI_CHEN_LIST } from '@/common/mingli/shichen'

export interface PersonFormData {
  birthDate: string
  birthHour: number
  gender?: 'male' | 'female'
  isLunar?: boolean
}

interface Props {
  title?: string
  modelValue: PersonFormData
  showGender?: boolean
  showLunarToggle?: boolean
  dateRange?: { start: string; end: string }
}

const props = withDefaults(defineProps<Props>(), {
  showGender: false,
  showLunarToggle: false,
  dateRange: () => ({ start: '1920-01-01', end: new Date().toISOString().slice(0, 10) }),
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: PersonFormData): void
}>()

const shiChenIndex = computed(() => {
  const idx = SHI_CHEN_LIST.findIndex(item => item.value === props.modelValue.birthHour)
  return idx >= 0 ? idx : -1
})

const selectedShiChen = computed(() => (shiChenIndex.value >= 0 ? SHI_CHEN_LIST[shiChenIndex.value] : undefined))
const displayDate = computed(() => props.modelValue.birthDate || '请选择出生日期')
const displayTime = computed(() => selectedShiChen.value?.label || '请选择出生时辰')

function updateField<K extends keyof PersonFormData>(key: K, value: PersonFormData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function onDateChange(event: { detail: { value: string } }) {
  updateField('birthDate', event.detail.value)
}

function onShiChenChange(event: { detail: { value: string | number } }) {
  const index = Number(event.detail.value)
  const item = SHI_CHEN_LIST[index]
  if (item) {
    emit('update:modelValue', { ...props.modelValue, birthHour: item.value })
  }
}

function onLunarToggle(event: { detail: { value: boolean } }) {
  updateField('isLunar', event.detail.value)
}
</script>

<style scoped lang="scss">
.person-card {
  margin-top: 28rpx;
  padding: 32rpx;
  border: 1rpx solid rgba(79, 195, 247, .28);
  border-radius: 24rpx 8rpx;
  background: linear-gradient(135deg, rgba(16, 28, 56, .86), rgba(10, 18, 38, .92));
  box-shadow: 0 14rpx 34rpx rgba(0, 0, 0, .18), inset 0 0 0 1rpx rgba(255, 255, 255, .05);
}

.person-label {
  display: block;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid rgba(79, 195, 247, .14);
  font: 700 34rpx STKaiti, KaiTi, serif;
  color: var(--ming-text-primary);
  letter-spacing: 4rpx;
  text-shadow: 0 0 8rpx rgba(79, 195, 247, .2);
}

.field {
  margin-bottom: 28rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.field-label {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 18rpx;
  font: 700 29rpx STKaiti, serif;
  letter-spacing: 2rpx;
  color: var(--ming-text-primary);
  text-shadow: 0 0 10rpx rgba(79, 195, 247, .22);
}

.field-index {
  width: 42rpx;
  height: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(79, 195, 247, .16);
  color: var(--ming-cyan);
  font-size: 22rpx;
  font-weight: 700;
}

.picker-box {
  position: relative;
  padding: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1rpx solid rgba(79, 195, 247, .22);
  border-radius: 16rpx;
  background: rgba(10, 16, 34, .55);
  transition: all .3s;

  &:active {
    border-color: rgba(79, 195, 247, .45);
    background: rgba(10, 16, 34, .75);
  }
}

.picker-main {
  color: var(--ming-text-primary);
  font-size: 27rpx;
  letter-spacing: 1rpx;
}

.picker-box.placeholder .picker-main {
  color: rgba(255, 255, 255, .82);
}

.picker-note {
  margin-left: 14rpx;
  color: var(--ming-cyan);
  font-size: 20rpx;
}

.picker-arrow {
  color: var(--ming-cyan);
  font-size: 32rpx;
  line-height: 1;
}

.gender-tabs {
  display: flex;
  gap: 22rpx;
}

.gender-item {
  flex: 1;
  padding: 22rpx;
  display: flex;
  align-items: center;
  gap: 14rpx;
  border: 1rpx solid rgba(79, 195, 247, .18);
  border-radius: 16rpx;
  background: rgba(10, 16, 34, .45);
  color: var(--ming-text-primary);
  transition: .25s;

  &.active {
    border-color: var(--ming-cyan);
    background: rgba(41, 182, 246, .18);
    box-shadow: 0 0 18rpx rgba(79, 195, 247, .22);
  }
}

.gender-symbol {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(79, 195, 247, .12);
  color: var(--ming-cyan);
  font: 700 28rpx STKaiti, serif;
}

.gender-name {
  display: block;
  font-size: 27rpx;
  font-weight: 600;
  color: var(--ming-text-primary);
}

.gender-note {
  display: block;
  margin-top: 3rpx;
  color: rgba(255, 255, 255, .82);
  font-size: 19rpx;
}

.calendar-toggle {
  margin-top: 8rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid rgba(79, 195, 247, .14);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.toggle-title {
  display: block;
  color: var(--ming-text-primary);
  font-size: 27rpx;
  font-weight: 600;
  text-shadow: 0 0 8rpx rgba(79, 195, 247, .2);
}

.toggle-note {
  display: block;
  max-width: 470rpx;
  margin-top: 5rpx;
  color: rgba(255, 255, 255, .82);
  font-size: 19rpx;
  line-height: 1.5;
}
</style>
