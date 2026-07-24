<template>
  <app-page nav-title="还款计划">
    <view class="repayment-page">
      <!-- 摘要卡片 -->
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
        <view class="summary-row">
          <text class="summary-label">还款进度</text>
          <text class="summary-value">{{ paidCount }}/{{ plans.length }}期</text>
        </view>
      </view>

      <!-- 还款计划列表 -->
      <view class="plan-list">
        <view
          v-for="item in plans"
          :key="item.id"
          class="plan-card"
          :class="{ 'plan-card--current': isCurrentPeriod(item), 'plan-card--paid': isPaid(item), 'plan-card--overdue': item.status === 'OVERDUE' }"
        >
          <view class="plan-header">
            <view class="plan-header-left">
              <text class="plan-period">第{{ item.period }}期</text>
              <u-tag :text="statusText(item.status)" :type="statusType(item.status)" size="mini" />
            </view>
            <button
              v-if="isCurrentPeriod(item)"
              class="repay-btn"
              size="mini"
              @click="openRepayForm(item)"
            >
              还款
            </button>
          </view>
          <view class="plan-body">
            <view class="plan-row">
              <text class="plan-label">应还日期</text>
              <text class="plan-value">{{ formatDate(item.dueDate) }}</text>
            </view>
            <view class="plan-row">
              <text class="plan-label">本金</text>
              <text class="plan-value">¥{{ formatMoney(item.principal) }}</text>
            </view>
            <view class="plan-row">
              <text class="plan-label">利息</text>
              <text class="plan-value">¥{{ formatMoney(item.interest) }}</text>
            </view>
            <view class="plan-row plan-row--total">
              <text class="plan-label">应还总额</text>
              <text class="plan-value highlight">¥{{ formatMoney(item.totalAmount) }}</text>
            </view>
            <view v-if="Number(item.paidTotal) > 0" class="plan-row">
              <text class="plan-label">已还金额</text>
              <text class="plan-value success">¥{{ formatMoney(item.paidTotal) }}</text>
            </view>
            <view v-if="Number(item.penaltyAmount) > 0" class="plan-row">
              <text class="plan-label">罚息</text>
              <text class="plan-value danger">¥{{ formatMoney(item.penaltyAmount) }}</text>
            </view>
            <view v-if="(item.overdueDays ?? 0) > 0" class="plan-row">
              <text class="plan-label">逾期天数</text>
              <text class="plan-value danger">{{ (item.overdueDays ?? 0) }}天</text>
            </view>
          </view>
        </view>
      </view>

      <u-empty v-if="!loading && plans.length === 0" mode="data" text="暂无还款计划" />
    </view>

    <!-- 还款弹窗 -->
    <u-popup v-model="showRepayForm" mode="bottom" border-radius="24" :mask-close-able="false">
      <view class="repay-popup">
        <view class="repay-popup__header">
          <text class="repay-popup__title">登记还款</text>
          <text class="repay-popup__close" @click="showRepayForm = false">✕</text>
        </view>

        <view class="repay-popup__info">
          <text class="repay-popup__info-label">第{{ currentPlan?.period }}期 应还</text>
          <text class="repay-popup__info-value">¥{{ formatMoney(currentPlan?.totalAmount) }}</text>
        </view>

        <view class="repay-popup__form">
          <view class="form-item">
            <text class="form-label">还款金额 *</text>
            <input
              v-model="repayForm.amount"
              type="digit"
              placeholder="请输入还款金额"
              class="form-input"
            />
          </view>
          <view class="form-item">
            <text class="form-label">还款方式 *</text>
            <view class="method-grid">
              <view
                v-for="m in payMethods"
                :key="m.value"
                class="method-item"
                :class="{ 'method-item--active': repayForm.paymentMethod === m.value }"
                @click="repayForm.paymentMethod = m.value"
              >
                <text>{{ m.label }}</text>
              </view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">交易流水号</text>
            <input v-model="repayForm.transactionNo" placeholder="选填" class="form-input" />
          </view>
          <view class="form-item">
            <text class="form-label">备注</text>
            <textarea v-model="repayForm.remark" placeholder="选填" class="form-textarea" />
          </view>
        </view>

        <view class="repay-popup__footer">
          <button class="cancel-btn" @click="showRepayForm = false">取消</button>
          <button class="confirm-btn" :loading="submitting" @click="submitRepay">确认还款</button>
        </view>
      </view>
    </u-popup>
  </app-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCarloanApi } from '@/api/carloan'
import type { ApiResponse } from '@/api/carloan'
import { showFailToast, showSuccessToast } from '@/composables/useGlobalLoadingToast'

const businessApi = useCarloanApi()

interface RepaymentPlanItem {
  id: string | number
  period: number
  status: string
  dueDate: string
  principal: string | number
  interest: string | number
  totalAmount: string | number
  paidTotal: string | number
  penaltyAmount: string | number
  overdueDays?: number
}

const loading = ref(true)
const plans = ref<RepaymentPlanItem[]>([])
const applicationId = ref('')
const applicationNo = ref('')
const customerName = ref('')
const loanAmount = ref('')
const showRepayForm = ref(false)
const submitting = ref(false)
const currentPlan = ref<RepaymentPlanItem | null>(null)

const repayForm = ref({
  amount: '',
  paymentMethod: 'BANK_TRANSFER',
  transactionNo: '',
  remark: ''
})

const payMethods = [
  { label: '银行转账', value: 'BANK_TRANSFER' },
  { label: '现金', value: 'CASH' },
  { label: '支付宝', value: 'ALIPAY' },
  { label: '微信', value: 'WECHAT' }
]

const paidCount = computed(() => plans.value.filter(p => p.status === 'PAID' || p.status === 'SETTLED').length)

function formatMoney(val: string | number | undefined | null) {
  return val ? Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '0.00'
}

function formatDate(val: string | number | undefined) {
  if (!val) return '-'
  return new Date(val).toLocaleDateString('zh-CN')
}

function isPaid(item: RepaymentPlanItem) {
  return item.status === 'PAID' || item.status === 'SETTLED'
}

function isCurrentPeriod(item: RepaymentPlanItem) {
  if (isPaid(item)) return false
  const firstUnpaid = plans.value.find(p => !isPaid(p))
  return firstUnpaid?.id === item.id
}

const STATUS_MAP: Record<string, { text: string; type: 'info' | 'primary' | 'warning' | 'success' | 'error' }> = {
  NOT_DUE: { text: '未到期', type: 'info' },
  PENDING: { text: '待还款', type: 'primary' },
  PARTIAL: { text: '部分还款', type: 'warning' },
  PAID: { text: '已还清', type: 'success' },
  OVERDUE: { text: '已逾期', type: 'error' },
  SETTLED: { text: '已结清', type: 'success' }
}

function statusText(status: string) {
  return STATUS_MAP[status]?.text || status
}

function statusType(status: string) {
  return (STATUS_MAP[status]?.type || 'info') as 'info' | 'primary' | 'warning' | 'success' | 'error'
}

function openRepayForm(item: RepaymentPlanItem) {
  currentPlan.value = item
  repayForm.value = {
    amount: String(item.totalAmount),
    paymentMethod: 'BANK_TRANSFER',
    transactionNo: '',
    remark: ''
  }
  showRepayForm.value = true
}

async function submitRepay() {
  if (!repayForm.value.amount || Number(repayForm.value.amount) <= 0) {
    showFailToast('请输入还款金额')
    return
  }
  if (!repayForm.value.paymentMethod) {
    showFailToast('请选择还款方式')
    return
  }
  submitting.value = true
  try {
    const plan = currentPlan.value
    await businessApi.registerRepayment({
      applicationId: Number(applicationId.value),
      amount: Number(repayForm.value.amount),
      principal: plan ? Number(plan.principal) : undefined,
      interest: plan ? Number(plan.interest) : undefined,
      penalty: plan && Number(plan.penaltyAmount) > 0 ? Number(plan.penaltyAmount) : undefined,
      paymentMethod: repayForm.value.paymentMethod,
      transactionNo: repayForm.value.transactionNo || undefined,
      remark: repayForm.value.remark || undefined
    })
    showSuccessToast('还款成功')
    showRepayForm.value = false
    // 刷新列表
    await loadPlans()
  } catch (e) {
    showFailToast('还款失败，请重试')
  } finally {
    submitting.value = false
  }
}

async function loadPlans() {
  if (!applicationId.value) return
  try {
    const res = await businessApi.getRepaymentPlans(applicationId.value)
    const list = Array.isArray(res) ? res : (res as ApiResponse<RepaymentPlanItem[]> | undefined)?.data
    plans.value = list ?? []
  } catch (e) {
    console.error('获取还款计划失败', e)
  }
}

onLoad((options?: Record<string, string | undefined>) => {
  applicationId.value = options?.applicationId || ''
  applicationNo.value = options?.applicationNo || ''
  customerName.value = options?.customerName || ''
  loanAmount.value = options?.loanAmount || ''
})

onMounted(async () => {
  loading.value = true
  await loadPlans()
  loading.value = false
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
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
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
  border-radius: 20rpx;
  padding: 24rpx;
  border-left: 6rpx solid transparent;
  &--current {
    border-left-color: var(--u-type-primary, #3c9cff);
    box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  }
  &--paid {
    opacity: 0.65;
  }
  &--overdue {
    border-left-color: #e43d33;
    background: #fff8f8;
  }
}
.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}
.plan-header-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
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
  &--total {
    padding-top: 8rpx;
    margin-top: 4rpx;
    border-top: 1rpx dashed #f0f0f0;
  }
}
.plan-label {
  font-size: 26rpx;
  color: #999;
}
.plan-value {
  font-size: 26rpx;
  color: #333;
  &.highlight {
    color: var(--u-type-primary, #3c9cff);
    font-weight: 600;
  }
  &.success {
    color: #07c160;
  }
  &.danger {
    color: #e43d33;
  }
}

// 还款按钮
.repay-btn {
  background: var(--u-type-primary, #3c9cff);
  color: #fff;
  font-size: 24rpx;
  padding: 8rpx 28rpx;
  border-radius: 28rpx;
  border: none;
  line-height: 1.5;
  &::after {
    border: none;
  }
}

// 还款弹窗
.repay-popup {
  padding: 24rpx;
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
  }
  &__title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }
  &__close {
    font-size: 32rpx;
    color: #999;
    padding: 8rpx;
  }
  &__info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 24rpx;
    background: #f5f7fa;
    border-radius: 20rpx;
    margin-bottom: 24rpx;
  }
  &__info-label {
    font-size: 28rpx;
    color: #666;
  }
  &__info-value {
    font-size: 32rpx;
    font-weight: 600;
    color: var(--u-type-primary, #3c9cff);
  }
  &__form {
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }
  &__footer {
    display: flex;
    gap: 20rpx;
    margin-top: 32rpx;
  }
}
.form-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.form-label {
  font-size: 26rpx;
  color: #666;
}
.form-input {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
}
.form-textarea {
  border: 1rpx solid #e0e0e0;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  font-size: 28rpx;
  height: 120rpx;
}
.method-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.method-item {
  padding: 24rpx 24rpx;
  border: 1rpx solid #e0e0e0;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #666;
  &--active {
    border-color: var(--u-type-primary, #3c9cff);
    color: var(--u-type-primary, #3c9cff);
    background: rgba(60, 156, 255, 0.06);
  }
}
.cancel-btn {
  flex: 1;
  background: #f5f5f5;
  color: #666;
  border-radius: 40rpx;
  font-size: 28rpx;
  &::after {
    border: none;
  }
}
.confirm-btn {
  flex: 2;
  background: var(--u-type-primary, #3c9cff);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  &::after {
    border: none;
  }
}
</style>
