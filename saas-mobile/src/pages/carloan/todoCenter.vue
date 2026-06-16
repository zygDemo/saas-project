<template>
  <app-page nav-title="待办中心">
    <view class="todo-page">
      <!-- 待办统计 -->
      <view class="todo-stats">
        <view
          v-for="item in statsItems"
          :key="item.key"
          class="stat-card"
          :class="`stat-card--${item.color}`"
          @click="goTo(item.path)"
        >
          <view class="stat-icon">
            <u-icon :name="item.icon" size="48" color="#fff" />
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ item.count }}</text>
            <text class="stat-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 待办列表分类 -->
      <view class="todo-sections">
        <!-- 待补件 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title-row">
              <u-icon name="folder-upload" size="36" color="#f59e0b" />
              <text class="section-title">待补件</text>
            </view>
            <view class="section-count">{{ supplementList.length }}</view>
          </view>
          <view v-if="supplementList.length > 0" class="section-list">
            <view
              v-for="item in supplementList"
              :key="item.id"
              class="todo-item"
              @click="goToSupplement(item)"
            >
              <view class="todo-item__left">
                <view class="todo-avatar">{{ (item.name || '?').charAt(0) }}</view>
                <view class="todo-info">
                  <text class="todo-name">{{ item.name || '未知客户' }}</text>
                  <text class="todo-desc">{{ item.supplementType || '补充资料' }}</text>
                </view>
              </view>
              <view class="todo-item__right">
                <u-tag text="待补件" type="warning" size="mini" plain />
                <u-icon name="arrow-right" size="28" color="#c0c4cc" />
              </view>
            </view>
          </view>
          <view v-else class="section-empty">
            <u-icon name="checkbox-circle" size="48" color="#22c55e" />
            <text class="empty-text">暂无待补件</text>
          </view>
        </view>

        <!-- 待签约 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title-row">
              <u-icon name="edit" size="36" color="#22c55e" />
              <text class="section-title">待签约</text>
            </view>
            <view class="section-count">{{ signingList.length }}</view>
          </view>
          <view v-if="signingList.length > 0" class="section-list">
            <view
              v-for="item in signingList"
              :key="item.id"
              class="todo-item"
              @click="goToSigning(item)"
            >
              <view class="todo-item__left">
                <view class="todo-avatar todo-avatar--green">{{ (item.customerName || '?').charAt(0) }}</view>
                <view class="todo-info">
                  <text class="todo-name">{{ item.customerName || '未知客户' }}</text>
                  <text class="todo-desc">签约金额：{{ formatAmount(item.amount) }}</text>
                </view>
              </view>
              <view class="todo-item__right">
                <u-tag text="待签约" type="success" size="mini" plain />
                <u-icon name="arrow-right" size="28" color="#c0c4cc" />
              </view>
            </view>
          </view>
          <view v-else class="section-empty">
            <u-icon name="checkbox-circle" size="48" color="#22c55e" />
            <text class="empty-text">暂无待签约</text>
          </view>
        </view>

        <!-- 待审批 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title-row">
              <u-icon name="time" size="36" color="#409EFF" />
              <text class="section-title">待审批</text>
            </view>
            <view class="section-count">{{ approvalList.length }}</view>
          </view>
          <view v-if="approvalList.length > 0" class="section-list">
            <view
              v-for="item in approvalList"
              :key="item.id"
              class="todo-item"
              @click="goToApproval(item)"
            >
              <view class="todo-item__left">
                <view class="todo-avatar todo-avatar--blue">{{ (item.customerName || '?').charAt(0) }}</view>
                <view class="todo-info">
                  <text class="todo-name">{{ item.customerName || '未知客户' }}</text>
                  <text class="todo-desc">{{ item.productName || '-' }} · {{ item.nodeStatusName || '待审批' }}</text>
                </view>
              </view>
              <view class="todo-item__right">
                <u-tag text="待审批" type="primary" size="mini" plain />
                <u-icon name="arrow-right" size="28" color="#c0c4cc" />
              </view>
            </view>
          </view>
          <view v-else class="section-empty">
            <u-icon name="checkbox-circle" size="48" color="#22c55e" />
            <text class="empty-text">暂无待审批</text>
          </view>
        </view>

        <!-- 近期订单 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title-row">
              <u-icon name="order" size="36" color="#8b5cf6" />
              <text class="section-title">近期订单</text>
            </view>
            <view class="section-count">{{ orderList.length }}</view>
          </view>
          <view v-if="orderList.length > 0" class="section-list">
            <view
              v-for="item in orderList.slice(0, 5)"
              :key="item.id"
              class="todo-item"
              @click="goToOrder(item)"
            >
              <view class="todo-item__left">
                <view class="todo-avatar todo-avatar--purple">{{ (item.customerName || '?').charAt(0) }}</view>
                <view class="todo-info">
                  <text class="todo-name">{{ item.customerName || '未知客户' }}</text>
                  <text class="todo-desc">{{ item.currentNodeName || '-' }} · {{ item.currentStatusName || '-' }}</text>
                </view>
              </view>
              <view class="todo-item__right">
                <u-tag :text="item.currentNodeName || '进行中'" type="info" size="mini" plain />
                <u-icon name="arrow-right" size="28" color="#c0c4cc" />
              </view>
            </view>
          </view>
          <view v-else class="section-empty">
            <u-icon name="list" size="48" color="#c0c4cc" />
            <text class="empty-text">暂无订单</text>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <u-loadmore v-if="loading" status="loading" />
    </view>
  </app-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useBusinessApi } from "@/api/business";
import { useLocalStore } from "@/stores/local";

const businessApi = useBusinessApi();
const localStore = useLocalStore();

const loading = ref(false);
const supplementList = ref([]);
const signingList = ref([]);
const approvalList = ref([]);
const orderList = ref([]);
const overview = ref({
  pendingSupplement: 0,
  pendingSigning: 0,
  pendingApproval: 0,
  todayLeads: 0,
  todayApplications: 0,
  monthLoanAmount: 0,
});

const statsItems = computed(() => [
  {
    key: "supplement",
    label: "待补件",
    count: overview.value.pendingSupplement || supplementList.value.length,
    icon: "folder-upload",
    color: "amber",
    path: "/pages/carloan/supplementList",
  },
  {
    key: "signing",
    label: "待签约",
    count: overview.value.pendingSigning || signingList.value.length,
    icon: "edit",
    color: "green",
    path: "/pages/carloan/faceSignList",
  },
  {
    key: "approval",
    label: "待审批",
    count: overview.value.pendingApproval || approvalList.value.length,
    icon: "time",
    color: "blue",
    path: "/pages/carloan/approvalList",
  },
  {
    key: "orders",
    label: "进行中订单",
    count: orderList.value.length,
    icon: "order",
    color: "purple",
    path: "/pages/carloan/orderList",
  },
]);

function formatAmount(val) {
  const num = Number(val);
  if (!num && num !== 0) return "—";
  return "￥" + num.toLocaleString("zh-CN", { minimumFractionDigits: 0 });
}

async function loadAll() {
  if (!localStore.token) return;
  loading.value = true;
  try {
    await Promise.all([loadOverview(), loadSupplements(), loadOrders()]);
  } finally {
    loading.value = false;
  }
}

async function loadOverview() {
  try {
    const res = await businessApi.getStatisticsOverview();
    const data = res?.data || res || {};
    overview.value = {
      pendingSupplement: data.pendingSupplement || data.supplementCount || 0,
      pendingSigning: data.pendingSigning || data.signingCount || 0,
      pendingApproval: data.pendingApproval || data.approvalCount || 0,
      todayLeads: data.todayLeads || 0,
      todayApplications: data.todayApplications || 0,
      monthLoanAmount: data.monthLoanAmount || 0,
    };
  } catch (e) {
    console.warn("获取统计数据失败", e);
  }
}

async function loadSupplements() {
  try {
    const res = await businessApi.getSupplementList({ current: 1, size: 20 });
    const data = res?.data || res || {};
    supplementList.value = data.rows || data.records || [];
  } catch (e) {
    console.warn("获取补件列表失败", e);
  }
}

async function loadOrders() {
  try {
    const res = await businessApi.getOrderList({ current: 1, size: 20 });
    const data = res?.data || res || {};
    const all = data.rows || data.records || [];
    orderList.value = all.filter(
      (o) => o.status !== "DISBURSED" && o.status !== "CANCELLED"
    );

    // 从订单中提取待签约和待审批的
    signingList.value = all.filter(
      (o) =>
        o.currentNode === 4100 ||
        o.phaseCode === 4000 ||
        (o.currentStatusName && o.currentStatusName.includes("签约"))
    );
    approvalList.value = all.filter(
      (o) =>
        [2100, 2200].includes(Number(o.currentNode)) ||
        o.phaseCode === 2000 ||
        (o.currentStatusName &&
          (o.currentStatusName.includes("审批") ||
            o.currentStatusName.includes("审核")))
    );
  } catch (e) {
    console.warn("获取订单列表失败", e);
  }
}

function goTo(path) {
  uni.navigateTo({ url: path });
}

function goToSupplement(item) {
  uni.navigateTo({
    url: `/pages/carloan/supplementDetail?id=${item.id}&creditOrderId=${item.creditOrderId || ""}`,
  });
}

function goToSigning(item) {
  uni.navigateTo({
    url: `/pages/carloan/signCenter?creditOrderId=${item.creditOrderId || item.orderNo || ""}&uuid=${item.uuid || ""}&customerName=${item.customerName || ""}`,
  });
}

function goToApproval(item) {
  uni.navigateTo({
    url: `/pages/carloan/applyDetail?id=${item.id || item.applicationId}`,
  });
}

function goToOrder(item) {
  uni.navigateTo({
    url: `/pages/carloan/applyDetail?id=${item.id || item.applicationId}`,
  });
}

onMounted(loadAll);
</script>

<style lang="scss" scoped>
.todo-page {
  padding: 24rpx;
  background: #f5f7fa;
  min-height: 100vh;
}

.todo-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx 24rpx;
  border-radius: 16rpx;
  background: #fff;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  &--amber .stat-icon {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
  }
  &--green .stat-icon {
    background: linear-gradient(135deg, #22c55e, #4ade80);
  }
  &--blue .stat-icon {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
  }
  &--purple .stat-icon {
    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  }
}

.stat-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.stat-label {
  font-size: 24rpx;
  color: #8c8c8c;
  margin-top: 4rpx;
}

.section-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.section-count {
  background: #f0f0f0;
  color: #666;
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-weight: 600;
}

.section-list {
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 28rpx;
  border-bottom: 1rpx solid #f8f8f8;

  &:active {
    background: #f8f9fa;
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex: 1;
    min-width: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 12rpx;
    flex-shrink: 0;
  }
}

.todo-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  flex-shrink: 0;

  &--green {
    background: linear-gradient(135deg, #22c55e, #4ade80);
  }
  &--blue {
    background: linear-gradient(135deg, #3b82f6, #60a5fa);
  }
  &--purple {
    background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  }
}

.todo-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.todo-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-desc {
  font-size: 24rpx;
  color: #8c8c8c;
  margin-top: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.section-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 0;
  gap: 12rpx;
}

.empty-text {
  font-size: 26rpx;
  color: #c0c4cc;
}
</style>
