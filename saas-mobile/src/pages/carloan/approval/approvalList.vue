<template>
  <app-page nav-title="审批列表">
    <view class="approval-list-page">
      <!-- 筛选栏 -->
      <view class="filter-box">
        <u-tabs
          :list="tabList"
          :current="currentTab"
          @click="onTabClick"
          line-height="6rpx"
          :bar-style="{ background: 'var(--u-type-primary)' }"
        />
      </view>

      <!-- 审批列表 -->
      <view class="approval-list">
        <view
          v-for="(item, index) in list"
          :key="item.creditOrderId || index"
          class="approval-card"
          :class="`status-${getStageType(item)}`"
          :style="{ animationDelay: `${index * 0.06}s` }"
          @click="goToDetail(item)"
        >
          <view class="approval-header">
            <view class="approval-name">
              <view class="avatar" :class="`avatar--${getStageType(item)}`">
                {{ item.name?.charAt(0) || '?' }}
              </view>
              <view class="title-block">
                <text class="name">{{ item.name || '未知客户' }}</text>
                <u-tag
                  :text="getStageLabel(item)"
                  :type="getStageType(item)"
                  size="mini"
                  plain
                />
              </view>
            </view>
            <text class="approval-time">{{ item.createTime }}</text>
          </view>

          <view class="approval-info">
            <view class="info-row">
              <view class="info-icon"><u-icon name="coupon" size="24" color="#8c8c8c" /></view>
              <text class="label">申请金额</text>
              <text class="value amount-value">￥{{ item.pushQuota || '-' }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon"><u-icon name="grid" size="24" color="#8c8c8c" /></view>
              <text class="label">申请产品</text>
              <text class="value">{{ item.productName || '-' }}</text>
            </view>
            <view class="info-row">
              <view class="info-icon"><u-icon name="clock" size="24" color="#8c8c8c" /></view>
              <text class="label">订单编号</text>
              <text class="value">{{ item.creditOrderId || '-' }}</text>
            </view>
          </view>

          <view class="approval-footer">
            <text class="sales">客户电话：{{ item.phone || '-' }}</text>
            <u-button
              type="primary"
              size="mini"
              shape="circle"
              plain
              @click.stop="handleAudit(item)"
            >
              审批
            </u-button>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <u-empty
        v-if="list.length === 0 && !loading"
        text="暂无审批件"
        mode="list"
      />

      <!-- 加载状态 -->
      <u-loadmore v-if="loading" :status="loading ? 'loading' : 'loadmore'" />
    </view>
  </app-page>
</template>

<script setup>
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useCarloanApi } from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildDetailRouteQuery } from "@/common/carloan-route-query";

const carloanApi = useCarloanApi();
const currentTab = ref(0);
const loading = ref(false);
const list = ref([]);

const tabList = [{ name: "待初审" }, { name: "待终审" }, { name: "已审批" }];

/** Tab 对应的 API 查询参数 */
const tabParams = [
  { businessNode: "INITIAL_AUDIT" },
  { businessNode: "PRE_AUDIT" },
  { status: 1 },
];

async function loadList() {
  if (loading.value) return;
  loading.value = true;
  try {
    const params = { pageNum: 1, pageSize: 50, ...tabParams[currentTab.value] };
    const res = await carloanApi.getCreditList(params);
    const rows = res?.data?.rows || res?.rows || res?.data || [];
    list.value = Array.isArray(rows) ? rows : [];
  } catch (e) {
    console.error("获取审批列表失败", e);
    list.value = [];
  } finally {
    loading.value = false;
  }
}

function getStageType(item) {
  if (item.status === 1) return "success";
  if (item.status === 2) return "error";
  if (item.businessNode === "PRE_AUDIT") return "primary";
  return "warning";
}

function getStageLabel(item) {
  if (item.status === 1) return "已通过";
  if (item.status === 2) return "已拒绝";
  if (item.businessNode === "PRE_AUDIT") return "待终审";
  if (item.businessNode === "INITIAL_AUDIT") return "待初审";
  if (item.businessNode === "SUPPLEMENT_MATERIALS") return "补件中";
  return "处理中";
}

function onTabClick(index) {
  currentTab.value = index;
  list.value = [];
  loadList();
}

function goToDetail(item) {
  uni.navigateTo({
    url: buildRoute(
      APP_ROUTES.carloan.precheck.applyDetail,
      buildDetailRouteQuery({ id: item.id, uuid: item.uuid, creditOrderId: item.creditOrderId })
    ),
  });
}

function handleAudit(item) {
  uni.navigateTo({
    url: buildRoute(
      APP_ROUTES.carloan.precheck.applyDetail,
      buildDetailRouteQuery({ id: item.id, uuid: item.uuid, creditOrderId: item.creditOrderId })
    ),
  });
}

onShow(loadList);
</script>

<style lang="scss" scoped>
.approval-list-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
}

.filter-box {
  margin-bottom: 24rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 8rpx 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.approval-card {
  position: relative;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 24rpx;
    bottom: 24rpx;
    width: 6rpx;
    border-radius: 0 6rpx 6rpx 0;
    background: #d9d9d9;
    transition: background 0.3s ease;
  }

  &.status-warning::before {
    background: linear-gradient(180deg, #faad14, #ffc53d);
  }
  &.status-primary::before {
    background: linear-gradient(180deg, #4096ff, #69b1ff);
  }
  &.status-success::before {
    background: linear-gradient(180deg, #52c41a, #73d13d);
  }
  &.status-error::before {
    background: linear-gradient(180deg, #ff4d4f, #ff7875);
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
  }
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.approval-name {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);

  &--warning { background: linear-gradient(135deg, #faad14, #ffc53d); }
  &--primary { background: linear-gradient(135deg, #4096ff, #69b1ff); }
  &--success { background: linear-gradient(135deg, #52c41a, #73d13d); }
  &--error { background: linear-gradient(135deg, #ff4d4f, #ff7875); }
  &--info { background: linear-gradient(135deg, #8c8c8c, #bfbfbf); }
}

.title-block {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
  min-width: 0;
}

.name {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: 0.5rpx;
}

.approval-time {
  font-size: 22rpx;
  color: #bfbfbf;
  flex-shrink: 0;
}

.approval-info {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  line-height: 1.6;
}

.info-icon {
  width: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 4rpx;
}

.label {
  color: #8c8c8c;
  width: 140rpx;
  flex-shrink: 0;
  font-size: 26rpx;
}

.value {
  flex: 1;
  color: #262626;
  font-weight: 500;
  font-size: 26rpx;
}

.amount-value {
  color: #cf1322;
  font-weight: 700;
  font-size: 28rpx;
}

.approval-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.sales {
  font-size: 24rpx;
  color: #8c8c8c;
  font-weight: 500;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.approval-card {
  animation: slideUp 0.4s ease-out both;
}
</style>
