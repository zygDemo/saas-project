<template>
  <layout :active-tab="0" show-tabbar tabbar-scope="carloan">
    <view class="app-container">
      <!-- 欢迎区域 - 展示用户信息和业务概览 -->
      <view class="hero-section">
        <view class="hero-content">
          <view class="user-info">
            <u-text
              :text="`欢迎，${userName}`"
              size="48rpx"
              bold
              color="var(--u-white-color)"
            />
            <u-tag
              :text="userRoleText"
              type="warning"
              size="mini"
              custom-class="user-role-tag"
            />
          </view>
          <u-text
            text="车贷业务移动办公平台"
            size="26rpx"
            color="var(--u-white-color)"
          />
          <u-text
            :text="`今日待处理: ${businessStats.pendingApproval} 件`"
            size="24rpx"
            color="var(--u-content-color)"
            custom-class="hero-badge"
          />
        </view>
        <view class="hero-stats">
          <view class="stat-item">
            <u-text
              :text="String(businessStats.todayLeads)"
              size="36rpx"
              bold
              color="var(--u-white-color)"
            />
            <u-text text="今日线索" size="24rpx" color="var(--u-white-color)" />
          </view>
          <view class="stat-item">
            <u-text
              :text="String(businessStats.pendingApproval)"
              size="36rpx"
              bold
              color="var(--u-white-color)"
            />
            <u-text text="待审批" size="24rpx" color="var(--u-white-color)" />
          </view>
          <view class="stat-item">
            <u-text
              :text="String(businessStats.monthlyDeals)"
              size="36rpx"
              bold
              color="var(--u-white-color)"
            />
            <u-text text="本月成交" size="24rpx" color="var(--u-white-color)" />
          </view>
        </view>
      </view>

      <!-- 业务快捷入口 -->
      <view class="section-card">
        <view class="section-header">
          <u-icon name="grid" size="32" color="#8c8c8c" class="section-icon" />
          <text class="section-heading">业务快捷入口</text>
        </view>
        <view class="section-body">
          <view class="feature-list">
            <view
              v-for="(card, idx) in businessCards"
              :key="idx"
              class="feature-item"
              @click="navigateToFeature(card.url, card.title)"
            >
              <view class="feature-icon-bg" :class="`feature-icon-bg--${card.color}`">
                <u-icon :name="card.icon" size="28" :color="$u.getColor(card.color)" />
              </view>
              <view class="feature-body">
                <text class="feature-title">{{ card.title }}</text>
                <text class="feature-desc">{{ card.desc }}</text>
              </view>
              <u-icon name="arrow-right" size="24" color="#d9d9d9" class="feature-arrow" />
            </view>
          </view>
        </view>
      </view>

      <!-- 车贷业务功能 -->
      <view class="section-card">
        <view class="section-header">
          <u-icon name="list" size="32" color="#8c8c8c" class="section-icon" />
          <text class="section-heading">车贷业务功能</text>
        </view>
        <view class="section-body">
          <view class="feature-list">
            <view
              v-for="(feature, index) in businessFeatures"
              :key="index"
              class="feature-item"
              @click="navigateToFeature(feature.url, feature.title)"
            >
              <view class="feature-icon-bg" :class="`feature-icon-bg--${feature.color}`">
                <u-icon :name="feature.icon" size="28" :color="$u.getColor(feature.color)" />
              </view>
              <view class="feature-body">
                <text class="feature-title">{{ feature.title }}</text>
                <text class="feature-desc">{{ feature.desc }}</text>
              </view>
              <u-icon name="arrow-right" size="24" color="#d9d9d9" class="feature-arrow" />
            </view>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import type { ColorType } from "uview-pro/types/global";
import { $u } from "uview-pro";
import layout from "@/pages/layout/layout.vue";
import { useLocalStore } from "@/stores";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const localStore = useLocalStore();
const { userInfo } = storeToRefs(localStore);

// 用户显示名称
const userName = computed(() => {
  return (
    (userInfo.value?.userName as string) ||
    (userInfo.value?.phone as string) ||
    "访客"
  );
});

// 用户角色文本
const userRoleText = computed(() => {
  const roleMap: Record<string, string> = {
    sales: "业务员",
    approver: "审批员",
    admin: "管理员",
  };
  return roleMap[(userInfo.value?.role as string) || "sales"] || "业务员";
});

// 业务统计信息
const businessStats = {
  todayLeads: 5,
  pendingApproval: 3,
  monthlyDeals: 12,
  completionRate: "85%",
};

// 业务快捷入口
const businessCards = [
  {
    title: "线索查询",
    desc: "查看分配线索，跟进客户",
    icon: "search",
    url: "/pages/carloan/leadList",
    color: "primary" as ColorType,
  },
  {
    title: "进件申请",
    desc: "快速创建进件，上传资料",
    icon: "file-text",
    url: "/pages/carloan/applySubmit",
    color: "success" as ColorType,
  },
  {
    title: "审批列表",
    desc: "处理待审批进件",
    icon: "list",
    url: "/pages/carloan/approvalList",
    color: "warning" as ColorType,
  },
  {
    title: "工作台",
    desc: "全部业务功能入口",
    icon: "grid",
    url: "/pages/carloan/workbench",
    color: "error" as ColorType,
  },
];

// 车贷业务功能列表
const businessFeatures = [
  {
    title: "线索管理",
    desc: "线索查询、线索列表",
    icon: "search",
    url: "/pages/carloan/leadList",
    color: "primary" as ColorType,
  },
  {
    title: "进件管理",
    desc: "身份证、车辆信息、申请提交",
    icon: "file-text",
    url: "/pages/carloan/applySubmit",
    color: "success" as ColorType,
  },
  {
    title: "资料补充",
    desc: "客户、车辆、订单信息补充",
    icon: "edit-pen",
    url: "/pages/carloan/idInfoSupplement",
    color: "warning" as ColorType,
  },
  {
    title: "审批流程",
    desc: "初审、终审、审批记录",
    icon: "list",
    url: "/pages/carloan/approvalList",
    color: "error" as ColorType,
  },
  {
    title: "面签管理",
    desc: "面签列表、视频面签、AI面签",
    icon: "camera",
    url: "/pages/carloan/faceSignList",
    color: "success" as ColorType,
  },
];

// 跳转到功能页面
function navigateToFeature(url: string, _title: string) {
  uni.navigateTo({
    url,
    success: () => {
      // 跳转成功
    },
    fail: (err) => {
      $u.toast(`${t("common.jumpFailed")}: ${err.errMsg}`, "error");
    },
  });
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 24rpx;
  background: linear-gradient(
    180deg,
    rgba(41, 121, 255, 0.03) 0%,
    transparent 100%
  );
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

// Hero区域
.hero-section {
  position: relative;
  margin: 0 0 8rpx;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 32rpx rgba(41, 121, 255, 0.2);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #2979ff 0%, #19be6b 50%, #ff9900 100%);
    opacity: 0.95;
  }

  &::after {
    content: "";
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.2) 0%,
      transparent 70%
    );
    animation: heroGlow 8s ease-in-out infinite;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 64rpx 32rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    align-items: center;

    .user-info {
      display: flex;
      align-items: center;
      gap: 16rpx;

      :deep(.user-role-tag) {
        background: rgba(255, 255, 255, 0.3) !important;
        border-color: rgba(255, 255, 255, 0.5) !important;
        color: #ffffff !important;
      }
    }

    :deep(.hero-badge) {
      display: inline-block;
      padding: 4rpx 12rpx;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 8rpx;
      font-size: 20rpx;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 1rpx;
      backdrop-filter: blur(10rpx);
    }
  }

  .hero-stats {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0 32rpx 32rpx;

    .stat-item {
      text-align: center;

      &:first-child,
      &:last-child {
        flex: 1;
      }
    }
  }
}

@keyframes heroGlow {
  0%,
  100% {
    transform: rotate(0deg);
    opacity: 0.3;
  }

  50% {
    transform: rotate(180deg);
    opacity: 0.6;
  }
}

// 区块卡片
.section-card {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.99);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 28rpx 20rpx;
}

.section-icon {
  flex-shrink: 0;
}

.section-heading {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: 1rpx;
}

.section-body {
  padding: 4rpx 16rpx 16rpx;
}

// 统一功能列表
.feature-list {
  display: flex;
  flex-direction: column;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f7f8fa;
    border-radius: 12rpx;
  }
}

.feature-icon-bg {
  width: 64rpx;
  height: 64rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--primary {
    background: rgba(41, 121, 255, 0.1);
  }
  &--success {
    background: rgba(82, 196, 26, 0.1);
  }
  &--warning {
    background: rgba(250, 173, 20, 0.1);
  }
  &--error {
    background: rgba(255, 77, 79, 0.1);
  }
}

.feature-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.feature-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #262626;
}

.feature-desc {
  font-size: 24rpx;
  color: #8c8c8c;
  line-height: 1.4;
}

.feature-arrow {
  flex-shrink: 0;
}
</style>
