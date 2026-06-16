<template>
  <app-page nav-title="申请结果">
    <view class="result-page">
      <view class="content-wrapper">
        <view class="result-card">
          <view class="result-center">
            <view class="icon-circle">
              <u-icon name="checkbox-mark" size="80" color="primary" />
            </view>
            <u-gap height="24" />
            <u-text text="申请已提交" size="40rpx" bold />
            <u-gap height="12" />
            <u-text
              text="您的申请已成功提交，请耐心等待审核结果"
              size="26rpx"
              color="#999"
            />
          </view>
          <u-gap height="40" />
          <view class="tips">
            <view class="tip-row">
              <view class="dot" />
              <text>管理人员会在1个工作日内完成审批；</text>
            </view>
            <view class="tip-row">
              <view class="dot" />
              <text>请注意接听工作人员的来电或微信添加消息。</text>
            </view>
          </view>
        </view>

        <view class="btn-group">
          <u-button
            type="primary"
            size="large"
            shape="circle"
            text="返回首页"
            @click="goToWorkbench"
          />
          <u-button
            type="primary"
            size="large"
            shape="circle"
            plain
            text="前往进件列表"
            @click="goToApplyList"
          />
        </view>
      </view>
    </view>
  </app-page>
</template>

<script setup>
function goToWorkbench() {
  uni.reLaunch({
    url: "/pages/carloan/workbench",
  });
}

function goToApplyList() {
  uni.navigateTo({
    url: "/pages/carloan/applyListPage",
  });
}
</script>

<style lang="scss" scoped>
.result-page {
  padding: 48rpx 32rpx;
  background: #f7f8f9;
  min-height: calc(100vh - 44px);
  display: flex;
  justify-content: center;
}
.content-wrapper {
  width: 100%;
  max-width: 680rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.result-card {
  width: 100%;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}
.result-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.icon-circle {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: rgba(var(--u-type-primary-rgb, 41, 121, 255), 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}
.tips {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  color: $u-tips-color;
  font-size: 26rpx;
  padding: 0 16rpx;
}
.tip-row {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
}
.dot {
  width: 10rpx;
  height: 10rpx;
  background: var(--u-type-primary);
  border-radius: 50%;
  margin-top: 8rpx;
  flex-shrink: 0;
}
.btn-group {
  margin-top: 60rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
</style>
