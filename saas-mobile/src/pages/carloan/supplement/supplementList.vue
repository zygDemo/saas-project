<template>
  <app-page nav-title="资料补充" no-body-scroll>
    <list-page
      :search-form="searchForm"
      :list="list"
      :loading="loading"
      :has-more="hasMore"
      :is-refreshing="isRefreshing"
      :scroll-top-value="scrollTopValue"
      :show-back-top="showBackTop"
      placeholder="输入客户姓名/手机号"
      empty-text="暂无待补充资料"
      @search="handleSearch"
      @refresh="onRefresh"
      @load-more="loadMore"
      @scroll="onScroll"
      @back-top="backToTop"
      @update:search-form="(v) => Object.assign(searchForm, v)"
    >
      <view v-for="(item, index) in list" :key="item.id || index">
        <list-card
          :item="item"
          :index="index"
          status-class="warning"
          avatar-class="warning"
          status-badge="待补充"
          @click="handleDetail(item)"
        >
          <template #body="{ item }">
            <view v-if="item.supplementType" class="info-row">
              <view class="info-icon">
                <u-icon name="file-text" size="22" color="#a0aec0" />
              </view>
              <text class="label">补充类型</text>
              <text class="value">{{ item.supplementType }}</text>
            </view>
            <view v-if="item.pushQuota" class="info-row">
              <view class="info-icon">
                <u-icon name="red-packet" size="22" color="#a0aec0" />
              </view>
              <text class="label">申请金额</text>
              <text class="value amount-value">￥{{ item.pushQuota }}</text>
            </view>
            <view v-if="item.supplementRemark" class="info-row">
              <view class="info-icon">
                <u-icon name="edit-pen" size="22" color="#a0aec0" />
              </view>
              <text class="label">补充说明</text>
              <text class="value remark-text">{{ item.supplementRemark }}</text>
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
              <text class="label">创建时间</text>
              <text class="value time-text">{{ item.createTime }}</text>
            </view>
          </template>
          <template #left>
            <u-tag
              text="待补充"
              type="warning"
              size="mini"
              plain
              class="status-tag"
            />
          </template>
          <text class="detail-text">去补充</text>
          <u-icon name="arrow-right" color="var(--u-type-primary)" size="24" />
        </list-card>
      </view>
    </list-page>
  </app-page>
</template>

<script setup lang="ts">
import { useListPage } from "@/composables/useListPage";
import { useCarloanApi, type CreditListItem } from "@/api/carloan";
import { useSessionStore } from "@/stores";
import { APP_ROUTES, buildRoute } from "@/common/navigation";
import { buildSupplementRouteQuery } from "@/common/carloan-route-query";
import ListCard from "@/components/list-card/ListCard.vue";
import ListPage from "@/components/list-page/ListPage.vue";

const sessionStore = useSessionStore();
const businessApi = useCarloanApi();

interface SupplementListItem extends CreditListItem {
  supplementType?: string;
  supplementRemark?: string;
  isSupplementCustomer?: string | number;
  isSupplementVehicle?: string | number;
  isSupplementOrder?: string | number;
  isSupplementFile?: string | number;
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
} = useListPage<SupplementListItem>({
  fetchFn: async (params: Record<string, unknown>) =>
    businessApi.getSupplementList({ ...params, supplementNode: 2 }),
  defaultParams: { supplementNode: 2 },
  getRows: (res: unknown) => (res as { data?: SupplementListItem[] }).data || [],
});

/** 跳转到补充详情页 */
function handleDetail(item: SupplementListItem) {
  const uuid = item.uuid || "";
  const creditOrderId = item.creditOrderId || "";
  const name = item.name || "";
  const phone = item.phone || "";
  const remark = item.supplementRemark || "";

  // 保存订单ID到sessionStore（使用授信订单号，避免后续取错）
  sessionStore.setOrderInfo({
    orderId: item.creditOrderId,
  });

  uni.navigateTo({
    url: buildRoute(
      APP_ROUTES.carloan.supplement.supplementDetail,
      buildSupplementRouteQuery({
        uuid,
        creditOrderId,
        id: item.id,
        name,
        phone,
        remark,
        isSupplementCustomer: item.isSupplementCustomer || "",
        isSupplementVehicle: item.isSupplementVehicle || "",
        isSupplementOrder: item.isSupplementOrder || "",
        isSupplementFile: item.isSupplementFile || "",
      }),
    ),
  });
}

// 初始加载
fetchList(true);
</script>

<style lang="scss" scoped>
// 业务特有样式
.info-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  line-height: 1.5;
  padding: 24rpx 0;
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
  width: 140rpx;
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

.value.remark-text {
  color: #b45309;
}

.amount-value {
  color: #cf1322;
  font-weight: 700;
  font-size: 28rpx;
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

.detail-text {
  font-size: 24rpx;
  color: var(--u-type-primary);
  font-weight: 600;
}
</style>
