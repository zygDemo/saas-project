<template>
  <app-page nav-title="新增线索" :show-nav-back="!isCustomerRole">
    <scroll-view class="lead-add-page" scroll-y>
      <!-- 顶部横幅 -->
      <view class="hero-banner">
        <view class="hero-bg">
          <view class="hero-circle hero-circle--1" />
          <view class="hero-circle hero-circle--2" />
          <view class="hero-circle hero-circle--3" />
        </view>
        <view class="hero-content">
          <view class="hero-tag">
            <text class="hero-tag-icon">🔥</text>
            <text>车主专享福利</text>
          </view>
          <view class="hero-title">有车就能贷</view>
          <view class="hero-subtitle">免费获取贷款方案</view>
          <view class="hero-desc">最快10分钟响应 · 专业顾问1对1服务</view>
        </view>
      </view>

      <!-- 额度展示 -->
      <view class="quota-card">
        <view class="quota-label">
          <view class="quota-label-line" />
          <text>最高可贷额度</text>
          <view class="quota-label-line" />
        </view>
        <view class="quota-amount">
          <text class="quota-symbol">¥</text>
          <text class="quota-number">50</text>
          <text class="quota-unit">万</text>
        </view>
        <view class="quota-info">日利率低至 0.02% | 期限灵活 3 -36期</view>
      </view>

      <!-- 表单区域 -->
      <view class="form-section">
        <view class="form-section-header">
          <text class="form-section-title">填写信息，获取贷款方案</text>
          <text class="form-section-sub">
            留下信息，专属顾问将在30分钟内与您联系
          </text>
        </view>
        <view class="form-card">
          <AppForm :modelValue="form" :items="formItems" />
        </view>

        <view class="footer-btn">
          <u-button
            :loading="submitLoading"
            class="submit-btn"
            @click="handleSubmit"
          >
            立即申请
          </u-button>
        </view>

        <!-- 底部说明 -->
        <view class="footer-tip">
          <u-icon name="info-circle" size="22" color="#bbb" />
          <text>您的信息仅用于贷款方案评估，严格保密</text>
        </view>
      </view>

      <!-- 卖点/特色图标 -->
      <view class="features-row">
        <view v-for="item in features" :key="item.title" class="feature-item">
          <view class="feature-icon">
            <u-icon :name="item.icon" size="38" color="#fff" />
          </view>
          <text class="feature-title">{{ item.title }}</text>
          <text class="feature-desc">{{ item.desc }}</text>
        </view>
      </view>
    </scroll-view>
  </app-page>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { $u } from "uview-pro";
import AppForm from "@/components/app-form/app-form.vue";
import { useCarloanApi } from "@/api/carloan";
import { useLocalStore, useSessionStore } from "@/stores";

const businessApi = useCarloanApi();
const localStore = useLocalStore();
const sessionStore = useSessionStore();

const submitLoading = ref(false);
const isCustomerRole = computed(() => {
  const roleTags = String(sessionStore.transferInfo?.roleTags || "");
  return roleTags === "客户" || roleTags.includes("客户");
});
const currentSalesmanId = computed(() => {
  return (
    localStore.userInfo?.userId ||
    Number(sessionStore.transferInfo?.salesmanId || 0) ||
    undefined
  );
});

const features = [
  { icon: "clock", title: "极速响应", desc: "最快10分钟联系" },
  { icon: "lock", title: "信息加密", desc: "数据安全有保障" },
  { icon: "account", title: "专业服务", desc: "顾问1对1对接" },
];

const form = reactive({
  name: "",
  phone: "",
  amount: "",
  provinceCity: "",
});

const formItems = [
  {
    key: "name",
    label: "客户姓名",
    placeholder: "请输入客户姓名",
    required: true,
  },
  {
    key: "phone",
    label: "手机号码",
    placeholder: "请输入客户手机号",
    required: true,
  },
  {
    key: "amount",
    label: "申请金额",
    placeholder: "请输入申请金额（元）",
    type: "number",
    required: true,
  },
  {
    key: "provinceCity",
    label: "所在省市",
    placeholder: "请选择所在省市",
    type: "city",
    required: true,
  },
];

const handleSubmit = async () => {
  if (!form.name.trim()) {
    $u.toast("请输入客户姓名", "error");
    return;
  }
  if (!form.phone.trim()) {
    $u.toast("请输入客户手机号", "error");
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) {
    $u.toast("请输入正确的手机号", "error");
    return;
  }
  if (!form.amount.trim()) {
    $u.toast("请输入申请金额", "error");
    return;
  }
  if (!form.provinceCity.trim()) {
    $u.toast("请选择所在省市", "error");
    return;
  }

  // 从 "省/市" 格式解析省市
  const parts = form.provinceCity.split("/");
  const province = parts[0] || "";
  const city = parts[1] || "";

  submitLoading.value = true;
  try {
    const res = await businessApi.addSalesLead({
      customerName: form.name.trim(),
      phone: form.phone.trim(),
      province,
      city,
      loanAmount: Number(form.amount),
      salesmanId: currentSalesmanId.value,
    });
    if (res?.code === 200) {
      $u.toast("线索保存成功", "success");
      setTimeout(() => {
        uni.navigateBack();
      }, 800);
    } else {
      $u.toast(res?.msg || "保存失败", "error");
    }
  } catch (e) {
    console.error("保存线索失败", e);
    $u.toast(e.data.msg || "保存失败！", "error");
  } finally {
    submitLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
// ===== 页面整体 =====
.lead-add-page {
  min-height: 100vh;
  background: #f2f3f8;
}

// ===== 顶部横幅 =====
.hero-banner {
  position: relative;
  padding: 60rpx 40rpx 80rpx;
  background: linear-gradient(
    160deg,
    var(--u-type-primary-dark),
    var(--u-type-primary) 50%,
    var(--u-type-primary-dark) 100%
  );
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.hero-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;

  &--1 {
    width: 400rpx;
    height: 400rpx;
    background: radial-gradient(circle, #ff6b8a, transparent 65%);
    top: -120rpx;
    right: -80rpx;
  }

  &--2 {
    width: 300rpx;
    height: 300rpx;
    background: radial-gradient(circle, #ffb347, transparent 65%);
    top: 40%;
    left: -60rpx;
  }

  &--3 {
    width: 200rpx;
    height: 200rpx;
    background: radial-gradient(
      circle,
      var(--u-type-primary-light),
      transparent 65%
    );
    bottom: -60rpx;
    right: 30%;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 28rpx;
  background: rgba(var(--u-type-primary-rgb, 64, 158, 255), 0.2);
  border: 1rpx solid rgba(var(--u-type-primary-rgb, 64, 158, 255), 0.35);
  border-radius: 40rpx;
  font-size: 24rpx;
  color: #ffa4ad;
  margin-bottom: 28rpx;
}

.hero-tag-icon {
  font-size: 22rpx;
}

.hero-title {
  font-size: 64rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 6rpx;
  line-height: 1.3;
  margin-bottom: 12rpx;
  text-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.25);
}

.hero-subtitle {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--u-type-warning, #ffb347);
  margin-bottom: 20rpx;
  letter-spacing: 4rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.hero-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 2rpx;
  line-height: 1.6;
}

// ===== 额度展示卡片 =====
.quota-card {
  margin: -40rpx 28rpx 28rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 44rpx 32rpx 28rpx;
  box-shadow: 0 12rpx 48rpx rgba(var(--u-type-primary-rgb, 64, 158, 255), 0.12);
  position: relative;
  z-index: 2;
}

.quota-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
  font-size: 26rpx;
  color: #999;
}

.quota-label-line {
  width: 56rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #d4d4d4, transparent);
}

.quota-amount {
  text-align: center;
  margin-bottom: 20rpx;
  line-height: 1;
}

.quota-symbol {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--u-type-primary, #e8453c);
  vertical-align: super;
}

.quota-number {
  font-size: 104rpx;
  font-weight: 900;
  color: var(--u-type-primary, #e8453c);
  letter-spacing: -4rpx;
  margin: 0 4rpx;
}

.quota-unit {
  font-size: 44rpx;
  font-weight: 700;
  color: var(--u-type-primary, #e8453c);
}

.quota-info {
  text-align: center;
  font-size: 24rpx;
  color: #aaa;
  padding: 20rpx 0 0;
  margin-top: 4rpx;
  border-top: 1rpx solid #f2f2f2;
}

// ===== 卖点图标行 =====
.features-row {
  display: flex;
  justify-content: space-around;
  margin: 0 28rpx 160rpx;
  padding: 32rpx 8rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.feature-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(
    145deg,
    var(--u-type-primary, #8b5cf6),
    var(--u-type-primary-light, #a78bfa)
  );
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(var(--u-type-primary-rgb, 139, 92, 246), 0.35);
}

.feature-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #333;
}

.feature-desc {
  font-size: 22rpx;
  color: #aaa;
}

// ===== 表单区域 =====
.form-section {
  margin: 0 28rpx 48rpx;
}

.form-section-header {
  text-align: center;
  margin-bottom: 28rpx;
}

.form-section-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 10rpx;
}

.form-section-sub {
  display: block;
  font-size: 26rpx;
  color: #999;
  line-height: 1.6;
}

// ===== 提交按钮 =====
.footer-btn {
  margin-top: 40rpx;
}

.submit-btn {
  height: 100rpx !important;
  background: linear-gradient(
    135deg,
    var(--u-type-primary, #f25b5b),
    var(--u-type-primary-dark, #e8453c)
  ) !important;
  border: none !important;
  border-radius: 50rpx !important;
  font-size: 36rpx !important;
  font-weight: 700 !important;
  letter-spacing: 6rpx;
  color: #fff !important;
  box-shadow: 0 10rpx 36rpx rgba(var(--u-type-primary-rgb, 232, 69, 60), 0.4);

  // 去掉 uview 的 hairline 边框
  &::after {
    border: none !important;
  }

  &:active {
    transform: scale(0.97);
    box-shadow: 0 6rpx 20rpx rgba(var(--u-type-primary-rgb, 232, 69, 60), 0.35);
  }
}

// ===== 底部隐私提示 =====
.footer-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: #bbb;
}
</style>