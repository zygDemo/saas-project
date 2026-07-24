<template>
  <layout
    :active-tab="activeTabIndex"
    navTitle="我的"
    show-tabbar
    :tabbar-scope="currentTabbarScope"
  >
    <scroll-view class="my-scroll" scroll-y>
      <view class="my-page">
        <view class="profile-panel" @click="handleProfileClick">
          <view class="profile-panel__header">
            <u-avatar
              :text="avatarText"
              size="128"
              bg-color="#ffffff"
              color="var(--u-type-primary)"
            />

            <view class="profile-panel__info">
              <view class="profile-panel__name-row">
                <text class="profile-panel__name">{{ displayName }}</text>
                <text class="profile-panel__role">{{ roleLabel }}</text>
              </view>

              <text class="profile-panel__phone">{{ phoneText }}</text>
              <text class="profile-panel__org">{{ orgLabel }}</text>
            </view>
          </view>

          <view class="profile-panel__meta">
            <view
              v-for="item in profileMeta"
              :key="item.label"
              class="profile-panel__meta-item"
            >
              <text class="profile-panel__meta-value">{{ item.value }}</text>
              <text class="profile-panel__meta-label">{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view v-if="isCarLoanModule" class="section-card">
          <view class="section-head">
            <view>
              <text class="section-title">业务概览</text>
              <text class="section-subtitle">同步查看线索、进件和放款数据</text>
            </view>
            <view class="refresh-chip" @click="loadBusinessStats">
              <u-icon name="reload" size="24" color="var(--u-type-primary)" />
              <text>刷新</text>
            </view>
          </view>

          <view class="stats-grid">
            <view v-for="item in statCards" :key="item.label" class="stat-item">
              <view class="stat-item__icon" :class="item.iconClass">
                <u-icon :name="item.icon" size="30" color="#ffffff" />
              </view>
              <view class="stat-item__content">
                <text class="stat-item__value">{{ item.value }}</text>
                <text class="stat-item__label">{{ item.label }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="section-card">
          <view class="section-head section-head--compact">
            <view>
              <text class="section-title">常用服务</text>
              <text class="section-subtitle">设置、帮助和协议入口</text>
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
                <u-icon :name="item.icon" size="32" color="#ffffff" />
              </view>

              <view class="menu-item__content">
                <text class="menu-item__title">{{ item.title }}</text>
                <text class="menu-item__desc">{{ item.desc }}</text>
              </view>

              <u-icon name="arrow-right" size="26" color="#c0c7d5" />
            </view>
          </view>
        </view>

        <view class="action-list">
          <view class="action-btn action-btn--cache" @click="handleClearCache">
            <u-icon name="trash" size="30" color="#f59e0b" />
            <text>清除缓存</text>
          </view>

          <view
            v-if="isLoggedIn"
            class="action-btn action-btn--logout"
            @click="handleLogout"
          >
            <u-icon name="close-circle" size="30" color="#ef4444" />
            <text>退出登录</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </layout>
</template>

<script setup lang="ts">
import type { StatisticsOverview } from "@/api/business";
import type { UserInfo } from "@/stores/local";
import { useBusinessApi } from "@/api/business";
import layout from "@/components/layout/layout.vue";
import { useLocalStore, useSessionStore } from "@/stores";
import {
  APP_ROUTES,
  TABBAR_SCOPES,
  canSwitchMobileModule,
} from "@/common/navigation";
import { CurrentSystem } from "@/stores/local";
import { onShow } from "@dcloudio/uni-app";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

interface StatState {
  totalLeads: number;
  totalEntries: number;
  pendingApproval: number;
  totalLoanAmount: unknown;
}

interface MenuItem {
  icon: string;
  title: string;
  desc: string;
  path: string;
  iconClass: string;
}

const businessApi = useBusinessApi();
const localStore = useLocalStore();
const sessionStore = useSessionStore();
const { userInfo } = storeToRefs(localStore);
const canSwitchProject = computed(() =>
  canSwitchMobileModule(localStore.mobileConfig),
);

const currentProjectLabel = computed(() => {
  switch (localStore.currentSystem) {
    case CurrentSystem.CARLOAN:
      return "当前：车贷业务，点击返回项目选择";
    case CurrentSystem.FOOD:
      return "当前：点餐业务，点击返回项目选择";
    case CurrentSystem.CREDIT:
      return "当前：征信查询，点击返回项目选择";
    case CurrentSystem.READING:
      return "当前：读书模块，点击返回项目选择";
    default:
      return "当前：项目选择首页";
  }
});

const menuList = computed<MenuItem[]>(() => {
  const items: MenuItem[] = [];
  // 多模块模式下才显示切换项目入口
  if (canSwitchProject.value) {
    items.push({
      icon: "grid",
      title: "切换项目",
      desc: currentProjectLabel.value,
      path: "__switch_project__",
      iconClass: "menu-item__icon--setting",
    });
  }
  items.push(
    {
      icon: "setting",
      title: "个人设置",
      desc: "主题、语言和基础偏好",
      path: "/pages/my/settings",
      iconClass: "menu-item__icon--setting",
    },
    {
      icon: "question-circle",
      title: "帮助中心",
      desc: "查看常见问题和使用说明",
      path: "/pages/my/faq",
      iconClass: "menu-item__icon--help",
    },
    {
      icon: "file-text",
      title: "隐私政策",
      desc: "了解数据安全和隐私说明",
      path: "/pages/my/privacy",
      iconClass: "menu-item__icon--privacy",
    },
    {
      icon: "file-text",
      title: "用户协议",
      desc: "查看平台服务条款",
      path: "/pages/my/agreement",
      iconClass: "menu-item__icon--agreement",
    },
  );
  return items;
});

const stats = ref<StatState>({
  totalLeads: 0,
  totalEntries: 0,
  pendingApproval: 0,
  totalLoanAmount: 0,
});

const currentUser = computed<UserInfo | null>(() => userInfo.value);

const isLoggedIn = computed(() =>
  Boolean(localStore.token && currentUser.value),
);

const currentTabbarScope = computed(() => {
  if (localStore.currentSystem === CurrentSystem.CARLOAN)
    return TABBAR_SCOPES.carloan;
  if (localStore.currentSystem === CurrentSystem.FOOD)
    return TABBAR_SCOPES.food;
  if (localStore.currentSystem === CurrentSystem.READING)
    return TABBAR_SCOPES.reading;
  if (localStore.currentSystem === CurrentSystem.CREDIT)
    return TABBAR_SCOPES.credit;
  return TABBAR_SCOPES.portal;
});

const activeTabIndex = computed(() => {
  // 所有模块 tabbar 统一为「首页 / 我的」两项，「我的」固定为第 2 项
  return 1;
});

// 判断是否是车贷模块
const isCarLoanModule = computed(() => {
  return localStore.currentSystem === CurrentSystem.CARLOAN;
});

const displayName = computed(() => {
  const info = currentUser.value;
  return (
    info?.nickName ||
    info?.realName ||
    info?.userName ||
    info?.username ||
    "未登录"
  );
});

const avatarText = computed(() => displayName.value.slice(0, 1) || "我");

const phoneText = computed(() => {
  const phone = String(
    currentUser.value?.phonenumber || currentUser.value?.phone || "",
  );

  if (!phone) {
    return isLoggedIn.value ? "暂未绑定手机号" : "点击登录后查看手机号";
  }

  if (phone.length < 7) {
    return phone;
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
});

const roleLabel = computed(() => {
  const info = currentUser.value;
  const roleKey =
    info?.role ||
    info?.roleKeys?.[0] ||
    info?.roles?.[0]?.roleKey ||
    info?.roles?.[0]?.roleName ||
    "";

  const roleMap: Record<string, string> = {
    sales: "业务员",
    salesman: "业务员",
    approver: "审批员",
    admin: "管理员",
    customer: "客户",
  };

  return roleMap[String(roleKey)] || String(roleKey) || "业务伙伴";
});

const orgLabel = computed(() => {
  const info = currentUser.value;
  return info?.orgName || info?.dept?.deptName || "默认机构";
});

const profileMeta = computed(() => [
  {
    label: "当前机构",
    value: orgLabel.value,
  },
  {
    label: "账号角色",
    value: roleLabel.value,
  },
  {
    label: "登录状态",
    value: isLoggedIn.value ? "已登录" : "未登录",
  },
]);

const statCards = computed(() => [
  {
    label: "累计线索",
    value: stats.value.totalLeads,
    icon: "account",
    iconClass: "stat-item__icon--lead",
  },
  {
    label: "进件订单",
    value: stats.value.totalEntries,
    icon: "file-text",
    iconClass: "stat-item__icon--entry",
  },
  {
    label: "待审批",
    value: stats.value.pendingApproval,
    icon: "checkmark-circle",
    iconClass: "stat-item__icon--approval",
  },
  {
    label: "放款金额",
    value: formatAmount(stats.value.totalLoanAmount),
    icon: "rmb-circle",
    iconClass: "stat-item__icon--amount",
  },
]);

function formatAmount(amount: unknown): string {
  if (amount == null || amount === "") {
    return "0";
  }

  const value = Number(amount);
  if (Number.isNaN(value)) {
    return String(amount);
  }

  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`;
  }

  return String(value);
}

async function loadBusinessStats() {
  if (!localStore.token) {
    stats.value = {
      totalLeads: 0,
      totalEntries: 0,
      pendingApproval: 0,
      totalLoanAmount: 0,
    };
    return;
  }

  try {
    const res = await businessApi.getStatisticsOverview();
    const payload = (res?.data ?? res ?? {}) as StatisticsOverview &
      Record<string, unknown>;

    stats.value = {
      totalLeads: Number(payload.leadCount ?? payload.todayLeads ?? 0),
      totalEntries: Number(
        payload.entryCount ?? payload.todayApplications ?? 0,
      ),
      pendingApproval: Number(
        payload.pendingApproval ?? payload.loanCount ?? 0,
      ),
      totalLoanAmount: payload.loanAmount ?? payload.monthLoanAmount ?? 0,
    };
  } catch (error) {
    console.error("loadBusinessStats failed", error);
    uni.showToast({
      title: "获取业务概览失败",
      icon: "none",
    });
  }
}

function handleProfileClick() {
  if (!isLoggedIn.value) {
    uni.navigateTo({
      url: "/pages/auth/login",
    });
  }
}

function navigateTo(path: string) {
  if (path === "__switch_project__") {
    localStore.setCurrentSystem(CurrentSystem.PORTAL);
    uni.reLaunch({ url: APP_ROUTES.portal.home });
    return;
  }
  uni.navigateTo({
    url: path,
  });
}

async function handleClearCache() {
  try {
    const res = await new Promise<{ confirm: boolean }>((resolve) => {
      uni.showModal({
        title: '清除缓存',
        content: '将清除本地缓存并返回登录页，是否继续？',
        confirmText: '继续',
        cancelText: '取消',
        success: (r) => resolve({ confirm: r.confirm }),
        fail: () => resolve({ confirm: false }),
      });
    });
    if (!res.confirm) return;
    uni.clearStorageSync();
    localStore.logout();
    sessionStore.clearSession();
    uni.showToast({ title: '缓存已清除', icon: 'success' });
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/auth/login' });
    }, 500);
  } catch (error) {
    console.error('handleClearCache failed', error);
    uni.showToast({ title: '清除缓存失败', icon: 'none' });
  }
}

async function handleLogout() {
  try {
    const res = await new Promise<{ confirm: boolean }>((resolve) => {
      uni.showModal({
        title: '退出登录',
        content: '退出后需要重新登录，是否确认退出？',
        confirmText: '退出',
        cancelText: '取消',
        confirmColor: '#ef4444',
        success: (r) => resolve({ confirm: r.confirm }),
        fail: () => resolve({ confirm: false }),
      });
    });
    if (!res.confirm) return;
    localStore.logout();
    sessionStore.clearSession();
    uni.removeStorageSync('local-store');
    uni.removeStorageSync('session-store');
    uni.showToast({ title: '已退出登录', icon: 'success' });
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/auth/login' });
    }, 500);
  } catch (error) {
    console.error('handleLogout failed', error);
    uni.showToast({ title: '退出登录失败', icon: 'none' });
  }
}

onShow(() => {
  if (isCarLoanModule.value) {
    void loadBusinessStats();
  }
});
</script>

<style lang="scss" scoped>
.my-scroll {
  height: 100%;
}

.my-page {
  min-height: 100%;
  padding: 24rpx 24rpx 48rpx;
  background: linear-gradient(180deg, var(--app-page-bg-soft, #f0f3ff) 0%, var(--app-page-bg, #f5f7fa) 42%, #f8fafc 100%);
}

.profile-panel,
.section-card,
.action-list {
  background: #ffffff;
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 24rpx;
  box-shadow: var(--app-shadow-card, 0 4rpx 20rpx rgba(26, 29, 41, 0.05));
}

.profile-panel {
  padding: 30rpx;
  color: #ffffff;
  background: linear-gradient(
    135deg,
    #3f6ff3 0%,
    #4f7cff 52%,
    #6366f1 100%
  );
  box-shadow: 0 14rpx 34rpx rgba(79, 124, 255, 0.2);
}

.profile-panel__header {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.profile-panel__info {
  flex: 1;
  min-width: 0;
}

.profile-panel__name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.profile-panel__name {
  max-width: 280rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 40rpx;
  font-weight: 800;
}

.profile-panel__role {
  flex-shrink: 0;
  padding: 6rpx 14rpx;
  font-size: 22rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.18);
}

.profile-panel__phone,
.profile-panel__org {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.88);
}

.profile-panel__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 28rpx;
}

.profile-panel__meta-item {
  min-width: 0;
  padding: 16rpx 12rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.14);
}

.profile-panel__meta-value,
.profile-panel__meta-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.profile-panel__meta-value {
  font-size: 24rpx;
  font-weight: 700;
}

.profile-panel__meta-label {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.72);
}

.section-card,
.action-list {
  margin-top: 24rpx;
  padding: 28rpx;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
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
  font-size: 32rpx;
  font-weight: 800;
  color: $u-main-color;
}

.section-subtitle {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $u-tips-color;
}

.refresh-chip {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 18rpx;
  font-size: 22rpx;
  font-weight: 700;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  border-radius: 14rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 18rpx;
  background: #ffffff;
  border: 1rpx solid #edf2f7;
  border-radius: 18rpx;
  box-shadow: 0 4rpx 14rpx rgba(15, 23, 42, 0.03);
}

.stat-item__icon,
.menu-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-item__icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
}

.stat-item__icon--lead,
.menu-item__icon--setting {
  background: linear-gradient(135deg, #4f7cff, #6366f1);
}

.stat-item__icon--entry,
.menu-item__icon--help {
  background: linear-gradient(135deg, #0ea5e9, #38bdf8);
}

.stat-item__icon--approval,
.menu-item__icon--privacy {
  background: linear-gradient(135deg, #10b981, #34d399);
}

.stat-item__icon--amount,
.menu-item__icon--agreement {
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.stat-item__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.stat-item__value {
  color: $u-main-color;
  font-size: 32rpx;
  font-weight: 800;
}

.stat-item__label {
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
  border-bottom: 1rpx solid #edf2f7;
  transition: background 0.18s ease, transform 0.18s ease;

  &:active {
    background: #f8fafc;
    transform: scale(0.99);
  }
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item__icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
}

.menu-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.menu-item__title {
  font-size: 30rpx;
  font-weight: 700;
  color: $u-main-color;
}

.menu-item__desc {
  font-size: 23rpx;
  color: $u-tips-color;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  height: 88rpx;
  font-size: 28rpx;
  font-weight: 700;
  border-radius: 16rpx;
}

.action-btn--cache {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.action-btn--logout {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
</style>
