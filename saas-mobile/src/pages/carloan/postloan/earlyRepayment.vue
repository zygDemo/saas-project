<template>
  <app-page nav-title="提前还款">
    <view class="early-page">
      <view class="form-section">
        <u-form :model="form" ref="formRef">
          <u-form-item label="还款方式" prop="type">
            <u-radio-group v-model="form.repayType">
              <u-radio name="FULL">全部提前还款</u-radio>
              <u-radio name="PARTIAL">部分提前还款</u-radio>
            </u-radio-group>
          </u-form-item>
          <u-form-item label="还款金额" prop="amount">
            <u-input v-model="form.amount" type="digit" placeholder="请输入还款金额" />
          </u-form-item>
          <u-form-item label="本金" prop="principal">
            <u-input v-model="form.principal" type="digit" placeholder="请输入本金" />
          </u-form-item>
          <u-form-item label="利息" prop="interest">
            <u-input v-model="form.interest" type="digit" placeholder="请输入利息" />
          </u-form-item>
          <u-form-item label="违约金" prop="penalty">
            <u-input v-model="form.penalty" type="digit" placeholder="如有违约金请填写" />
          </u-form-item>
          <u-form-item label="申请原因" prop="reason">
            <u-input v-model="form.reason" type="textarea" placeholder="请输入申请原因" />
          </u-form-item>
        </u-form>
      </view>
      <view class="btn-wrap">
        <u-button type="primary" shape="circle" :loading="submitting" @click="handleSubmit">
          提交申请
        </u-button>
      </view>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useCarloanApi } from '@/api/carloan'

const businessApi = useCarloanApi()
const applicationId = ref('')
const submitting = ref(false)

const form = reactive({
  repayType: 'FULL',
  amount: '',
  principal: '',
  interest: '',
  penalty: '',
  reason: '',
})

onLoad((options: any) => {
  applicationId.value = options?.applicationId || ''
})

async function handleSubmit() {
  if (!form.amount || Number(form.amount) <= 0) {
    uni.showToast({ title: '请输入还款金额', icon: 'none' })
    return
  }
  if (!form.principal || Number(form.principal) <= 0) {
    uni.showToast({ title: '请输入本金', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await businessApi.applyEarlyRepayment({
      applicationId: Number(applicationId.value),
      repayType: form.repayType,
      amount: Number(form.amount),
      principal: Number(form.principal),
      interest: Number(form.interest || 0),
      penalty: Number(form.penalty || 0),
      reason: form.reason,
    })
    uni.showToast({ title: '申请提交成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1000)
  } catch (e) {
    uni.showToast({ title: '提交失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.early-page {
  min-height: 100%;
  padding: 24rpx;
  background: #f5f7fa;
}
.form-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
}
.btn-wrap {
  padding: 0 24rpx;
}
</style>
