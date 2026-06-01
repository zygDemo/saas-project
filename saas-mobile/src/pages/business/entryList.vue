<template>
  <app-page nav-title="进件列表">
    <view class="entry-list-page">
      <!-- 搜索栏 -->
      <view class="search-header">
        <view class="search-box">
          <u-search
            v-model="searchKeyword"
            placeholder="输入客户姓名"
            shape="round"
            @search="handleSearch"
            @clear="handleClear"
          />
        </view>
      </view>

      <!-- 列表 -->
      <view class="entry-list">
        <view
          v-for="(item, index) in list"
          :key="index"
          class="entry-card"
          :style="{ animationDelay: `${index * 0.06}s` }"
          @click="goToDetail(item)"
        >
          <view class="entry-header">
            <view class="entry-name">
              <view class="avatar">
                {{ item.customerName?.charAt(0) || "?" }}
              </view>
              <view class="title-block">
                <text class="name">{{ item.customerName }}</text>
                <u-tag
                  :text="item.approvalText"
                  :type="item.approvalType"
                  size="mini"
                  plain
                />
              </view>
            </view>
            <text class="entry-time">{{ item.createTime }}</text>
          </view>

          <view class="entry-info">
            <view class="info-row">
              <view class="info-icon">
                <u-icon name="phone" size="24" color="#8c8c8c" />
              </view>
              <text class="label">手机号</text>
              <text
                class="value phone-value"
                @click.stop="callPhone(item.phone)"
              >
                {{ item.phone }}
              </text>
            </view>
            <view class="info-row">
              <view class="info-icon">
                <u-icon name="file-text" size="24" color="#8c8c8c" />
              </view>
              <text class="label">身份证</text>
              <text class="value">{{ item.idcard }}</text>
            </view>
          </view>

          <view class="entry-footer">
            <u-icon name="arrow-right" size="28rpx" color="#999" />
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <u-empty
        v-if="list.length === 0 && !loading"
        text="暂无进件记录"
        mode="list"
      />

      <!-- 加载状态 -->
      <u-loadmore v-if="loading" status="loading" />
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useBusinessApi } from "@/api/business";

const businessApi = useBusinessApi();

const searchKeyword = ref("");
const loading = ref(false);
interface EntryListItem {
  id: string | number;
  uuid: string;
  creditOrderId: string | number;
  customerName: string;
  phone: string;
  idcard: string;
  approvalText: string;
  approvalType: "success" | "warning" | "error" | "info";
  createTime: string;
}

interface UserListRow {
  id?: string | number;
  uuid?: string;
  creditOrderId?: string | number;
  personName?: string;
  telephone?: string;
  personIdcard?: string;
  approval?: number;
  createTime?: string;
  updateTime?: string;
}

interface UserListResponse {
  code?: number;
  rows?: UserListRow[];
}

const list = ref<EntryListItem[]>([]);

/** 加载进件列表 */
async function loadList(name?: string) {
  loading.value = true;
  try {
    const params: Record<string, unknown> = { dataSource: 1 };
    if (name && name.trim()) {
      params.personName = name.trim();
    }
    const res = (await businessApi.getUserList(params)) as UserListResponse;
    if (res && res.code === 200) {
      const rows = Array.isArray(res.rows) ? res.rows : [];
      list.value = rows.map((item: UserListRow) => ({
        id: item.uuid || item.id || "",
        uuid: item.uuid || "",
        creditOrderId: item.creditOrderId || "",
        customerName: item.personName || "",
        phone: item.telephone || "",
        idcard: maskIdcard(item.personIdcard || ""),
        approvalText: formatApproval(item.approval || 0),
        approvalType: getApprovalType(item.approval || 0),
        createTime: item.createTime || item.updateTime || "",
      }));
    } else {
      list.value = [];
    }
  } catch (e) {
    console.error("获取进件列表失败", e);
    list.value = [];
  } finally {
    loading.value = false;
  }
}

/** 审批状态格式化 */
function formatApproval(approval: number) {
  const map: Record<number, string> = {
    1: "待审批",
    2: "审批通过",
    3: "审批不通过",
    4: "其他",
  };
  return map[approval] || "待跟进";
}

function getApprovalType(approval: number): EntryListItem["approvalType"] {
  const map: Record<number, EntryListItem["approvalType"]> = {
    1: "warning",
    2: "success",
    3: "error",
    4: "info",
  };
  return map[approval] || "info";
}

/** 身份证脱敏（保留前3后4） */
function maskIdcard(idcard: string) {
  if (!idcard || idcard.length < 8) return idcard || "-";
  return `${idcard.slice(0, 3)}***********${idcard.slice(-4)}`;
}

/** 拨打手机号 */
function callPhone(phone: string) {
  if (!phone) return;
  uni.makePhoneCall({ phoneNumber: phone, fail: () => {} });
}

function handleSearch() {
  loadList(searchKeyword.value);
}

function handleClear() {
  loadList();
}

function goToDetail(item: Record<string, unknown>) {
  const params = [
    `uuid=${encodeURIComponent(String(item.uuid || item.id || ""))}`,
    `name=${encodeURIComponent(String(item.customerName || ""))}`,
    `phone=${encodeURIComponent(String(item.phone || ""))}`,
    `creditOrderId=${encodeURIComponent(String(item.creditOrderId || ""))}`,
  ].join("&");

  uni.navigateTo({
    url: `/pages/business/entryDetail?${params}`,
  });
}

onLoad(() => {
  loadList();
});
</script>

<style lang="scss" scoped>
.entry-list-page {
  padding: 24rpx 24rpx 160rpx;
  background: #f2f4f8;
  min-height: calc(100vh - 90rpx);
}

.search-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.search-box {
  flex: 1;
  background: #fff;
  border-radius: 24rpx;
  padding: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

// ===== 列表 =====
.entry-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.entry-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  animation: slideUp 0.4s ease-out both;
  transition: all 0.2s ease;

  &:active {
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

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.entry-name {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #5da7ff, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f1f1f;
}

.entry-time {
  font-size: 24rpx;
  color: #8c8c8c;
}

.entry-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding-left: 80rpx;
  margin-bottom: 12rpx;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.info-icon {
  display: flex;
  align-items: center;
}

.info-row .label {
  font-size: 24rpx;
  color: #8c8c8c;
}

.info-row .value {
  font-size: 24rpx;
  color: #262626;
  margin-left: 8rpx;
}

.phone-value {
  color: #2979ff !important;
}

.entry-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
