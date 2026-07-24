<template>
  <layout :active-tab="0" navTitle="首页" show-tabbar tabbar-scope="carloan">
    <scroll-view class="workbench-scroll" scroll-y>
      <view class="workbench">
        <!-- 顶部欢迎区 -->
        <view class="home-header">
          <view class="home-title-block">
            <text class="home-date">{{ todayText }}</text>
            <text class="home-title">{{ userDisplayName }}，开始处理业务</text>
            <text class="home-desc">线索、进件、补件和审批集中处理</text>
          </view>
          <view class="home-status">
            <view class="msg-badge" role="button" tabindex="0" @click.stop="goTo(APP_ROUTES.carloan.portal.messageCenter)">
              <u-icon name="bell" size="36" color="#fff" />
              <view v-if="unreadCount > 0" class="badge-dot">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
            </view>
            <view class="status-pill">
              <u-icon name="checkmark-circle" size="24" color="#86efac" />
              <text>在线</text>
            </view>
          </view>
        </view>

        <!-- 公告横幅 -->
        <view
          v-if="latestAnnouncement"
          class="announcement-banner"
          role="button"
          tabindex="0"
          @click="goTo(APP_ROUTES.carloan.portal.messageCenter)"
        >
          <view class="announcement-icon">
            <u-icon name="volume-up" size="28" color="var(--u-type-primary)" />
          </view>
          <text class="announcement-text">{{ latestAnnouncement.title }}</text>
          <u-icon name="arrow-right" size="22" color="#94a3b8" />
        </view>

        <!-- 快捷入口 -->
        <view class="block-head">
          <text class="block-title">快捷入口</text>
          <text class="block-tip">扫码或直接发起业务</text>
        </view>

        <view class="quick-actions">
          <view
            class="quick-card quick-card--lead" role="button" tabindex="0" @click="goTo(APP_ROUTES.carloan.precheck.leadAdd)"
          >
            <view class="quick-left">
              <view class="quick-title-row">
                <view class="quick-icon">
                  <u-icon name="plus-circle" size="40" color="#fff" />
                </view>
                <text class="quick-text">新增线索</text>
              </view>
              <text class="quick-sub">快速获客，扫码录入</text>
            </view>
            <view class="qr-icon" role="button" tabindex="0" @click.stop="showQr('lead')">
              <view class="qr-bg">
                <u-icon
                  name="erweima"
                  custom-prefix="custom-icon"
                  size="60"
                  color="#fff"
                />
              </view>
            </view>
          </view>

          <view class="quick-card quick-card--credit" role="button" tabindex="0" @click="goTo(APP_ROUTES.carloan.precheck.idInfo)">
            <view class="quick-left">
              <view class="quick-title-row">
                <view class="quick-icon">
                  <u-icon name="file-text" size="40" color="#fff" />
                </view>
              <text class="quick-text">进件</text>
            </view>
            <text class="quick-sub">快速发起贷款申请</text>
          </view>
          <view class="qr-icon" role="button" tabindex="0" @click.stop="showQr('credit')">
            <view class="qr-bg">
              <u-icon
                name="erweima"
                custom-prefix="custom-icon"
                size="60"
                color="#fff"
              />
            </view>
          </view>
        </view>

      </view>

      <!-- 今日概览 -->
      <view class="overview-panel">
        <view class="overview-head">
          <view>
            <text class="overview-title">今日概览</text>
            <text class="overview-sub">SaaS业务看板</text>
          </view>
          <view class="overview-refresh" @click="loadOverview">
            <u-icon name="reload" size="26" color="var(--u-type-primary)" />
          </view>
        </view>
        <view class="overview-grid">
          <view
            v-for="item in overviewItems"
            :key="item.key"
            class="overview-item"
          >
            <text class="overview-value">{{ item.value }}</text>
            <text class="overview-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 待办入口 -->
      <view class="todo-entry" role="button" tabindex="0" @click="goTo(APP_ROUTES.carloan.portal.todoCenter)">
        <view class="todo-entry__left">
          <view class="todo-icon">
            <u-icon name="list" size="32" color="#fff" />
          </view>
          <view class="todo-info">
            <text class="todo-entry__text">待办中心</text>
            <text class="todo-entry__tip">补件、签约、审批</text>
          </view>
        </view>
        <view class="todo-entry__right">
          <u-icon name="arrow-right" size="30" color="#94a3b8" />
        </view>
      </view>

      <!-- 二维码弹窗 -->
      <u-popup
        v-model="qrShow"
        mode="center"
        border-radius="24"
        :closeable="true"
        width="560rpx"
        @close="qrShow = false"
      >
        <view class="qr-popup">
          <text class="qr-title">{{ qrTitle }}</text>
          <view class="qr-image-wrap">
            <u-image
              class="qr-img"
              :src="qrImgUrl"
              width="380rpx"
              height="380rpx"
              mode="aspectFit"
              border-radius="16"
            >
              <template #loading>
                <view class="qr-loading">
                  <u-loading mode="circle" size="48" color="var(--u-type-primary)" />
                  <text class="qr-loading-text">二维码生成中</text>
                </view>
              </template>
              <template #error>
                <view class="qr-error">
                  <u-icon name="error-circle" size="48" color="#94a3b8" />
                  <text class="qr-error-text">二维码生成失败</text>
                </view>
              </template>
            </u-image>
          </view>
          <text class="qr-tip">{{ qrTipText }}</text>
        </view>
      </u-popup>

      <!-- 业务流程 -->
      <view
        v-for="(group, gi) in sections"
        :key="gi"
        class="section"
        :style="{ animationDelay: `${gi * 0.08}s` }"
      >
        <view class="section-head">
          <text class="section-title">{{ group.title }}</text>
          <view class="section-badge">
            <text class="section-count">{{ group.items.length }} 项</text>
          </view>
        </view>
        <view class="grid">
          <view
            v-for="(item, idx) in group.items"
            :key="idx"
            class="grid-item"
            :style="{ animationDelay: `${gi * 0.08 + idx * 0.04}s` }"
            @click="handleItem(item)"
          >
            <view class="grid-topline">
              <view class="icon-wrap">
                <u-icon :name="iconOf(item.icon)" size="36" :color="themeColor" />
                <u-badge v-if="item.badge" :value="item.badge" type="error" />
              </view>
              <text v-if="item.orderNode" class="node-code">{{ item.orderNode }}</text>
            </view>
            <text class="grid-text">{{ item.text }}</text>
            <text class="grid-hint">查看待处理订单</text>
          </view>
        </view>
      </view>
    </view>
    </scroll-view>
  </layout>
</template>

<script setup>
import layout from "@/components/layout/layout.vue";
import { $u, useTheme } from "uview-pro";
import { useCarloanApi } from "@/api/carloan";
import { useLocalStore } from "@/stores";
import { CurrentSystem } from "@/stores/local";
import { computed, onMounted, ref } from "vue";
import { isDev } from "@/common/env";
import { fetchActiveAnnouncements } from "@/api/announcement";
import { useWebSocket } from "@/composables/useWebSocket";
import { APP_ROUTES } from "@/common/navigation";

const { currentTheme } = useTheme();
const themeColor = computed(() => {
  return currentTheme.value?.color?.primary || "var(--u-type-primary)";
});

const localStore = useLocalStore();
const { connect: wsConnect, onNotification } = useWebSocket();
const businessApi = useCarloanApi();

// 消息未读数
const unreadCount = ref(0);
const latestAnnouncement = ref(null);

function loadUnreadCount() {
  try {
    const stored = uni.getStorageSync("MESSAGE_CENTER_DATA");
    if (stored && Array.isArray(stored)) {
      unreadCount.value = stored.filter((m) => !m.read).length;
    }
  } catch (e) {
    // ignore
  }
}

const userDisplayName = computed(() => {
  const userInfo = localStore.userInfo || {};
  return (
    userInfo.nickName ||
    userInfo.realName ||
    userInfo.userName ||
    userInfo.username ||
    "业务伙伴"
  );
});

const todayText = computed(() => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}月${day}日`;
});

const overview = ref({
  todayLeads: 0,
  todayApplications: 0,
  pendingSupplement: 0,
  pendingSigning: 0,
  pendingApproval: 0,
  monthLoanAmount: 0,
  approvalRate: "-",
});

const formatAmount = (amount) => {
  const value = Number(amount || 0);
  if (!value) return "0";
  return value >= 10000 ? `${(value / 10000).toFixed(1)}万` : String(value);
};

const overviewItems = computed(() => [
  { key: "todayLeads", label: "今日线索", value: overview.value.todayLeads || 0 },
  { key: "todayApplications", label: "今日进件", value: overview.value.todayApplications || 0 },
  { key: "pendingSupplement", label: "待补件", value: overview.value.pendingSupplement || 0 },
  { key: "pendingSigning", label: "待签约", value: overview.value.pendingSigning || 0 },
  {
    key: "monthLoanAmount",
    label: "本月放款",
    value: formatAmount(overview.value.monthLoanAmount),
  },
  { key: "approvalRate", label: "审批通过率", value: overview.value.approvalRate || "-" },
]);



const normalizeOverview = (data) => {
  const source = data?.data || data || {};
  overview.value = {
    ...overview.value,
    todayLeads: source.todayLeads || source.leadCountToday || source.leadsToday || 0,
    todayApplications:
      source.todayApplications || source.applicationCountToday || source.creditCountToday || 0,
    pendingSupplement: source.pendingSupplement || source.supplementCount || 0,
    pendingSigning: source.pendingSigning || source.signingCount || 0,
    pendingApproval: source.pendingApproval || source.approvalCount || 0,
    monthLoanAmount: source.monthLoanAmount || source.loanAmountMonth || 0,
    approvalRate: source.approvalRate || source.passRate || "-",
  };
};

const loadOverview = async () => {
  if (!localStore.token) return;
  try {
    const res = await businessApi.getStatisticsOverview();
    if (res?.code === 200) {
      normalizeOverview(res);
    }
  } catch (error) {
    console.warn("获取工作台统计失败", error);
  }
};

async function loadLatestAnnouncement() {
  try {
    const res = await fetchActiveAnnouncements();
    const list = res?.data || res || [];
    if (Array.isArray(list) && list.length > 0) {
      latestAnnouncement.value = list[0];
    }
  } catch (e) {
    // ignore
  }
}

onMounted(() => {
  localStore.setCurrentSystem(CurrentSystem.CARLOAN);
  loadOverview();
  loadUnreadCount();
  loadLatestAnnouncement();

  // 连接 WebSocket 实时通知
  if (localStore.token) {
    wsConnect();
    onNotification((msg) => {
      // 更新未读数
      unreadCount.value++;
      // 如果是公告，刷新公告横幅
      if (msg.type === 'announcement') {
        loadLatestAnnouncement();
      }
    });
  }
});

const ORDER_FILTER_STORAGE_KEY = "WORKBENCH_ORDER_FILTER";

const checkAuth = async () => {
  if (!localStore.token) {
    const res = await new Promise<{ confirm: boolean }>((resolve) => {
      uni.showModal({ title: '提示', content: '您尚未登录，是否前往登录？', confirmText: '确认', cancelText: '取消', confirmColor: '#576b95', success: (r) => resolve({ confirm: r.confirm }), fail: () => resolve({ confirm: false }) });
    });
    const ok = res.confirm;
    if (ok) {
      uni.reLaunch({ url: APP_ROUTES.auth.login });
    }
    return false;
  }
  return true;
};

const goTo = async (url) => {
  if (!(await checkAuth())) return;
  uni.navigateTo({ url });
};

const goToOrderNode = async (nodeCode) => {
  if (!(await checkAuth())) return;
  uni.setStorageSync(ORDER_FILTER_STORAGE_KEY, {
    nodeCode: String(nodeCode || ""),
    updatedAt: Date.now(),
  });
  uni.navigateTo({ url: APP_ROUTES.carloan.precheck.orderList });
};

const handleItem = async (item) => {
  if (!(await checkAuth())) return;
  if (item.orderNode) {
    goToOrderNode(item.orderNode);
    return;
  }
  if (item.path) {
    goTo(item.path);
    return;
  }
  $u.toast("功能开发中");
};

const FALLBACK_ICON = "question-circle";
const VALID_ICONS = new Set([
  "account",
  "arrow-right",
  "bag",
  "camera",
  "car",
  "chart",
  "chat",
  "chat-fill",
  "checkmark-circle",
  "edit",
  "file",
  "file-text",
  "folder",
  "grid",
  "handshake",
  "hourglass",
  "hourglass-half-fill",
  "info",
  "list",
  "location",
  "money-circle",
  "plus-circle",
  "question-circle",
  "return",
  "search",
  "send",
  "setting",
  "shopping-cart",
  "star",
  "time",
  "upload",
  "user",
  "warning",
]);

const iconOf = (name) => {
  return VALID_ICONS.has(name) ? name : FALLBACK_ICON;
};

const qrShow = ref(false);
const qrTitle = ref("");
const qrImgUrl = ref("");
const qrExpireAt = ref(0);

const QR_VALID_MS = 60 * 60 * 24 * 7 * 1000;
const QR_CONFIG = {
  lead: { title: "新增线索", path: "leadAdd" },
  credit: { title: "进件", path: "idInfo" },
};

const formatExpireTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${month}月${day}日 ${hours}:${minutes}`;
};

const qrTipText = computed(() => {
  const deadlineText = formatExpireTime(qrExpireAt.value);
  return deadlineText
    ? `该二维码7天内(${deadlineText})有效`
    : "客户扫码后可继续办理业务";
});

const showQr = (type) => {
  const config = QR_CONFIG[type] || QR_CONFIG.credit;
  qrTitle.value = config.title;
  const baseUrl =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";
  const salesmanId = localStore.userInfo?.userId;

  if (!salesmanId) {
    showFailToast("缺少业务员ID，无法生成二维码");
    return;
  }

  qrExpireAt.value = Date.now() + QR_VALID_MS;
  const transferInfo = encodeURIComponent(
    JSON.stringify({
      path: config.path,
      businessType: config.businessType,
      salesmanId: String(salesmanId),
      roleTags: "客户",
    }),
  );

  const fullPath = `${baseUrl}/#/pages/auth/transfer?transferInfo=${transferInfo}`;
  qrImgUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    fullPath,
  )}`;
  qrShow.value = true;
};

const DEV_ONLY_PATHS = new Set([
  APP_ROUTES.carloan.precheck.idInfo,
  APP_ROUTES.carloan.precheck.carInfo,
  APP_ROUTES.carloan.precheck.applyInfo,
  APP_ROUTES.carloan.precheck.applyResult,
  APP_ROUTES.carloan.supplement.idInfoSupplement,
  APP_ROUTES.carloan.supplement.carInfoSupplement,
  APP_ROUTES.carloan.supplement.orderInfoSupplement,
  APP_ROUTES.carloan.supplement.fileInfoSupplement,
  APP_ROUTES.carloan.precheck.entryList,
  APP_ROUTES.carloan.precheck.applyListPage,
]);

const sectionsRaw = [
  {
    title: "预审阶段",
    items: [
      {
        text: "身份证信息",
        icon: "file-text",
        orderNode: "1100",
      },
      {
        text: "车辆信息",
        icon: "car",
        orderNode: "1110",
      },
      {
        text: "申请信息",
        icon: "form",
        orderNode: "1120",
      },
      {
        text: "签署授权书",
        icon: "edit",
        orderNode: "1130",
      },
    ],
  },
  {
    title: "补件阶段",
    items: [
      {
        text: "客户资料",
        icon: "user",
        orderNode: "1310",
      },
      {
        text: "车辆资料",
        icon: "car",
        orderNode: "1320",
      },
      {
        text: "订单资料",
        icon: "file",
        orderNode: "1330",
      },
      {
        text: "文件资料",
        icon: "folder",
        orderNode: "1340",
      },
    ],
  },
  {
    title: "签约阶段",
    items: [
      {
        text: "额度确认",
        icon: "check-circle",
        orderNode: "1610",
      },
      {
        text: "绑银行卡",
        icon: "credit-card",
        orderNode: "1620",
      },
      {
        text: "合同签署",
        icon: "edit",
        orderNode: "1630",
      },
      {
        text: "GPS安装",
        icon: "map",
        orderNode: "1640",
      },
      {
        text: "抵押办理",
        icon: "lock",
        orderNode: "1650",
      },
    ],
  },
  {
    title: "贷后阶段",
    items: [
      {
        text: "贷后还款",
        icon: "money-circle",
        orderNode: "1900",
      },
    ],
  },
];

const sections = computed(() => {
  if (isDev) return sectionsRaw;

  return sectionsRaw
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !DEV_ONLY_PATHS.has(item.path)),
    }))
    .filter((group) => group.items.length > 0);
});
</script>

<style lang="scss" scoped>
.workbench-scroll {
  height: 100%;
}

.workbench {
  min-height: 100vh;
  padding: 24rpx 24rpx 40rpx;
  background: linear-gradient(180deg, var(--app-page-bg-soft, #f0f3ff) 0%, var(--app-page-bg, #f5f7fa) 36%, #f8fafc 100%);
}

.home-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 32rpx 30rpx;
  margin-bottom: 24rpx;
  color: #fff;
  background: linear-gradient(135deg, #3f6ff3 0%, #4f7cff 58%, #35b6c8 100%);
  border-radius: 24rpx;
  box-shadow: 0 14rpx 34rpx rgba(79, 124, 255, 0.2);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: -40rpx;
    right: -40rpx;
    width: 180rpx;
    height: 180rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    pointer-events: none;
  }
}

.home-title-block {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}

.home-date {
  margin-bottom: 12rpx;
  font-size: 22rpx;
  opacity: 0.82;
  letter-spacing: 0.06em;
}

.home-title {
  font-size: 36rpx;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0.02em;
}

.home-desc {
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.45;
  opacity: 0.88;
}

.home-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 6rpx;
  padding: 8rpx 14rpx;
  font-size: 22rpx;
  color: #dcfce7;
  background: rgba(255, 255, 255, 0.16);
  border: 1rpx solid rgba(255, 255, 255, 0.22);
  border-radius: 18rpx;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6rpx;
}

.msg-badge {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8rpx;
}

.badge-dot {
  position: absolute;
  top: -8rpx;
  right: -10rpx;
  min-width: 28rpx;
  height: 28rpx;
  line-height: 28rpx;
  text-align: center;
  font-size: 18rpx;
  font-weight: 700;
  color: #fff;
  background: #ef4444;
  border-radius: 28rpx;
  padding: 0 6rpx;
}

.block-head,
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.block-head {
  margin: 2rpx 4rpx 16rpx;
}

.block-title,
.section-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #162033;
}

.block-tip,
.section-count {
  font-size: 22rpx;
  color: #7b8798;
}

.overview-panel {
  margin-bottom: 24rpx;
  padding: 24rpx;
  background: var(--app-surface, #fff);
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 24rpx;
  box-shadow: var(--app-shadow-card, 0 4rpx 20rpx rgba(26, 29, 41, 0.05));
}

.overview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 22rpx;
}

.overview-refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  background: rgba(82, 64, 254, 0.06);
  transition: opacity 0.2s ease;

  &:active {
    opacity: 0.7;
  }
}

.overview-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #162033;
}

.overview-sub {
  font-size: 22rpx;
  color: #7b8798;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.overview-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  justify-content: center;
  min-height: 112rpx;
  padding: 18rpx 10rpx;
  background: var(--app-surface-muted, #f8fafc);
  border: 1rpx solid #edf2f7;
  border-radius: 16rpx;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:active {
    transform: scale(0.985);
    background: #f6f9ff;
    box-shadow: 0 4rpx 12rpx rgba(82, 64, 254, 0.08);
  }
}

.overview-value {
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.1;
  color: var(--u-type-primary-dark);
}

.overview-label {
  font-size: 22rpx;
  color: #6b7280;
}








.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
  width: 100%;
  margin-bottom: 24rpx;
}

.quick-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 136rpx;
  padding: 24rpx;
  color: #fff;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--u-type-primary-dark), #06b6d4);
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: translateY(3rpx) scale(0.985);
    box-shadow: 0 6rpx 14rpx rgba(79, 124, 255, 0.18);
  }

  &--lead {
    background: linear-gradient(135deg, #19a38d, #2ecb7d);
    box-shadow: 0 10rpx 24rpx rgba(25, 163, 141, 0.16);
  }

  &--credit {
    background: linear-gradient(135deg, #4f7cff, #6366f1);
    box-shadow: 0 10rpx 24rpx rgba(79, 124, 255, 0.18);
  }
}

.quick-left {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.quick-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.quick-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.18);
  border: 1rpx solid rgba(255, 255, 255, 0.22);
}

.quick-text {
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.02em;
}

.quick-sub {
  font-size: 22rpx;
  line-height: 1.35;
  opacity: 0.82;
  letter-spacing: 0.02em;
}

.qr-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qr-bg {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 255, 255, 0.24);
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.14);
  transition: all 0.2s ease;

  &:active {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(0.92);
  }
}

.qr-popup {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  gap: 24rpx;
}

.qr-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
  border-radius: 20rpx;
  background: #f8fafc;
  border: 1rpx solid #e5ecf6;
}

.qr-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: 0.02em;
}

.qr-loading,
.qr-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.qr-loading-text,
.qr-error-text,
.qr-tip {
  font-size: 24rpx;
  color: #999;
}

.qr-img {
  width: 400rpx;
  height: 400rpx;
  border-radius: 12rpx;
}

.section {
  position: relative;
  margin-top: 28rpx;
  padding: 24rpx;
  background: var(--app-surface, #fff);
  border: 1rpx solid var(--app-border, #e8edf5);
  border-radius: 24rpx;
  box-shadow: var(--app-shadow-card, 0 4rpx 20rpx rgba(26, 29, 41, 0.05));
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 24rpx;
    right: 24rpx;
    height: 2rpx;
    background: linear-gradient(90deg, rgba(82, 64, 254, 0.12), rgba(53, 182, 200, 0.12));
    border-radius: 2rpx;
  }
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.section-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4rpx 14rpx;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 14rpx;
}

.section-title {
  position: relative;
  padding-left: 18rpx;
  letter-spacing: 0;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 6rpx;
    height: 28rpx;
    background: linear-gradient(180deg, #4f7cff, #35b6c8);
    border-radius: 8rpx;
    transform: translateY(-50%);
  }
}

.section-count {
  padding: 4rpx 14rpx;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 14rpx;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.grid-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: space-between;
  min-height: 150rpx;
  padding: 20rpx;
  overflow: hidden;
  background: #ffffff;
  border: 1rpx solid #e5ecf6;
  border-radius: 20rpx;
  animation: slideUp 0.4s ease-out both;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:active {
    background: #f6f9ff;
    box-shadow: 0 8rpx 22rpx rgba(82, 64, 254, 0.1);
    transform: scale(0.985);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.grid-topline {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  background: #f0f4ff;
  border: 1rpx solid #dbeafe;
  border-radius: 16rpx;
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.9);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.node-code {
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1;
  color: #94a3b8;
  font-family: DINAlternate-Bold, Arial, sans-serif;
}

.grid-text {
  position: relative;
  z-index: 1;
  width: 100%;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.25;
  color: #1e293b;
  letter-spacing: 0.02em;
}

.grid-hint {
  position: relative;
  z-index: 1;
  margin-top: 6rpx;
  font-size: 22rpx;
  line-height: 1.35;
  color: #64748b;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container { background-color: #121212; }
  .card { background-color: #1e1e1e; }
  .card-item { background-color: #1e1e1e; }
  .list-item { background-color: #1e1e1e; }
  .section { background-color: #1e1e1e; }
  .header { background-color: #1e1e1e; }
  .title { color: #e5e6eb; }
  .subtitle { color: #8b8c91; }
  .desc { color: #8b8c91; }
  .label { color: #b0b3b8; }
  .value { color: #e5e6eb; }
  .name { color: #e5e6eb; }
  .info { color: #b0b3b8; }
  .text { color: #e5e6eb; }
  .tip { color: #8b8c91; }
  .empty-text { color: #666; }
  .divider { background-color: #2a2a2a; }
  .border { border-color: #2a2a2a; }
  .input { background-color: #2a2a2a; color: #e5e6eb; }
  .search-bar { background-color: #2a2a2a; }
  .tab-bar { background-color: #1e1e1e; border-color: #2a2a2a; }
  .tab-item { color: #b0b3b8; }
  .tab-item.active { color: var(--u-type-primary); }
  .status-bar { background-color: #1e1e1e; }
  .footer { background-color: #1e1e1e; }
  .modal { background-color: #1e1e1e; }
  .popup { background-color: #1e1e1e; }
  .shadow { box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2); }
}

.announcement-banner {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: #f0f5ff;
  border: 1rpx solid #d6e4ff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
  transition: opacity 0.2s ease, transform 0.2s ease;

  &:active {
    opacity: 0.85;
    transform: scale(0.995);
  }
}

.announcement-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: rgba(82, 64, 254, 0.08);
  flex-shrink: 0;
}

.announcement-text {
  flex: 1;
  font-size: 26rpx;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.todo-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  border-left: 6rpx solid var(--u-type-primary);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:active {
    transform: scale(0.995);
    box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.04);
  }
}

.todo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  background: rgba(82, 64, 254, 0.08);
  margin-right: 16rpx;
  flex-shrink: 0;
}

.todo-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rpx;
}

.todo-entry__left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.todo-entry__text {
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.02em;
}

.todo-entry__right {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.todo-entry__tip {
  font-size: 24rpx;
  color: #8c8c8c;
  letter-spacing: 0.02em;
}
</style>
