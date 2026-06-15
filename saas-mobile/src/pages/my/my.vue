<template>
  <layout :active-tab="2" navTitle="我的" show-tabbar>
    <view class="my-page">
      <view class="profile-hero" @click="handleUserCardClick">
        <view class="profile-hero__orb profile-hero__orb--primary" />
        <view class="profile-hero__orb profile-hero__orb--accent" />
        <view class="profile-hero__header">
          <view class="avatar-wrap">
            <u-avatar
              :text="avatarText"
              size="136"
              bg-color="#ffffff"
              color="#5240FE"
            />
          </view>

          <view class="profile-info">
            <view class="profile-name-row">
              <text class="profile-name">{{ userName }}</text>
              <view class="role-pill">{{ userRole }}</view>
            </view>
            <view class="profile-phone">
              <u-icon name="phone" size="24" color="rgba(255,255,255,.82)" />
              <text>{{ userPhone || "点击登录后查看账号信息" }}</text>
            </view>
            <view class="profile-subtitle">嗨车无忧 · 车抵贷移动工作台</view>
          </view>
        </view>

        <view class="profile-meta">
          <view v-for="item in profileMeta" :key="item.label" class="profile-meta__item">
            <text class="profile-meta__value">{{ item.value }}</text>
            <text class="profile-meta__label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <view class="overview-card">
        <view class="section-head">
          <view>
            <text class="section-title">业务概览</text>
            <text class="section-subtitle">实时同步进件与放款数据</text>
          </view>
          <view class="refresh-chip" @click="loadBusinessStats">
            <u-icon name="reload" size="24" color="var(--u-type-primary)" />
            <text>刷新</text>
          </view>
        </view>

        <view class="stats-grid">
          <view v-for="item in statCards" :key="item.label" class="stat-card">
            <view class="stat-card__icon" :class="item.iconClass">
              <u-icon :name="item.icon" size="34" color="#ffffff" />
            </view>
            <view class="stat-card__content">
              <text class="stat-card__value">{{ item.value }}</text>
              <text class="stat-card__label">{{ item.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="quick-card">
        <view class="section-head section-head--compact">
          <view>
            <text class="section-title">常用服务</text>
            <text class="section-subtitle">账号、安全与帮助入口</text>
          </view>
        </view>

        <view class="menu-list">
          <view
            v-for="item in menuList"
            :key="item.path"
            class="menu-item"
            @click="navigateTo(item.path)"
          >
            <view class="menu-item__icon" :class="item.iconClass">
              <u-icon :name="item.icon" size="36" color="#ffffff" />
            </view>
            <view class="menu-item__content">
              <text class="menu-item__title">{{ item.title }}</text>
              <text class="menu-item__desc">{{ item.desc }}</text>
            </view>
            <u-icon name="arrow-right" size="28" color="#c7c9d9" />
          </view>
        </view>
      </view>

      <view class="action-panel">
        <view class="action-btn action-btn--cache" @click="handleClearCache">
          <u-icon name="trash" size="32" color="var(--u-type-warning)" />
          <text>清除缓存</text>
        </view>
        <view v-if="userInfo" class="action-btn action-btn--logout" @click="handleLogout">
          <u-icon name="close-circle" size="32" color="var(--u-type-error)" />
          <text>退出登录</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup lang="ts">
import layout from "@/pages/layout/layout.vue";
import { useBusinessApi } from "@/api/business";
import { useLocalStore, useSessionStore } from "@/stores";
import { onShow } from "@dcloudio/uni-app";
import { storeToRefs } from "pinia";
import { $u, useTheme } from "uview-pro";
import { computed, ref } from "vue";

const sessionStore = useSessionStore();
const localStore = useLocalStore();
const businessApi = useBusinessApi();
const { userInfo } = storeToRefs(localStore);
const { initTheme, setDarkMode } = useTheme();

const userName = computed(() => {
  const info = userInfo.value || {};
  return (
    String(info.nickName || info.realName || info.userName || info.username || "") ||
    "未登录"
  );
});

const avatarText = computed(() => userName.value.slice(0, 1) || "我");

const userPhone = computed(() => {
  const info = userInfo.value || {};
  const phone = String(info.phonenumber || info.phone || info.mobile || "");
  return phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : "";
});

const userRole = computed(() => {
  const info = userInfo.value || {};
  const role = String(info.role || info.roleKey || info.roleCode || "");
  const roleMap: Record<string, string> = {
    sales: "业务员",
    salesman: "业务员",
    approver: "审批员",
    admin: "管理员",
    customer: "客户",
  };
  return roleMap[role] || "业务员";
});

const orgName = computed(() => {
  const info = userInfo.value || {};
  return String(info.orgName || info.dept?.orgName || info.deptName || "默认机构");
});

const businessStats = ref({
  totalLeads: 0,
  totalDeals: 0,
  pendingApproval: 0,
  monthlyAmount: "0",
});

const profileMeta = computed(() => [
  { label: "当前机构", value: orgName.value },
  { label: "账号角色", value: userRole.value },
  { label: "登录状态", value: userInfo.value ? "已认证" : "未登录" },
]);

const statCards = computed(() => [
  {
    label: "累计线索",
    value: businessStats.value.totalLeads,
    icon: "account",
    iconClass: "stat-card__icon--lead",
  },
  {
    label: "进件订单",
    value: businessStats.value.totalDeals,
    icon: "file-text",
    iconClass: "stat-card__icon--order",
  },
  {
    label: "放款笔数",
    value: businessStats.value.pendingApproval,
    icon: "checkmark-circle",
    iconClass: "stat-card__icon--loan",
  },
  {
    label: "放款金额",
    value: businessStats.value.monthlyAmount,
    icon: "rmb-circle",
    iconClass: "stat-card__icon--amount",
  },
]);

const menuList = ref([
  {
    icon: "setting",
    title: "个人设置",
    desc: "资料、主题与消息偏好",
    path: "/pages/my/settings",
    iconClass: "menu-item__icon--setting",
  },
  {
    icon: "question-circle",
    title: "帮助中心",
    desc: "查看常见问题与操作说明",
    path: "/pages/my/faq",
    iconClass: "menu-item__icon--help",
  },
  {
    icon: "file-text",
    title: "隐私政策",
    desc: "了解数据安全与隐私保护",
    path: "/pages/my/privacy",
    iconClass: "menu-item__icon--privacy",
  },
  {
    icon: "file-text-fill",
    title: "用户协议",
    desc: "查看平台服务条款",
    path: "/pages/my/agreement",
    iconClass: "menu-item__icon--agreement",
  },
]);

async function loadBusinessStats() {
  try {
    const res: any = await businessApi.getStatisticsOverview();
    const payload = res?.data || res || {};
    if (res?.code === 200 || payload) {
      businessStats.value = {
        totalLeads: payload.leadCount ?? payload.totalLeads ?? 0,
        totalDeals: payload.entryCount ?? payload.totalDeals ?? 0,
        pendingApproval: payload.loanCount ?? payload.pendingApproval ?? 0,
        monthlyAmount: formatLoanAmount(payload.loanAmount ?? payload.monthlyAmount),
      };
    }
  } catch (e) {
    console.error("获取业务统计失败:", e);
  }
}

function formatLoanAmount(amount: unknown) {
  if (amount == null || amount === "") return "0";
  const num = Number(amount);
  if (Number.isNaN(num)) return String(amount);
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return String(num);
}

function handleClearCache() {
  uni.showModal({
    title: "清除缓存",
    content: "将清除所有本地数据和会话，需要重新登录",
    success: (res) => {
      if (!res.confirm) return;
      try {
        uni.clearStorageSync();
        sessionStore.clearSession();
        initTheme(undefined, undefined, true);
        setDarkMode("light");
        $u.toast("缓存已清除");
        setTimeout(() => {
          uni.reLaunch({ url: "/pages/auth/login" });
        }, 800);
      } catch (err) {
        console.error("清除缓存失败:", err);
        $u.toast("清除缓存失败", "error");
      }
    },
  });
}

function handleLogout() {
  uni.showModal({
    title: "确认退出",
    content: "退出后需要重新登录",
    success: (res) => {
      if (!res.confirm) return;
      localStore.logout();
      sessionStore.clearSession();
      $u.toast("已退出登录");
      setTimeout(() => {
        uni.reLaunch({ url: "/pages/auth/login" });
      }, 500);
    },
  });
}

function handleUserCardClick() {
  if (!userInfo.value) {
    uni.navigateTo({ url: "/pages/auth/login" });
  }
}

function navigateTo(path: string) {
  uni.navigateTo({ url: path });
}

onShow(() => {
  loadBusinessStats();
});
</script>

<style lang="scss" scoped>
.my-page {
  min-height: 100%;
  padding: 24rpx 24rpx 48rpx;
  background:
    radial-gradient(circle at 12% 0%, rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.16), transparent 34%),
    linear-gradient(180deg, rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.08) 0%, #f6f8ff 46%, #f7f8fa 100%);
}

.profile-hero,
.overview-card,
.quick-card,
.action-panel {
  border: 1rpx solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 18rpx 44rpx rgba(31, 45, 88, 0.08);
}

.profile-hero {
  position: relative;
  overflow: hidden;
  padding: 34rpx 30rpx 28rpx;
  border-radius: 34rpx;
  color: #ffffff;
  background:
    linear-gradient(135deg, rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.98) 0%, rgba(72, 120, 255, 0.96) 48%, rgba(25, 190, 107, 0.9) 100%);

  &:active {
    transform: scale(0.99);
  }
}

.profile-hero__orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(2rpx);
}

.profile-hero__orb--primary {
  width: 240rpx;
  height: 240rpx;
  right: -84rpx;
  top: -86rpx;
  background: rgba(255, 255, 255, 0.18);
}

.profile-hero__orb--accent {
  width: 180rpx;
  height: 180rpx;
  left: -70rpx;
  bottom: -80rpx;
  background: rgba(255, 255, 255, 0.12);
}

.profile-hero__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar-wrap {
  width: 152rpx;
  height: 152rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 44rpx;
  background: rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.35), 0 18rpx 36rpx rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(12rpx);
}

.profile-info {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.profile-name {
  max-width: 260rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 42rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
}

.role-pill {
  flex-shrink: 0;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.28);
}

.profile-phone,
.profile-subtitle {
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.84);
  font-size: 24rpx;
}

.profile-phone {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.profile-meta {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 30rpx;
}

.profile-meta__item {
  min-width: 0;
  padding: 18rpx 12rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.22);
}

.profile-meta__value,
.profile-meta__label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.profile-meta__value {
  font-size: 24rpx;
  font-weight: 700;
}

.profile-meta__label {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.72);
}

.overview-card,
.quick-card,
.action-panel {
  margin-top: 24rpx;
  padding: 28rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.94);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-head--compact {
  margin-bottom: 14rpx;
}

.section-title,
.section-subtitle {
  display: block;
}

.section-title {
  position: relative;
  padding-left: 18rpx;
  color: $u-main-color;
  font-size: 32rpx;
  font-weight: 800;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    width: 6rpx;
    height: 28rpx;
    border-radius: 999rpx;
    background: linear-gradient(180deg, var(--u-type-primary), var(--u-type-success));
    transform: translateY(-50%);
  }
}

.section-subtitle {
  margin-top: 8rpx;
  color: $u-tips-color;
  font-size: 22rpx;
}

.refresh-chip {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  color: var(--u-type-primary);
  font-size: 22rpx;
  font-weight: 700;
  background: rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.08);

  &:active {
    opacity: 0.72;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 22rpx 18rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f8faff 100%);
  box-shadow: inset 0 0 0 1rpx rgba(225, 230, 245, 0.82);
}

.stat-card__icon,
.menu-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 10rpx 20rpx rgba(31, 45, 88, 0.12);
}

.stat-card__icon {
  width: 66rpx;
  height: 66rpx;
  border-radius: 20rpx;
}

.stat-card__icon--lead,
.menu-item__icon--setting {
  background: linear-gradient(135deg, var(--u-type-primary), #7c3aed);
}

.stat-card__icon--order,
.menu-item__icon--help {
  background: linear-gradient(135deg, #2f80ed, #56ccf2);
}

.stat-card__icon--loan,
.menu-item__icon--privacy {
  background: linear-gradient(135deg, var(--u-type-success), #38f9d7);
}

.stat-card__icon--amount,
.menu-item__icon--agreement {
  background: linear-gradient(135deg, var(--u-type-warning), #ff6b6b);
}

.stat-card__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.stat-card__value {
  color: $u-main-color;
  font-size: 34rpx;
  font-weight: 800;
}

.stat-card__label {
  color: $u-tips-color;
  font-size: 22rpx;
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 22rpx 0;
  border-bottom: 1rpx solid rgba(230, 233, 242, 0.9);

  &:last-child {
    border-bottom: none;
  }

  &:active {
    opacity: 0.72;
    transform: translateX(4rpx);
  }
}

.menu-item__icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
}

.menu-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.menu-item__title {
  color: $u-main-color;
  font-size: 30rpx;
  font-weight: 700;
}

.menu-item__desc {
  color: $u-tips-color;
  font-size: 23rpx;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 88rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 700;

  &:active {
    transform: scale(0.98);
  }
}

.action-btn--cache {
  color: var(--u-type-warning);
  background: rgba(var(--u-type-warning-rgb, 255, 153, 0), 0.1);
}

.action-btn--logout {
  color: var(--u-type-error);
  background: rgba(var(--u-type-error-rgb, 245, 108, 108), 0.1);
}
</style>
