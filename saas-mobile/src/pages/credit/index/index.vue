<template>
  <layout :active-tab="0" nav-title="征信查询" show-tabbar tabbar-scope="credit">
    <view class="credit-page">
      <!-- 顶部横幅 -->
      <view class="hero-banner">
        <view class="hero-bg" />
        <view class="hero-content">
          <u-icon name="lock" color="#fff" size="48" />
          <view class="hero-text">
            <text class="hero-title">征信查询</text>
            <text class="hero-desc">支持个人征信查询，快速获取信用报告</text>
          </view>
        </view>
      </view>

      <!-- 查询表单 -->
      <view class="form-card">
        <view class="form-header">
          <view class="form-header__mark" />
          <text class="form-header__title">填写查询信息</text>
        </view>

        <u-form :model="form" label-width="160">
          <u-form-item label="姓名" prop="name">
            <u-input v-model="form.name" placeholder="请输入姓名" />
          </u-form-item>
          <u-form-item label="身份证号" prop="idcard">
            <u-input v-model="form.idcard" placeholder="请输入18位身份证号码" />
          </u-form-item>
          <u-form-item label="手机号" prop="phone">
            <u-input v-model="form.phone" placeholder="请输入手机号码" />
          </u-form-item>
          <u-form-item label="验证码" prop="code">
            <view class="code-wrapper">
              <u-input v-model="form.code" placeholder="请输入验证码" />
              <u-button
                :text="countdown > 0 ? `${countdown}s` : '获取验证码'"
                size="small"
                type="primary"
                :disabled="countdown > 0"
                @click="sendCode"
              />
            </view>
          </u-form-item>
        </u-form>

        <u-button
          text="立即查询"
          type="primary"
          :disabled="!canQuery"
          @click="doQuery"
        />
      </view>

      <!-- 提示信息 -->
      <view class="notice-card">
        <u-icon name="info-circle" color="var(--u-type-primary)" size="28" />
        <text class="notice-text">查询结果仅作参考，请以官方征信中心报告为准</text>
      </view>

      <!-- 服务说明 -->
      <view class="service-card">
        <view class="service-header">
          <view class="service-header__mark" />
          <text class="service-header__title">服务说明</text>
        </view>
        <view class="service-list">
          <view class="service-item">
            <u-icon name="checkmark-circle" color="var(--u-type-success)" size="28" />
            <text>正规渠道查询，数据安全有保障</text>
          </view>
          <view class="service-item">
            <u-icon name="checkmark-circle" color="var(--u-type-success)" size="28" />
            <text>快速生成报告，实时查看结果</text>
          </view>
          <view class="service-item">
            <u-icon name="checkmark-circle" color="var(--u-type-success)" size="28" />
            <text>支持多次查询，随时掌握信用状况</text>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/components/layout/layout.vue";
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { CurrentSystem, useLocalStore } from "@/stores/local";

const form = ref({
  name: "",
  idcard: "",
  phone: "",
  code: "",
});

const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;
const localStore = useLocalStore();

onLoad(() => {
  localStore.setCurrentSystem(CurrentSystem.CREDIT);
});

onShow(() => {
  localStore.setCurrentSystem(CurrentSystem.CREDIT);
});

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
.credit-page {
  min-height: 100%;
  background-color: #f5f7fa;
  padding-bottom: 30rpx;
}

// 顶部横幅
.hero-banner {
  position: relative;
  padding: 40rpx 30rpx;
  overflow: hidden;

  .hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--u-type-primary-dark), var(--u-type-primary-disabled));
    border-radius: 0 0 30rpx 30rpx;
  }

  .hero-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 24rpx;
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .hero-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #fff;
  }

  .hero-desc {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

// 表单卡片
.form-card {
  margin: 30rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 30rpx;

  &__mark {
    width: 8rpx;
    height: 28rpx;
    border-radius: 4rpx;
    background: var(--u-type-primary);
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
  }
}

.code-wrapper {
  display: flex;
  align-items: center;
  gap: 20rpx;
  width: 100%;
}

// 提示卡片
.notice-card {
  margin: 0 30rpx 30rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx;
  background: #f0f9ff;
  border-radius: 12rpx;

  .notice-text {
    font-size: 24rpx;
    color: var(--u-type-primary);
  }
}

// 服务说明
.service-card {
  margin: 0 30rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.service-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 24rpx;

  &__mark {
    width: 8rpx;
    height: 28rpx;
    border-radius: 4rpx;
    background: var(--u-type-primary);
  }

  &__title {
    font-size: 30rpx;
    font-weight: 600;
    color: #303133;
  }
}

.service-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 12rpx;

  text {
    font-size: 26rpx;
    color: #606266;
  }
}
</style>
