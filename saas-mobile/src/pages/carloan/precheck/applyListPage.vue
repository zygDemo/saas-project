<template>
  <app-page nav-title="预审列表" no-body-scroll>
    <list-page
      :search-form="searchForm"
      :list="list"
      :loading="loading"
      :has-more="hasMore"
      :is-refreshing="isRefreshing"
      :scroll-top-value="scrollTopValue"
      :show-back-top="showBackTop"
      placeholder="输入客户姓名/手机号"
      @search="handleSearch"
      @refresh="onRefresh"
      @load-more="loadMore"
      @scroll="onScroll"
      @back-top="backToTop"
      @update:search-form="(v) => Object.assign(searchForm, v)"
    >
      <view
        v-for="(item, index) in list"
        :key="item.id || index"
      >
        <list-card
          :item="item"
          :index="index"
          :status-class="statusType(item.status)"
          :avatar-class="statusType(item.status)"
          :status-badge="statusText(item.status)"
          @click="handleDetail(item)"
        >
          <template #body="{ item }">
            <view v-if="item.pushQuota || item.pushQuota === '0'" class="quota-row">
              <view class="quota-icon">
                <u-icon name="rmb-circle" size="22" color="var(--u-type-primary)" />
              </view>
              <text class="label">授信额度</text>
              <text class="quota-value">{{ formatQuota(item.pushQuota) }}</text>
            </view>
            <view v-if="item.productName" class="info-row">
              <view class="info-icon">
                <u-icon name="grid" size="22" color="#a0aec0" />
              </view>
              <text class="label">产品</text>
              <text class="value product-name">{{ item.productName }}</text>
            </view>
            <view v-if="item.periods" class="info-row">
              <view class="info-icon">
                <u-icon name="calendar" size="22" color="#a0aec0" />
              </view>
              <text class="label">期数</text>
              <text class="value">{{ item.periods }}期</text>
            </view>
            <view v-if="item.creditOrderId" class="info-row">
              <view class="info-icon">
                <u-icon name="order" size="22" color="#a0aec0" />
              </view>
              <text class="label">订单号</text>
              <text class="value order-no">{{ item.creditOrderId }}</text>
            </view>
            <view v-if="item.createTime" class="info-row">
              <view class="info-icon">
                <u-icon name="clock" size="22" color="#a0aec0" />
              </view>
              <text class="label">申请时间</text>
              <text class="value time-text">{{ item.createTime }}</text>
            </view>
          </template>
          <template #left="{ item }">
            <u-tag
              :text="statusText(item.status)"
              :type="statusType(item.status)"
              size="mini"
              plain
              class="status-tag"
            />
          </template>
          <template #actions="{ item }">
            <view
              v-if="item.status === 4"
              class="credit-btn"
              @click.stop="handleGoCredit(item)"
            >
              <u-icon name="edit-pen" size="28" color="#fff" />
              <text class="credit-btn-text">去授信</text>
            </view>
          </template>
          <text class="detail-text">查看详情</text>
          <u-icon name="arrow-right" color="var(--u-type-primary)" size="24" />
        </list-card>
      </view>
    </list-page>
  </app-page>
</template>

<script setup lang="ts">
import { useListPage } from "@/composables/useListPage";
import { useCarloanApi, type CreditListItem } from "@/api/carloan";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildSignRouteQuery, buildDetailRouteQuery } from "@/common/carloan-route-query";
import ListCard from "@/components/list-card/ListCard.vue";
import ListPage from "@/components/list-page/ListPage.vue";

const businessApi = useCarloanApi();

// 授信状态映射
type StatusTagType = "success" | "error" | "info" | "warning";

const statusMap: Record<number, { text: string; type: StatusTagType }> = {
  1: { text: "成功", type: "success" },
  2: { text: "失败", type: "error" },
  3: { text: "重新推送", type: "info" },
  4: { text: "待授信", type: "warning" },
};

function statusText(val: unknown) {
  const key = Number(val);
  return (statusMap[key] || {}).text || (val ? `状态${val}` : "未知");
}

function statusType(val: unknown) {
  const key = Number(val);
  return (statusMap[key] || {}).type || "info";
}

// 格式化额度（字符串类型，单位元）
function formatQuota(val: unknown) {
  if (!val && val !== "0") return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return num >= 10000 ? `${(num / 10000).toFixed(2)}万` : `${num.toFixed(2)}元`;
}

// 列表逻辑
const {
  searchForm,
  list,
  loading,
  hasMore,
  isRefreshing,
  scrollTopValue,
  showBackTop,
  fetchList,
  handleSearch,
  onRefresh,
  loadMore,
  onScroll,
  backToTop,
} = useListPage<CreditListItem>({
  fetchFn: async (params: Record<string, unknown>) => businessApi.getCreditList({ ...params, status: 4 }),
  defaultParams: { status: 4 },
});

// 跳转详情
function handleDetail(item: CreditListItem) {
  uni.navigateTo({
    url: buildRoute(
      APP_ROUTES.carloan.precheck.applyDetail,
      buildDetailRouteQuery({ id: item.id || item.creditOrderId || item.uuid }),
    ),
  });
}

// 去授信 — 跳转人脸识别授信页面
function handleGoCredit(item: CreditListItem) {
  const signRouteQuery = buildSignRouteQuery({
    uuid: item.uuid || "",
    name: item.name || "",
    phone: item.phone || "",
    amount: item.pushQuota || "",
    creditOrderId: item.creditOrderId || "",
  });
  uni.navigateTo({
    url: buildRoute(APP_ROUTES.carloan.signing.videoFaceSign, signRouteQuery),
  });
}

// 初始加载
fetchList(true);
</script>

<style lang="scss" scoped>
// 业务特有样式
.quota-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  line-height: 1.5;
  padding: 4rpx 0;

  .quota-icon {
    width: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 10rpx;
  }

  .quota-value {
    flex: 1;
    font-size: 30rpx;
    font-weight: 800;
    color: var(--u-type-primary);
    font-family: "DIN Alternate", "Helvetica Neue", sans-serif;
    letter-spacing: -0.5rpx;
  }
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  line-height: 1.5;
  padding: 4rpx 0;
}

.info-icon {
  width: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 10rpx;
}

.label {
  color: #94a3b8;
  width: 120rpx;
  flex-shrink: 0;
  font-size: 25rpx;
  font-weight: 500;
}

.value {
  color: #334155;
  flex: 1;
  font-weight: 500;
  font-size: 26rpx;
}

.value.product-name {
  color: #1e293b;
  font-weight: 600;
}

.value.order-no {
  font-size: 22rpx;
  color: #94a3b8;
  font-family: "SF Mono", "Helvetica Neue", sans-serif;
  letter-spacing: 0.5rpx;
}

.time-text {
  color: #94a3b8;
  font-size: 24rpx;
  font-weight: 500;
}

.credit-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 20rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
  box-shadow: 0 4rpx 12rpx rgba(245, 158, 11, 0.35);
  transition: all 0.2s ease;

  .credit-btn-text {
    font-size: 24rpx;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.5rpx;
  }

  &:active {
    transform: scale(0.95);
    box-shadow: 0 2rpx 8rpx rgba(245, 158, 11, 0.3);
  }
}

.detail-text {
  font-size: 24rpx;
  color: var(--u-type-primary);
  font-weight: 600;
}
</style>
