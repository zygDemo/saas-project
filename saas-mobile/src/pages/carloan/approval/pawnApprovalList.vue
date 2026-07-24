<template>
  <app-page nav-title="典当审批池">
    <view class="approval-page">
      <view class="filter-box">
        <u-tabs
          :list="tabList"
          :current="currentTab"
          line-height="6rpx"
          :bar-style="{ background: 'var(--u-type-primary)' }"
          @click="onTabClick"
        />
      </view>

      <view class="approval-list">
        <view
          v-for="item in filteredList"
          :key="item.id"
          class="approval-card" role="button" tabindex="0" @click="goDetail(item)"
        >
          <view class="card-head">
            <view class="customer-main">
              <view class="avatar">{{ item.customerName.charAt(0) }}</view>
              <view>
                <text class="customer-name">{{ item.customerName }}</text>
                <text class="customer-phone">{{ item.phone }}</text>
              </view>
            </view>
            <u-tag
              :text="item.status === 'approved' ? '已放款' : '待审批'"
              :type="item.status === 'approved' ? 'success' : 'warning'"
              size="mini"
              plain
            />
          </view>

          <view class="info-grid">
            <view class="info-item">
              <text class="label">放款金额</text>
              <text class="value amount">￥{{ formatMoney(item.loanInfo.loanAmount) }}</text>
            </view>
            <view class="info-item">
              <text class="label">停车费</text>
              <text class="value">￥{{ formatMoney(item.loanInfo.parkingFee) }}</text>
            </view>
            <view class="info-item">
              <text class="label">月息</text>
              <text class="value">{{ item.loanInfo.monthlyRate }}%</text>
            </view>
            <view class="info-item">
              <text class="label">车辆</text>
              <text class="value">{{ item.plateNumber }}</text>
            </view>
          </view>

          <view class="card-foot">
            <text>{{ item.createTime }}</text>
            <u-icon name="arrow-right" size="28" color="#94a3b8" />
          </view>
        </view>
      </view>

      <u-empty v-if="filteredList.length === 0" mode="list" text="暂无审批任务" />
    </view>
  </app-page>
</template>

<script setup>
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import {
  formatMoney,
  getDefaultPawnApplications,
  getPawnApplications,
} from "@/common/pawnMock";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildDetailRouteQuery } from "@/common/carloan-route-query";

const currentTab = ref(0);
const applications = ref([]);
const tabList = [{ name: "全部" }, { name: "待审批" }, { name: "已放款" }];

const filteredList = computed(() => {
  if (currentTab.value === 1) {
    return applications.value.filter((item) => item.status === "pending");
  }
  if (currentTab.value === 2) {
    return applications.value.filter((item) => item.status === "approved");
  }
  return applications.value;
});

function loadList() {
  const localList = getPawnApplications();
  const localIds = new Set(localList.map((item) => item.id));
  applications.value = [
    ...localList,
    ...getDefaultPawnApplications().filter((item) => !localIds.has(item.id)),
  ];
}

function onTabClick(index) {
  currentTab.value = index;
}

function goDetail(item) {
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.approval.pawnApprovalDetail, buildDetailRouteQuery({ id: item.id })),
  });
}

onShow(loadList);
</script>

<style lang="scss" scoped>
.approval-page {
  min-height: 100%;
  padding: 24rpx;
  background: linear-gradient(180deg, #f2f4f8 0%, #f8f9fb 100%);
}

.filter-box {
  margin-bottom: 24rpx;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.approval-card {
  padding: 24rpx;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.card-head,
.customer-main,
.card-foot {
  display: flex;
  align-items: center;
}

.card-head,
.card-foot {
  justify-content: space-between;
}

.customer-main {
  gap: 16rpx;
}

.avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
  background: linear-gradient(135deg, var(--u-type-primary), #36cfc9);
}

.customer-name,
.customer-phone,
.label,
.value {
  display: block;
}

.customer-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.customer-phone {
  margin-top: 6rpx;
  font-size: 24rpx;
  color: #64748b;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin: 28rpx 0;
}

.info-item {
  min-width: 0;
}

.label {
  font-size: 23rpx;
  color: #94a3b8;
}

.value {
  margin-top: 8rpx;
  font-size: 27rpx;
  color: #1f2937;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.amount {
  color: #dc2626;
}

.card-foot {
  padding-top: 20rpx;
  border-top: 1rpx solid #f1f5f9;
  color: #94a3b8;
  font-size: 23rpx;
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
  .shadow { box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05); }
}
</style>