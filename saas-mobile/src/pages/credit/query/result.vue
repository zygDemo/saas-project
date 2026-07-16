<template>
  <layout nav-title="查询结果">
    <view class="result-page">
      <!-- 结果卡片 -->
      <view class="result-card">
        <view class="result-header">
          <view class="result-icon">
            <u-icon name="checkmark-circle-fill" color="var(--u-type-success)" size="80" />
          </view>
          <text class="result-title">查询完成</text>
          <text class="result-subtitle">征信报告已生成</text>
        </view>

        <!-- 用户信息 -->
        <view class="info-section">
          <view class="info-row">
            <text class="info-label">姓名</text>
            <text class="info-value">{{ form.name }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">身份证号</text>
            <text class="info-value">{{ maskIdcard }}</text>
          </view>
        </view>

        <!-- 信用评分 -->
        <view class="score-section">
          <text class="score-title">信用评分</text>
          <view class="score-ring">
            <view class="score-ring__inner">
              <text class="score-num">{{ creditScore }}</text>
              <text class="score-label">信用分</text>
            </view>
          </view>
          <view class="score-tag" :class="scoreClass">
            <text>{{ scoreDesc }}</text>
          </view>
        </view>

        <!-- 评分说明 -->
        <view class="score-range">
          <view class="range-item">
            <view class="range-dot range-dot--good" />
            <text>750-950 优秀</text>
          </view>
          <view class="range-item">
            <view class="range-dot range-dot--ok" />
            <text>650-749 良好</text>
          </view>
          <view class="range-item">
            <view class="range-dot range-dot--fair" />
            <text>550-649 一般</text>
          </view>
          <view class="range-item">
            <view class="range-dot range-dot--poor" />
            <text>350-549 偏弱</text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-bar">
        <u-button text="查看完整报告" type="primary" @click="viewReport" />
        <u-button text="返回首页" plain @click="goHome" />
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/components/layout/layout.vue";
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

const scoreClass = computed(() => {
  if (creditScore.value >= 750) return "score-tag--good";
  if (creditScore.value >= 650) return "score-tag--ok";
  if (creditScore.value >= 550) return "score-tag--fair";
  return "score-tag--poor";
});

const scoreDesc = computed(() => {
  if (creditScore.value >= 750) return "信用优秀";
  if (creditScore.value >= 650) return "信用良好";
  if (creditScore.value >= 550) return "信用一般";
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
  min-height: 100%;
  background-color: #f5f7fa;
  padding: 30rpx;
  padding-bottom: 50rpx;
}

// 结果卡片
.result-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
}

.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.result-icon {
  margin-bottom: 20rpx;
}

.result-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8rpx;
}

.result-subtitle {
  font-size: 26rpx;
  color: #909399;
}

// 用户信息
.info-section {
  margin-bottom: 40rpx;
  padding: 24rpx;
  background: #f8f9fb;
  border-radius: 12rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;

  &:first-child {
    border-bottom: 1rpx solid #e8e8e8;
  }
}

.info-label {
  font-size: 28rpx;
  color: #909399;
}

.info-value {
  font-size: 28rpx;
  color: #303133;
  font-weight: 500;
}

// 信用评分
.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.score-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 30rpx;
}

.score-ring {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  border: 16rpx solid var(--u-type-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  background: #fff;

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
}

.score-num {
  font-size: 72rpx;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.score-label {
  font-size: 24rpx;
  color: #909399;
  margin-top: 8rpx;
}

.score-tag {
  padding: 12rpx 32rpx;
  border-radius: 30rpx;

  text {
    font-size: 28rpx;
    font-weight: 500;
  }

  &--good {
    background: #e8f8ef;
    text { color: #2ecc71; }
  }

  &--ok {
    background: #e8f4fd;
    text { color: #3498db; }
  }

  &--fair {
    background: #fef9e8;
    text { color: #f39c12; }
  }

  &--poor {
    background: #fdedec;
    text { color: #e74c3c; }
  }
}

// 评分范围
.score-range {
  display: flex;
  justify-content: space-around;
  padding: 24rpx;
  background: #f8f9fb;
  border-radius: 12rpx;
}

.range-item {
  display: flex;
  align-items: center;
  gap: 8rpx;

  text {
    font-size: 22rpx;
    color: #909399;
  }
}

.range-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;

  &--good { background: #2ecc71; }
  &--ok { background: #3498db; }
  &--fair { background: #f39c12; }
  &--poor { background: #e74c3c; }
}

// 操作按钮
.action-bar {
  margin-top: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
</style>
