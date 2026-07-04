<template>
  <app-page nav-title="还款计划">
    <view class="repayment-page">
      <view class="summary-card">
        <view class="summary-row">
          <text class="summary-label">订单编号</text>
          <text class="summary-value">{{ applicationNo }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">客户姓名</text>
          <text class="summary-value">{{ customerName }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">贷款金额</text>
          <text class="summary-value highlight">¥{{ formatMoney(loanAmount) }}</text>
        </view>
      </view>

      <view class="plan-list">
        <view v-for="item in plans" :key="item.id" class="plan-card">
          <view class="plan-header">
            <text class="plan-period">第{{ item.period }}期</text>
            <u-tag :text="statusText(item.status)" :type="statusType(item.status)" size="mini" />
          </view>
          <view class="plan-body">
            <view class="plan-row">
              <text class="plan-label">应还日期</text>
              <text class="plan-value">{{ formatDate(item.dueDate) }}</text>
            </view>
            <view class="plan-row">
              <text class="plan-label">应还金额</text>
              <text class="plan-value">¥{{ formatMoney(item.totalAmount) }}</text>
            </view>
            <view class="plan-row">
              <text class="plan-label">已还金额</text>
              <text class="plan-value">¥{{ formatMoney(item.paidTotal) }}</text>
            </view>
            <view v-if="Number(item.penaltyAmount) > 0" class="plan-row">
              <text class="plan-label">违约金</text>
              <text class="plan-value danger">¥{{ formatMoney(item.penaltyAmount) }}</text>
            </view>
          </view>
        </view>
      </view>

      <u-empty v-if="!loading && plans.length === 0" mode="data" text="暂无还款计划" />
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCarloanApi } from '@/api/carloan'
import type { ApiResponse } from '@/api/carloan'

const businessApi = useCarloanApi()
interface RepaymentPlanItem {
  id: string | number;
  period: number;
  status: string;
  dueDate: string;
  totalAmount: string | number;
  paidTotal: string | number;
  penaltyAmount: string | number;
}

const loading = ref(true)
const plans = ref<RepaymentPlanItem[]>([])
const applicationId = ref('')
const applicationNo = ref('')
const customerName = ref('')
const loanAmount = ref('')

function formatMoney(val: string | number | undefined) {
  return val ? Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '0.00'
}

function formatDate(val: string | number | undefined) {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('zh-CN')
}

const STATUS_MAP: Record<string, { text: string; type: 'info' | 'primary' | 'warning' | 'success' | 'error' }> = {
  NOT_DUE: { text: '未到期', type: 'info' },
  PENDING: { text: '待还款', type: 'primary' },
  PARTIAL: { text: '部分还款', type: 'warning' },
  PAID: { text: '已还清', type: 'success' },
  OVERDUE: { text: '已逾期', type: 'error' },
  SETTLED: { text: '已结清', type: 'success' },
}

function statusText(status: string) {
  return STATUS_MAP[status]?.text || status
}

function statusType(status: string) {
  return (STATUS_MAP[status]?.type || 'info') as 'info' | 'primary' | 'warning' | 'success' | 'error'
}

onLoad((options?: Record<string, string | undefined>) => {
  applicationId.value = options?.applicationId || ''
  applicationNo.value = options?.applicationNo || ''
  customerName.value = options?.customerName || ''
  loanAmount.value = options?.loanAmount || ''
})

onMounted(async () => {
  if (!applicationId.value) return
  try {
    const res = await businessApi.getRepaymentPlans(applicationId.value)
    const list = Array.isArray(res) ? res : (res as ApiResponse<RepaymentPlanItem[]> | undefined)?.data
    plans.value = list ?? []
  } catch (e) {
    console.error('获取还款计划失败', e)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.repayment-page {
  min-height: 100%;
  padding: 24rpx;
  background: #f5f7fa;
}
.summary-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}
.summary-label {
  font-size: 28rpx;
  color: #999;
}
.summary-value {
  font-size: 28rpx;
  color: #333;
}
.summary-value.highlight {
  color: var(--u-type-primary, #3c9cff);
  font-weight: 600;
}
.plan-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.plan-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.plan-period {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}
.plan-body {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.plan-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.plan-label {
  font-size: 26rpx;
  color: #999;
}
.plan-value {
  font-size: 26rpx;
  color: #333;
}
.plan-value.danger {
  color: #e43d33;
}
</style>
