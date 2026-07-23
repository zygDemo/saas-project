<template>
  <app-page nav-title="请款确认">
    <view class="confirm-page">
      <!-- 基本信息 -->
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">订单编号</text>
          <text class="info-value">{{ detail.creditOrderId || detail.applicationNo || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">客户姓名</text>
          <text class="info-value">{{ detail.name || detail.customerName || '-' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">审批金额</text>
          <text class="info-value highlight">¥{{ detail.passQuota || detail.approvedAmount || '0.00' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">订单状态</text>
          <u-tag :text="statusLabel" :type="statusTagType" size="mini" />
        </view>
      </view>

      <!-- 放款信息（已有放款记录时显示） -->
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

      <!-- 审核中提示 -->
      <view v-if="isReviewing" class="status-banner reviewing">
        <text class="status-icon">⏳</text>
        <view class="status-text">
          <text class="status-title">请款审核中</text>
          <text class="status-desc">请款资料已提交，等待审核通过</text>
        </view>
      </view>

      <!-- 已通过提示 -->
      <view v-if="isApproved" class="status-banner approved">
        <text class="status-icon">✅</text>
        <view class="status-text">
          <text class="status-title">请款已通过</text>
          <text class="status-desc">请款审核已通过，可进行后续放款操作</text>
        </view>
      </view>

      <!-- 已拒绝提示 -->
      <view v-if="isRejected" class="status-banner rejected">
        <text class="status-icon">❌</text>
        <view class="status-text">
          <text class="status-title">请款被拒绝</text>
          <text class="status-desc">{{ detail.approvalRemark || detail.remark || '请款审核未通过，请修改后重新提交' }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="btn-wrap">
        <u-button
          v-if="canSubmit"
          type="primary"
          shape="circle"
          :loading="submitting"
          @click="handleSubmit"
        >
          确认请款
        </u-button>

        <u-button
          v-if="isReviewing"
          type="default"
          shape="circle"
          disabled
        >
          请款审核中
        </u-button>

        <u-button
          v-if="isApproved"
          type="primary"
          shape="circle"
          @click="goToDisbursement"
        >
          确认放款
        </u-button>

        <u-button
          v-if="isRejected"
          type="warning"
          shape="circle"
          :loading="submitting"
          @click="handleSubmit"
        >
          重新提交请款
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCarloanApi } from '@/api/carloan'
import { showFailToast, showSuccessToast } from '@/composables/useGlobalLoadingToast'

const businessApi = useCarloanApi()

/**
 * 后端 mapApplication 返回字段：
 * - status: number (1=成功, 2=失败, 3=补件, 4=处理中)
 * - currentNode: number (流程节点编码，1700=请款)
 * - currentStatus: number (10=待处理, 20=通过, 30=拒绝)
 * - name, creditOrderId, passQuota, remark, approvalRemark
 */
const applicationId = ref('')
const detail = ref<Record<string, any>>({})
const submitting = ref(false)

// 流程节点常量
const NODE_LOAN_REQUEST = 1700
const NODE_DISBURSEMENT = 1800

// 状态常量
const STATUS_PENDING = 10
const STATUS_PASSED = 20
const STATUS_REJECTED = 30

const currentNode = computed(() => Number(detail.value.currentNode) || 0)
const currentStatus = computed(() => Number(detail.value.currentStatus) || 0)

// 可提交：节点 < 1700（还未到请款）或 节点=1700 且状态=待处理/拒绝
const canSubmit = computed(() => {
  const node = currentNode.value
  const status = currentStatus.value
  if (node > 0 && node < NODE_LOAN_REQUEST) return true
  if (node === NODE_LOAN_REQUEST && (status === STATUS_PENDING || status === STATUS_REJECTED)) return true
  return false
})

// 审核中：节点=1700 且状态=待处理（已提交过）
const isReviewing = computed(() => {
  return currentNode.value === NODE_LOAN_REQUEST && currentStatus.value === STATUS_PENDING && detail.value.status === 4
})

// 已通过：节点>=1800 或 节点=1700 且状态=通过
const isApproved = computed(() => {
  const node = currentNode.value
  const status = currentStatus.value
  if (node >= NODE_DISBURSEMENT) return true
  if (node === NODE_LOAN_REQUEST && status === STATUS_PASSED) return true
  return false
})

// 已拒绝：节点=1700 且状态=拒绝
const isRejected = computed(() => {
  return currentNode.value === NODE_LOAN_REQUEST && currentStatus.value === STATUS_REJECTED
})

const statusLabel = computed(() => {
  if (isReviewing.value) return '请款审核中'
  if (isApproved.value) return '请款已通过'
  if (isRejected.value) return '请款被拒绝'
  if (currentNode.value < NODE_LOAN_REQUEST) return '待请款'
  return '待请款'
})

const statusTagType = computed(() => {
  if (isReviewing.value) return 'warning'
  if (isApproved.value) return 'success'
  if (isRejected.value) return 'error'
  return 'primary'
})

function formatMoney(val: string | number | undefined) {
  return val ? Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '0.00'
}

onLoad((options?: Record<string, string | undefined>) => {
  applicationId.value = options?.applicationId || ''
})

onMounted(async () => {
  if (!applicationId.value) return
  try {
    const res = await businessApi.getApplicationDetail(applicationId.value)
    const data = ((res as unknown) as Record<string, unknown>)?.data ?? res ?? {}
    detail.value = (data || {}) as Record<string, any>
  } catch (e) {
    console.error('获取详情失败', e)
    showFailToast('获取订单信息失败')
  }
})

async function handleSubmit() {
  submitting.value = true
  try {
    await businessApi.submitLoanRequest(applicationId.value)
    showSuccessToast('请款提交成功')
    // 刷新状态
    const res = await businessApi.getApplicationDetail(applicationId.value)
    const data = ((res as unknown) as Record<string, unknown>)?.data ?? res ?? {}
    detail.value = (data || {}) as Record<string, any>
  } catch (e) {
    showFailToast('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

function goToDisbursement() {
  uni.navigateTo({
    url: `/pages/carloan/postloan/repaymentPlan?applicationId=${applicationId.value}`
  })
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
.status-banner {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  gap: 16rpx;
  &.reviewing {
    background: #fff8e6;
    border: 1rpx solid #ffe0a3;
  }
  &.approved {
    background: #e8f8e8;
    border: 1rpx solid #a3e0a3;
  }
  &.rejected {
    background: #ffe8e8;
    border: 1rpx solid #e0a3a3;
  }
}
.status-icon {
  font-size: 40rpx;
}
.status-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.status-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}
.status-desc {
  font-size: 24rpx;
  color: #999;
}
.btn-wrap {
  padding: 0 24rpx;
}
</style>
