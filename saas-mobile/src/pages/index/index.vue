<template>
  <layout :active-tab="0" nav-title="首页" show-tabbar tabbar-scope="portal">
    <view class="index-page">
      <view class="header">
        <view class="welcome">
          <text class="welcome-text">你好，{{ userName }}</text>
          <text class="date">{{ currentDate }}</text>
        </view>
        <view class="avatar" @click="goProfile">
          <image :src="avatar || defaultAvatar" mode="aspectFill"></image>
        </view>
      </view>

      <view class="business-grid">
        <view class="grid-item" @click="goCarLoan">
          <view class="item-icon carloan-bg">
            <u-icon name="car" color="#fff" size="48"></u-icon>
          </view>
          <text class="item-title">车贷</text>
          <text class="item-desc">业务进件 · 进度查询</text>
        </view>

        <view class="grid-item" @click="goFoodOrder">
          <view class="item-icon food-bg">
            <u-icon name="food" color="#fff" size="48"></u-icon>
          </view>
          <text class="item-title">点餐</text>
          <text class="item-desc">门店点餐 · 外卖配送</text>
        </view>

        <view class="grid-item" @click="goCreditQuery">
          <view class="item-icon credit-bg">
            <u-icon name="file-text" color="#fff" size="48"></u-icon>
          </view>
          <text class="item-title">征信查询</text>
          <text class="item-desc">在线查询 · 信用报告</text>
        </view>

        <view class="grid-item" @click="goMore">
          <view class="item-icon more-bg">
            <u-icon name="more" color="#fff" size="48"></u-icon>
          </view>
          <text class="item-title">更多服务</text>
          <text class="item-desc">即将上线 · 敬请期待</text>
        </view>
      </view>

      <view v-if="hasLogin" class="quick-actions">
        <view class="section-title">快捷功能</view>
        <view class="actions-list">
          <view class="action-item" @click="goMyCarLoanApply">
            <u-icon name="form" color="#e93323" size="28"></u-icon>
            <text>我的进件</text>
          </view>
          <view class="action-item" @click="goMyFoodOrders">
            <u-icon name="orders" color="#2979ff" size="28"></u-icon>
            <text>我的订单</text>
          </view>
          <view class="action-item" @click="goNotice">
            <u-icon name="bell" color="#f9ae2d" size="28"></u-icon>
            <text>公告通知</text>
          </view>
          <view class="action-item" @click="goCustomer">
            <u-icon name="customer-service" color="#52c41a" size="28"></u-icon>
            <text>联系客服</text>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import { APP_ROUTES } from "@/common/navigation";
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import layout from "@/pages/layout/layout.vue";
import { CurrentSystem, useLocalStore } from "@/stores/local";

const localStore = useLocalStore();

const userName = ref("");
const currentDate = ref("");
const avatar = ref("");
const defaultAvatar = "https://img.uviewui.com/avatar/default.png";

const hasLogin = computed(() => Boolean(localStore.token));

const formatCurrentDate = (date: Date) => {
  const weekMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekMap[date.getDay()]}`;
};

const syncUserInfo = () => {
  const info = localStore.userInfo;

  if (info?.nickName || info?.realName || info?.userName || info?.username) {
    userName.value = String(info.nickName || info.realName || info.userName || info.username);
    avatar.value = info.avatar || "";
    return;
  }

  userName.value = "欢迎使用云贵助手";
  avatar.value = "";
};

onLoad(() => {
  localStore.setCurrentSystem(CurrentSystem.PORTAL);
  currentDate.value = formatCurrentDate(new Date());
  syncUserInfo();
});

onShow(() => {
  localStore.setCurrentSystem(CurrentSystem.PORTAL);
  syncUserInfo();
});

const goCarLoan = () => {
  uni.navigateTo({ url: APP_ROUTES.carloan.home });
};

const goFoodOrder = () => {
  uni.switchTab({ url: APP_ROUTES.food.home });
};

const goCreditQuery = () => {
  uni.navigateTo({ url: APP_ROUTES.credit.home });
};

const goMore = () => {
  uni.showToast({ title: "更多功能敬请期待", icon: "none" });
};

const goProfile = () => {
  uni.switchTab({ url: APP_ROUTES.my.home });
};

const goMyCarLoanApply = () => {
  uni.navigateTo({ url: "/pages/carloan/precheck/leadList" });
};

const goMyFoodOrders = () => {
  uni.switchTab({ url: APP_ROUTES.food.orders });
};

const goNotice = () => {
  uni.showToast({ title: "公告功能建设中", icon: "none" });
};

const goCustomer = () => {
  uni.makePhoneCall({ phoneNumber: "13818821494" });
};
</script>

<style scoped lang="scss">
.index-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20rpx;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 10rpx 40rpx;
  margin-bottom: 20rpx;
}

.welcome {
  display: flex;
  flex-direction: column;
}

.welcome-text {
  font-size: 44rpx;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10rpx;
}

.date {
  font-size: 28rpx;
  color: #909399;
}

.avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid #fff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

  image {
    width: 100%;
    height: 100%;
  }
}

.business-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 40rpx;
}

.grid-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  &:active {
    transform: scale(0.97);
  }
}

.item-icon {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.carloan-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.food-bg {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.credit-bg {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.more-bg {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.item-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8rpx;
}

.item-desc {
  font-size: 24rpx;
  color: #909399;
  text-align: center;
}

.quick-actions {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24rpx;
}

.actions-list {
  display: flex;
  justify-content: space-between;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 25%;

  text {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: #606266;
  }
}
</style>
