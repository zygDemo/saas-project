<template>
  <view class="credit-index-page">
    <view class="card">
      <view class="card-title">征信查询</view>
      <view class="card-desc">支持个人征信查询，快速获取信用报告</view>

      <u-form :model="form" label-width="160">
        <u-form-item label="姓名" prop="name">
          <u-input v-model="form.name" placeholder="请输入姓名"></u-input>
        </u-form-item>
        <u-form-item label="身份证号" prop="idcard">
          <u-input v-model="form.idcard" placeholder="请输入身份证号码"></u-input>
        </u-form-item>
        <u-form-item label="手机号" prop="phone">
          <u-input v-model="form.phone" placeholder="请输入手机号码"></u-input>
        </u-form-item>
        <u-form-item label="验证码" prop="code">
          <view class="code-wrapper">
            <u-input v-model="form.code" placeholder="请输入验证码"></u-input>
            <u-button
              :text="countdown > 0 ? `${countdown}s后重试` : '获取验证码'"
              size="small"
              type="primary"
              :disabled="countdown > 0"
              @click="sendCode"
            ></u-button>
          </view>
        </u-form-item>
      </u-form>

      <u-button
        text="立即查询"
        type="primary"
        :disabled="!canQuery"
        @click="doQuery"
      ></u-button>

      <view class="notice">
        <text>查询结果仅作参考，请以官方报告为准</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const form = ref({
  name: "",
  idcard: "",
  phone: "",
  code: "",
});

const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const canQuery = computed(() => {
  return (
    form.value.name.trim().length > 0 &&
    form.value.idcard.trim().length === 18 &&
    form.value.phone.trim().length === 11 &&
    form.value.code.trim().length === 6
  );
});

const clearTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const sendCode = () => {
  if (form.value.phone.trim().length !== 11) {
    uni.showToast({ title: "请输入正确手机号", icon: "none" });
    return;
  }

  countdown.value = 60;
  uni.showToast({ title: "验证码已发送", icon: "success" });

  clearTimer();
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0) {
      clearTimer();
      countdown.value = 0;
    }
  }, 1000);
};

const doQuery = () => {
  const query = `?name=${encodeURIComponent(form.value.name)}&idcard=${encodeURIComponent(form.value.idcard)}`;
  uni.navigateTo({ url: `/pages/credit/query/result${query}` });
};
</script>

<style scoped lang="scss">
.credit-index-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12rpx;
}

.card-desc {
  font-size: 26rpx;
  color: #909399;
  margin-bottom: 40rpx;
}

.code-wrapper {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.notice {
  margin-top: 40rpx;
  padding: 20rpx;
  background: #f0f9ff;
  border-radius: 8rpx;
  text-align: center;

  text {
    font-size: 24rpx;
    color: #409eff;
  }
}
</style>
