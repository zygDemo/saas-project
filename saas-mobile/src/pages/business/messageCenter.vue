<template>
  <app-page nav-title="消息中心">
    <view class="message-page">
      <!-- 消息统计 -->
      <view class="msg-stats">
        <view class="stat-item" @click="switchTab('all')">
          <text class="stat-value">{{ totalCount }}</text>
          <text class="stat-label" :class="{ active: currentTab === 'all' }">全部</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item" @click="switchTab('unread')">
          <text class="stat-value highlight">{{ unreadCount }}</text>
          <text class="stat-label" :class="{ active: currentTab === 'unread' }">未读</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item" @click="switchTab('approval')">
          <text class="stat-value">{{ approvalCount }}</text>
          <text class="stat-label" :class="{ active: currentTab === 'approval' }">审批</text>
        </view>
        <view class="stat-divider" />
        <view class="stat-item" @click="switchTab('system')">
          <text class="stat-value">{{ systemCount }}</text>
          <text class="stat-label" :class="{ active: currentTab === 'system' }">系统</text>
        </view>
      </view>

      <!-- 操作栏 -->
      <view class="action-bar">
        <view class="action-left">
          <text class="action-title">{{ tabTitle }}</text>
          <text class="action-count">{{ filteredMessages.length }}条</text>
        </view>
        <view class="action-right" @click="markAllRead">
          <u-icon name="checkbox-mark" size="28" color="#3b82f6" />
          <text class="action-link">全部已读</text>
        </view>
      </view>

      <!-- 消息列表 -->
      <scroll-view
        class="msg-scroll"
        scroll-y
        refresher-enabled
        :refresher-triggered="isRefreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
      >
        <view v-if="filteredMessages.length > 0" class="msg-list">
          <view
            v-for="(msg, index) in filteredMessages"
            :key="msg.id || index"
            class="msg-card"
            :class="{
              'msg-card--unread': !msg.read,
              [`msg-card--${msg.type}`]: true,
            }"
            :style="{ animationDelay: `${index * 0.04}s` }"
            @click="handleMessageClick(msg)"
          >
            <!-- 消息图标 -->
            <view class="msg-icon" :class="`msg-icon--${msg.type}`">
              <u-icon :name="getMsgIcon(msg.type)" size="36" color="#fff" />
              <view v-if="!msg.read" class="unread-dot" />
            </view>

            <!-- 消息内容 -->
            <view class="msg-body">
              <view class="msg-header">
                <text class="msg-title">{{ msg.title }}</text>
                <text class="msg-time">{{ formatTime(msg.time) }}</text>
              </view>
              <text class="msg-content">{{ msg.content }}</text>
              <view v-if="msg.customerName || msg.orderNo" class="msg-meta">
                <view v-if="msg.customerName" class="meta-tag">
                  <u-icon name="account" size="20" color="#8c8c8c" />
                  <text>{{ msg.customerName }}</text>
                </view>
                <view v-if="msg.orderNo" class="meta-tag">
                  <u-icon name="order" size="20" color="#8c8c8c" />
                  <text>{{ msg.orderNo }}</text>
                </view>
              </view>
            </view>

            <!-- 右侧箭头 -->
            <view class="msg-arrow">
              <u-icon name="arrow-right" size="28" color="#c0c4cc" />
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="empty-state">
          <u-icon name="bell" size="80" color="#e5e7eb" />
          <text class="empty-text">暂无消息</text>
          <text class="empty-desc">{{ currentTab === 'unread' ? '所有消息都已读' : '暂时没有相关消息' }}</text>
        </view>

        <!-- 加载更多 -->
        <u-loadmore v-if="loading" status="loading" />
        <u-loadmore v-if="!loading && noMore && filteredMessages.length > 0" status="nomore" />
      </scroll-view>
    </view>
  </app-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useLocalStore } from "@/stores/local";

const localStore = useLocalStore();

const loading = ref(false);
const isRefreshing = ref(false);
const noMore = ref(false);
const currentTab = ref("all");

// 消息类型：approval(审批)、supplement(补件)、signing(签约)、loan(放款)、repayment(还款)、system(系统)
const messages = ref([]);

const tabTitle = computed(() => {
  const map = {
    all: "全部消息",
    unread: "未读消息",
    approval: "审批消息",
    system: "系统消息",
  };
  return map[currentTab.value] || "全部消息";
});

const totalCount = computed(() => messages.value.length);
const unreadCount = computed(() => messages.value.filter((m) => !m.read).length);
const approvalCount = computed(() =>
  messages.value.filter((m) => ["approval", "supplement", "signing", "loan"].includes(m.type)).length
);
const systemCount = computed(() =>
  messages.value.filter((m) => m.type === "system").length
);

const filteredMessages = computed(() => {
  let list = messages.value;
  if (currentTab.value === "unread") {
    list = list.filter((m) => !m.read);
  } else if (currentTab.value === "approval") {
    list = list.filter((m) => ["approval", "supplement", "signing", "loan"].includes(m.type));
  } else if (currentTab.value === "system") {
    list = list.filter((m) => m.type === "system");
  }
  return list;
});

const MSG_ICONS = {
  approval: "checkbox-mark-circle",
  supplement: "folder-upload",
  signing: "edit-pen",
  loan: "rmb-circle",
  repayment: "calendar",
  system: "setting",
  warning: "warning",
  info: "info-circle",
};

function getMsgIcon(type) {
  return MSG_ICONS[type] || "bell";
}

function formatTime(time) {
  if (!time) return "";
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;

  // 1小时内
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return mins <= 0 ? "刚刚" : `${mins}分钟前`;
  }
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
  // 更早
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function switchTab(tab) {
  currentTab.value = tab;
}

function markAllRead() {
  messages.value.forEach((m) => {
    m.read = true;
  });
  saveMessages();
  uni.showToast({ title: "已全部标为已读", icon: "success" });
}

function handleMessageClick(msg) {
  // 标记已读
  msg.read = true;
  saveMessages();

  // 跳转到对应页面
  if (msg.link) {
    uni.navigateTo({ url: msg.link });
  } else if (msg.orderNo || msg.creditOrderId) {
    uni.navigateTo({
      url: `/pages/business/applyProgress?creditOrderId=${msg.creditOrderId || msg.orderNo}`,
    });
  }
}

async function onRefresh() {
  isRefreshing.value = true;
  await loadMessages();
  isRefreshing.value = false;
}

async function loadMore() {
  if (loading.value || noMore.value) return;
  // 可扩展：加载更多历史消息
  noMore.value = true;
}

// 从本地存储加载消息
function loadMessages() {
  try {
    const stored = uni.getStorageSync("MESSAGE_CENTER_DATA");
    if (stored && Array.isArray(stored)) {
      messages.value = stored;
    }
  } catch (e) {
    console.warn("加载消息失败:", e);
  }
}

// 保存到本地存储
function saveMessages() {
  try {
    uni.setStorageSync("MESSAGE_CENTER_DATA", messages.value);
  } catch (e) {
    console.warn("保存消息失败:", e);
  }
}

// 添加一条消息（供其他页面调用）
function addMessage(msg) {
  messages.value.unshift({
    id: Date.now(),
    read: false,
    time: new Date().toISOString(),
    ...msg,
  });
  saveMessages();
}

// 初始化示例消息（首次使用时）
function initDemoMessages() {
  const stored = uni.getStorageSync("MESSAGE_CENTER_DATA");
  if (stored && stored.length > 0) return;

  const now = new Date();
  const demoMessages = [
    {
      id: 1,
      type: "approval",
      title: "初审通过",
      content: "客户张三的进件已通过初审，请尽快安排终审。",
      customerName: "张三",
      orderNo: "SO20260613001",
      creditOrderId: "SO20260613001",
      time: new Date(now - 1800000).toISOString(),
      read: false,
      link: "/pages/business/applyProgress?creditOrderId=SO20260613001",
    },
    {
      id: 2,
      type: "supplement",
      title: "待补件通知",
      content: "客户李四的进件需要补充收入证明和银行流水，请尽快处理。",
      customerName: "李四",
      orderNo: "SO20260612003",
      creditOrderId: "SO20260612003",
      time: new Date(now - 7200000).toISOString(),
      read: false,
      link: "/pages/business/supplementDetail?creditOrderId=SO20260612003",
    },
    {
      id: 3,
      type: "signing",
      title: "签约提醒",
      content: "客户王五的合同签署链接已发送，等待客户完成签约。",
      customerName: "王五",
      orderNo: "SO20260611002",
      creditOrderId: "SO20260611002",
      time: new Date(now - 14400000).toISOString(),
      read: true,
      link: "/pages/business/signCenter?creditOrderId=SO20260611002",
    },
    {
      id: 4,
      type: "loan",
      title: "放款完成",
      content: "客户赵六的贷款已放款成功，金额 ¥150,000，已生成还款计划。",
      customerName: "赵六",
      orderNo: "SO20260610005",
      creditOrderId: "SO20260610005",
      time: new Date(now - 86400000).toISOString(),
      read: true,
    },
    {
      id: 5,
      type: "system",
      title: "系统维护通知",
      content: "系统将于今晚 22:00-23:00 进行维护升级，届时部分功能可能暂时不可用。",
      time: new Date(now - 172800000).toISOString(),
      read: true,
    },
  ];

  messages.value = demoMessages;
  saveMessages();
}

onMounted(() => {
  initDemoMessages();
  loadMessages();
});
</script>

<style lang="scss" scoped>
.message-page {
  background: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.msg-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #fff;
  padding: 28rpx 16rpx;
  margin: 24rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;

  &.highlight {
    color: #ef4444;
  }
}

.stat-label {
  font-size: 24rpx;
  color: #8c8c8c;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  transition: all 0.2s;

  &.active {
    background: #3b82f6;
    color: #fff;
  }
}

.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background: #f0f0f0;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24rpx;
  margin-bottom: 16rpx;
}

.action-left {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.action-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.action-count {
  font-size: 22rpx;
  color: #8c8c8c;
}

.action-right {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.action-link {
  font-size: 24rpx;
  color: #3b82f6;
}

.msg-scroll {
  flex: 1;
  padding: 0 24rpx;
}

.msg-list {
  padding-bottom: 32rpx;
}

.msg-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
  animation: fadeInUp 0.3s ease forwards;
  opacity: 0;

  &--unread {
    border-left: 6rpx solid #3b82f6;
    background: #fafbff;
  }

  &:active {
    transform: scale(0.99);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.msg-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;

  &--approval {
    background: linear-gradient(135deg, #22c55e, #4ade80);
  }
  &--supplement {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
  }
  &--signing {
    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  }
  &--loan {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
  }
  &--repayment {
    background: linear-gradient(135deg, #06b6d4, #67e8f9);
  }
  &--system {
    background: linear-gradient(135deg, #6b7280, #9ca3af);
  }
  &--warning {
    background: linear-gradient(135deg, #ef4444, #f87171);
  }
}

.unread-dot {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #ef4444;
  border: 3rpx solid #fff;
}

.msg-body {
  flex: 1;
  min-width: 0;
}

.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.msg-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.msg-card--unread .msg-title {
  color: #111;
}

.msg-time {
  font-size: 22rpx;
  color: #b0b0b0;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.msg-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.msg-meta {
  display: flex;
  gap: 16rpx;
  margin-top: 12rpx;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 22rpx;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.msg-arrow {
  display: flex;
  align-items: center;
  padding-top: 8rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  gap: 16rpx;
}

.empty-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #999;
}

.empty-desc {
  font-size: 26rpx;
  color: #c0c4cc;
}
</style>
