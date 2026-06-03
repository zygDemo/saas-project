<template>
  <layout :active-tab="0" navTitle="首页" show-tabbar>
    <view class="workbench">
      <view class="home-header">
        <view class="home-title-block">
          <text class="home-date">{{ todayText }}</text>
          <text class="home-title">{{ userDisplayName }}，开始处理业务</text>
          <text class="home-desc">线索、进件、补件和审批集中处理</text>
        </view>
        <view class="home-status">
          <u-icon name="checkmark-circle" size="26" color="#16a34a" />
          <text>在线</text>
        </view>
      </view>

      <view class="block-head">
        <text class="block-title">快捷入口</text>
        <text class="block-tip">扫码或直接发起业务</text>
      </view>

      <view class="quick-actions">
        <view
          class="quick-card quick-card--lead"
          @click="goTo('/pages/business/leadAdd')"
        >
          <view class="quick-left">
            <view class="quick-title-row">
              <u-icon name="plus-circle" size="44" color="#fff" />
              <text class="quick-text">新增线索</text>
            </view>
            <text class="quick-sub">快速获客，扫码录入</text>
          </view>
          <view class="qr-icon" @click.stop="showQr('lead')">
            <u-icon
              name="erweima"
              custom-prefix="custom-icon"
              size="65"
              color="#fff"
            />
          </view>
        </view>

        <view class="quick-card quick-card--credit" @click="goTo('/pages/business/idInfo')">
          <view class="quick-left">
            <view class="quick-title-row">
              <u-icon name="file-text" size="44" color="#fff" />
              <text class="quick-text">进件</text>
            </view>
            <text class="quick-sub">快速发起贷款申请</text>
          </view>
          <view class="qr-icon" @click.stop="showQr('credit')">
            <u-icon
              name="erweima"
              custom-prefix="custom-icon"
              size="65"
              color="#fff"
            />
          </view>
        </view>

      </view>

      <view class="overview-panel">
        <view class="overview-head">
          <text class="overview-title">今日概览</text>
          <text class="overview-sub">SaaS业务看板</text>
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

      <view class="todo-panel">
        <view class="overview-head">
          <text class="overview-title">待办中心</text>
          <text class="overview-sub">优先处理高时效任务</text>
        </view>
        <view class="todo-list">
          <view
            v-for="item in todoItems"
            :key="item.key"
            class="todo-item"
            @click="goTo(item.path)"
          >
            <view class="todo-left">
              <u-icon :name="item.icon" size="34" :color="item.color" />
              <text class="todo-title">{{ item.label }}</text>
            </view>
            <view class="todo-right">
              <text class="todo-count">{{ item.count }}</text>
              <u-icon name="arrow-right" size="24" color="#999" />
            </view>
          </view>
        </view>
      </view>

      <u-popup
        v-model="qrShow"
        mode="center"
        border-radius="16"
        :closeable="true"
        width="560rpx"
        @close="qrShow = false"
      >
        <view class="qr-popup">
          <text class="qr-title">{{ qrTitle }}</text>
          <u-image
            class="qr-img"
            :src="qrImgUrl"
            width="400rpx"
            height="400rpx"
            mode="aspectFit"
            border-radius="12"
          >
            <template #loading>
              <view class="qr-loading">
                <u-loading mode="circle" size="48" color="#5da7ff" />
                <text class="qr-loading-text">二维码生成中</text>
              </view>
            </template>
            <template #error>
              <view class="qr-error">
                <u-icon name="error-circle" size="48" color="#999" />
                <text class="qr-error-text">二维码生成失败</text>
              </view>
            </template>
          </u-image>
          <text class="qr-tip">{{ qrTipText }}</text>
        </view>
      </u-popup>

      <view
        v-for="(group, gi) in sections"
        :key="gi"
        class="section"
        :style="{ animationDelay: `${gi * 0.08}s` }"
      >
        <view class="section-head">
          <text class="section-title">{{ group.title }}</text>
          <text class="section-count">{{ group.items.length }} 项</text>
        </view>
        <view class="grid">
          <view
            v-for="(item, idx) in group.items"
            :key="idx"
            class="grid-item"
            :style="{ animationDelay: `${gi * 0.08 + idx * 0.04}s` }"
            @click="handleItem(item)"
          >
            <view class="icon-wrap">
              <u-icon :name="iconOf(item.icon)" size="40" :color="themeColor" />
              <u-badge v-if="item.badge" :value="item.badge" type="error" />
            </view>
            <text class="grid-text">{{ item.text }}</text>
          </view>
        </view>
      </view>
    </view>
  </layout>
</template>

<script setup>
import layout from "@/pages/layout/layout.vue";
import { $u, useTheme } from "uview-pro";
import { useBusinessApi } from "@/api/business";
import { useLocalStore } from "@/stores";
import { computed, onMounted, ref } from "vue";
import { isDev } from "@/common/env";

const { currentTheme } = useTheme();
const themeColor = computed(() => {
  return currentTheme.value?.color?.primary || "#409EFF";
});

const localStore = useLocalStore();
const businessApi = useBusinessApi();

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

const todoItems = computed(() => [
  {
    key: "supplement",
    label: "待补件",
    count: overview.value.pendingSupplement || 0,
    icon: "file-text",
    color: "#f59e0b",
    path: "/pages/business/supplementList",
  },
  {
    key: "signing",
    label: "待签约",
    count: overview.value.pendingSigning || 0,
    icon: "edit",
    color: "#22c55e",
    path: "/pages/business/faceSignList",
  },
  {
    key: "approval",
    label: "待审批",
    count: overview.value.pendingApproval || 0,
    icon: "time",
    color: "#409EFF",
    path: "/pages/business/approvalList",
  },
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

onMounted(loadOverview);

const ORDER_FILTER_STORAGE_KEY = "WORKBENCH_ORDER_FILTER";

const checkAuth = () => {
  if (!localStore.token) {
    uni.showModal({
      title: "提示",
      content: "您尚未登录，是否前往登录？",
      success: (res) => {
        if (res.confirm) {
          uni.reLaunch({ url: "/pages/auth/login" });
        }
      },
    });
    return false;
  }
  return true;
};

const goTo = (url) => {
  if (!checkAuth()) return;
  if (url === "/pages/business/orderList") {
    uni.switchTab({ url });
    return;
  }
  uni.navigateTo({ url });
};

const goToOrderNode = (nodeCode) => {
  if (!checkAuth()) return;
  uni.setStorageSync(ORDER_FILTER_STORAGE_KEY, {
    nodeCode: String(nodeCode || ""),
    updatedAt: Date.now(),
  });
  uni.switchTab({ url: "/pages/business/orderList" });
};

const handleItem = (item) => {
  if (!checkAuth()) return;
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
    uni.showToast({
      title: "缺少业务员ID，无法生成二维码",
      icon: "none",
    });
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
  "/pages/business/idInfo",
  "/pages/business/carInfo",
  "/pages/business/applyInfo",
  "/pages/business/applyResult",
  "/pages/business/idInfoSupplement",
  "/pages/business/carInfoSupplement",
  "/pages/business/orderInfoSupplement",
  "/pages/business/fileInfoSupplement",
  "/pages/business/entryList",
  "/pages/business/applyListPage",
]);

const sectionsRaw = [
  {
    title: "线索",
    items: [
      {
        text: "线索查询",
        icon: "search",
        path: "/pages/business/leadList",
      },
    ],
  },
  {
    title: "预审进件",
    items: [
      {
        text: "身份证信息",
        icon: "account",
        path: "/pages/business/idInfo",
      },
      {
        text: "车辆信息",
        icon: "car",
        path: "/pages/business/carInfo",
      },
      {
        text: "申请信息",
        icon: "file-text",
        path: "/pages/business/applyInfo",
      },
      {
        text: "签署授权书",
        icon: "edit",
        orderNode: "1400",
      },
      {
        text: "申请结果",
        icon: "checkmark-circle",
        path: "/pages/business/applyResult",
      },
      {
        text: "进件列表",
        icon: "list",
        path: "/pages/business/entryList",
      },
      {
        text: "预审列表",
        icon: "file-text",
        path: "/pages/business/applyListPage",
      },
    ],
  },
  {
    title: "预审跟进",
    items: [
      {
        text: "订单列表",
        icon: "list",
        path: "/pages/business/orderList",
      },
      {
        text: "风控预审",
        icon: "chart",
        orderNode: "2000",
      },
      {
        text: "资方预审",
        icon: "handshake",
        orderNode: "3000",
      },
      {
        text: "预审结果",
        icon: "checkmark-circle",
        path: "/pages/business/applyListPage",
      },
    ],
  },
  {
    title: "资料补充",
    items: [
      {
        text: "客户资料",
        icon: "account",
        path: "/pages/business/idInfoSupplement",
      },
      {
        text: "车辆资料",
        icon: "car",
        path: "/pages/business/carInfoSupplement",
      },
      {
        text: "订单信息",
        icon: "file-text",
        path: "/pages/business/orderInfoSupplement",
      },
      {
        text: "文件信息",
        icon: "file-text",
        path: "/pages/business/fileInfoSupplement",
      },
      {
        text: "补充列表",
        icon: "list",
        path: "/pages/business/supplementList",
      },
    ],
  },
  {
    title: "审核签约",
    items: [
      {
        text: "风控初审",
        icon: "hourglass",
        orderNode: "5000",
      },
      {
        text: "风控终审",
        icon: "hourglass-half-fill",
        orderNode: "6000",
      },
      {
        text: "资方终审",
        icon: "handshake",
        orderNode: "8000",
      },
      {
        text: "签约中心",
        icon: "edit",
        path: "/pages/business/faceSignList",
      },
      {
        text: "请款资料",
        icon: "file",
        orderNode: "7000",
      },
      {
        text: "资方放款",
        icon: "money-circle",
        orderNode: "9000",
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
.workbench {
  min-height: 100vh;
  padding: 22rpx 22rpx 36rpx;
  background: #f5f7fb;
}

.home-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 28rpx 28rpx 30rpx;
  margin-bottom: 24rpx;
  color: #fff;
  background: linear-gradient(135deg, #1f5fbf 0%, #2563eb 52%, #0f9f8f 100%);
  border-radius: 18rpx;
  box-shadow: 0 14rpx 34rpx rgba(37, 99, 235, 0.18);
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
}

.home-title {
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1.25;
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
  border-radius: 999rpx;
}

.block-head,
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.block-head {
  margin-bottom: 16rpx;
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

.overview-panel,
.todo-panel {
  margin-bottom: 24rpx;
  padding: 26rpx;
  background: #fff;
  border: 1rpx solid #e8edf5;
  border-radius: 18rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
}

.overview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 22rpx;
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
  background: #f8fafc;
  border: 1rpx solid #edf2f7;
  border-radius: 12rpx;
  text-align: center;
}

.overview-value {
  font-size: 32rpx;
  font-weight: 800;
  line-height: 1.1;
  color: #2563eb;
}

.overview-label {
  font-size: 22rpx;
  color: #6b7280;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.todo-item,
.todo-left,
.todo-right {
  display: flex;
  align-items: center;
}

.todo-item {
  justify-content: space-between;
  min-height: 84rpx;
  padding: 18rpx 20rpx;
  background: #f8fafc;
  border: 1rpx solid #edf2f7;
  border-radius: 12rpx;

  &:active {
    background: #eef5ff;
  }
}

.todo-left {
  gap: 12rpx;
  min-width: 0;
}

.todo-title {
  font-size: 26rpx;
  color: #1f2937;
}

.todo-right {
  gap: 8rpx;
}

.todo-count {
  font-size: 30rpx;
  font-weight: 800;
  color: #162033;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  width: 100%;
  margin-bottom: 24rpx;
}

.quick-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-height: 132rpx;
  padding: 24rpx 22rpx;
  color: #fff;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  border-radius: 16rpx;
  box-shadow: 0 10rpx 24rpx rgba(37, 99, 235, 0.16);

  &:active {
    transform: translateY(2rpx);
  }

  &--lead {
    background: linear-gradient(135deg, #0f9f8f, #22c55e);
    box-shadow: 0 10rpx 24rpx rgba(15, 159, 143, 0.16);
  }

  &--credit {
    background: linear-gradient(135deg, #2563eb, #5b7cfa);
    box-shadow: 0 10rpx 24rpx rgba(37, 99, 235, 0.18);
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
  gap: 10rpx;
}

.quick-text {
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1.2;
}

.quick-sub {
  font-size: 22rpx;
  line-height: 1.35;
  opacity: 0.85;
}

.qr-icon {
  width: 74rpx;
  height: 74rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 255, 255, 0.22);
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:active {
    background: rgba(255, 255, 255, 0.35);
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

.qr-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f1f1f;
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
  margin-top: 28rpx;
}

.section-head {
  margin-bottom: 16rpx;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14rpx;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 132rpx;
  padding: 14rpx 8rpx;
  background: #fff;
  border: 1rpx solid #e8edf5;
  border-radius: 12rpx;
  animation: slideUp 0.4s ease-out both;
  transition: all 0.3s ease;

  &:active {
    background: #eef5ff;
    transform: scale(0.98);
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

.icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58rpx;
  height: 58rpx;
  background: #eef5ff;
  border-radius: 14rpx;
}

.grid-text {
  width: 100%;
  font-size: 23rpx;
  line-height: 1.25;
  color: #263449;
  text-align: center;
}
</style>
