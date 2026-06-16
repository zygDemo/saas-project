<template>
  <view class="result-page">
    <view class="result-card">
      <view class="result-header">
        <view class="avatar">
          <u-icon name="checked-circle" color="#fff" size="60"></u-icon>
        </view>
        <text class="title">查询完成</text>
        <text class="subtitle">征信报告已生成</text>
      </view>

      <view class="info-section">
        <view class="info-row">
          <text class="label">姓名</text>
          <text class="value">{{ form.name }}</text>
        </view>
        <view class="info-row">
          <text class="label">身份证号</text>
          <text class="value">{{ maskIdcard }}</text>
        </view>
      </view>

      <view class="score-section">
        <text class="section-title">信用评分</text>
        <view class="score-circle">
          <text class="score-num">{{ creditScore }}</text>
          <text class="score-text">信用分</text>
        </view>
        <text class="score-desc">{{ scoreDesc }}</text>
      </view>

      <view class="action-section">
        <u-button text="查看完整报告" type="primary" @click="viewReport"></u-button>
        <u-button text="返回首页" plain @click="goHome"></u-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { APP_ROUTES } from "@/common/navigation";
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const form = ref({
  name: "",
  idcard: "",
});

const creditScore = ref(Math.floor(Math.random() * 300) + 500);

const maskIdcard = computed(() => {
  const idcard = form.value.idcard;
  if (!idcard || idcard.length < 18) return "";
  return `${idcard.slice(0, 6)}********${idcard.slice(-4)}`;
});

const scoreDesc = computed(() => {
  if (creditScore.value >= 800) return "信用极好";
  if (creditScore.value >= 700) return "信用良好";
  if (creditScore.value >= 600) return "信用一般";
  return "信用偏弱，建议关注";
});

onLoad((options?: Record<string, string>) => {
  form.value.name = options?.name || "";
  form.value.idcard = options?.idcard || "";
});

const viewReport = () => {
  uni.showToast({ title: "报告生成中...", icon: "loading" });
};

const goHome = () => {
  uni.switchTab({ url: APP_ROUTES.portal.home });
};
</script>

<style scoped lang="scss">
.result-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

.result-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 50rpx 30rpx;
}

.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8rpx;
}

.subtitle {
  font-size: 26rpx;
  color: #909399;
}

.info-section {
  margin-bottom: 50rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.label {
  font-size: 28rpx;
  color: #606266;
}

.value {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
}

.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 30rpx;
}

.score-circle {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  border: 12rpx solid #4facfe;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.score-num {
  font-size: 64rpx;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.score-text {
  font-size: 24rpx;
  color: #909399;
}

.score-desc {
  font-size: 28rpx;
  color: #606266;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
</style>
