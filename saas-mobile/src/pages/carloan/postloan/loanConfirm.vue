<template>
  <app-page nav-title="请款确认">
    <view class="confirm-page">
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">订单编号</text>
          <text class="info-value">{{ detail.applicationNo || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">客户姓名</text>
          <text class="info-value">{{ detail.customerName || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">审批金额</text>
          <text class="info-value highlight">¥{{ formatMoney(detail.approvedAmount) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">放款状态</text>
          <u-tag :text="detail.disbursement?.status || '待申请'" type="primary" size="mini" />
        </view>
      </view>

      <view v-if="detail.disbursement" class="info-card">
        <view class="card-title">放款信息</view>
        <view class="info-row">
          <text class="info-label">GPS设备号</text>
          <text class="info-value">{{ detail.disbursement.gpsDeviceNo || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">抵押状态</text>
          <text class="info-value">{{ detail.disbursement.mortgageStatus || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">放款金额</text>
          <text class="info-value">¥{{ formatMoney(detail.disbursement.disburseAmount) }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">放款账户</text>
          <text class="info-value">{{ detail.disbursement.disburseAccount || '-' }}</text>
        </view>
      </view>

      <view class="btn-wrap">
        <u-button type="primary" shape="circle" :loading="submitting" @click="handleSubmit">
          确认请款
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCarloanApi } from '@/api/carloan'

const businessApi = useCarloanApi()
const applicationId = ref('')
const detail = ref<any>({})
const submitting = ref(false)

function formatMoney(val: any) {
  return val ? Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '0.00'
}

onLoad((options: any) => {
  applicationId.value = options?.applicationId || ''
})

onMounted(async () => {
  if (!applicationId.value) return
  try {
    const res = await businessApi.getApplicationDetail(applicationId.value)
    detail.value = res?.data || res || {}
  } catch (e) {
    console.error('获取详情失败', e)
  }
})

async function handleSubmit() {
  submitting.value = true
  try {
    await businessApi.submitLoanRequest(applicationId.value)
    uni.showToast({ title: '请款提交成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1000)
  } catch (e) {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.confirm-page {
  min-height: 100%;
  padding: 24rpx;
  background: #f5f7fa;
}
.info-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.card-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}
.info-label {
  font-size: 28rpx;
  color: #999;
}
.info-value {
  font-size: 28rpx;
  color: #333;
}
.info-value.highlight {
  color: var(--u-type-primary, #3c9cff);
  font-weight: 600;
}
.btn-wrap {
  padding: 0 24rpx;
}
</style>
