<template>
  <app-page nav-title="线索查询">
    <view class="lead-list-page">
      <!-- 搜索栏 -->
      <view class="lead-toolbar">
        <view class="search-header">
          <u-search
            v-model="searchKeyword"
            class="search-input"
            placeholder="输入客户姓名/手机号"
            shape="round"
            @search="handleSearch"
            @custom="handleSearch"
            @clear="handleClearSearch"
          />
        </view>
      </view>

      <scroll-view
        class="lead-scroll"
        scroll-y
        :refresher-enabled="false"
        :show-scrollbar="false"
        :enhanced="true"
        :bounces="false"
      >
        <!-- 线索列表 -->
        <view class="lead-list">
          <view
            v-for="item in leadList"
            :key="item.uuid"
            class="lead-card"
            :class="`status-${getTagType(item.status)}`"
            @click="goToDetail(item)"
          >
            <view class="lead-header">
              <view class="lead-name">
                <view
                  class="avatar"
                  :class="`avatar--${getTagType(item.status)}`"
                >
                  {{ item.customerName?.charAt(0) || "?" }}
                </view>
                <view class="title-block">
                  <view class="title-row">
                    <text class="name">{{
                      item.customerName || "未命名客户"
                    }}</text>
                    <u-tag
                      :text="item.status"
                      :type="getTagType(item.status)"
                      size="mini"
                      plain
                    />
                  </view>
                  <text class="lead-time">
                    {{ item.createTime || "暂无更新时间" }}
                  </text>
                </view>
              </view>
            </view>

            <view class="lead-info">
              <view class="info-row">
                <view class="info-icon">
                  <u-icon name="phone" size="24" color="#8c8c8c" />
                </view>
                <text class="label">手机号</text>
                <text
                  class="value phone-value"
                  @click.stop="callPhone(item.phone)"
                >
                  {{ item.phone || "-" }}
                </text>
              </view>
              <view class="info-row">
                <view class="info-icon">
                  <u-icon name="home" size="24" color="#8c8c8c" />
                </view>
                <text class="label">来源渠道</text>
                <text class="value">{{ item.source || "线索" }}</text>
              </view>
            </view>

            <view class="lead-footer">
              <view class="footer-hint">
                <u-icon name="clock" size="22" color="#a6adb8" />
                <text>点击卡片查看详情</text>
              </view>
              <view class="footer-actions">
                <u-button
                  size="mini"
                  type="primary"
                  text="跟进"
                  @click.stop="openFollowUp(item)"
                />
                <u-button
                  size="mini"
                  type="warning"
                  text="记录"
                  @click.stop="openRecords(item)"
                />
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <u-empty
          v-if="leadList.length === 0 && !loading"
          text="暂无线索"
          mode="list"
        />

        <!-- 加载状态 -->
        <u-loadmore v-if="loading" :status="loading ? 'loading' : 'loadmore'" />
      </scroll-view>

      <!-- 跟进弹窗 -->
      <u-popup
        v-model="showFollowUp"
        mode="center"
        :border-radius="32"
        :closeable="true"
      >
        <view class="follow-up-popup">
          <view class="follow-up-title">线索跟进</view>

          <view class="follow-up-customer">
            <text class="follow-up-customer-name">{{
              currentLead?.customerName
            }}</text>
            <text class="follow-up-customer-phone">{{
              currentLead?.phone
            }}</text>
          </view>

          <u-form :model="followUpForm" label-width="160rpx">
            <u-form-item label="联系状态" required>
              <u-input
                v-model="contactStatusLabel"
                type="select"
                placeholder="请选择联系状态"
                @click="showContactStatusPicker = true"
              />
            </u-form-item>

            <u-form-item label="是否有效">
              <u-input
                v-model="statusLabel"
                type="select"
                placeholder="请选择"
                @click="showStatusPicker = true"
              />
            </u-form-item>

            <u-form-item label="备注说明">
              <u-input
                v-model="followUpForm.remarks"
                type="textarea"
                placeholder="请输入跟进备注"
                :border="false"
              />
            </u-form-item>
          </u-form>

          <view class="follow-up-btns">
            <u-button
              :loading="followUpLoading"
              type="primary"
              shape="circle"
              @click="handleFollowUpSubmit"
            >
              确认跟进
            </u-button>
          </view>
        </view>
      </u-popup>

      <!-- 联系状态选择器 -->
      <u-select
        v-model="showContactStatusPicker"
        mode="single-column"
        :list="contactStatusOptions"
        @confirm="onContactStatusConfirm"
      />

      <!-- 是否有效选择器 -->
      <u-select
        v-model="showStatusPicker"
        mode="single-column"
        :list="statusOptions"
        @confirm="onStatusConfirm"
      />

      <!-- 跟进记录弹窗 -->
      <u-popup
        v-model="showRecords"
        mode="center"
        :border-radius="32"
        :closeable="true"
      >
        <view class="records-popup">
          <view class="records-title">跟进记录</view>
          <view class="records-customer">
            <text class="records-customer-name">{{
              currentLead?.customerName
            }}</text>
            <text class="records-customer-phone">{{ currentLead?.phone }}</text>
          </view>

          <scroll-view class="records-list" scroll-y>
            <view v-if="recordsLoading" class="records-loading">
              <u-loading mode="flower" />
              <text>加载中...</text>
            </view>
            <u-empty
              v-else-if="followUpRecords.length === 0"
              text="暂无跟进记录"
              mode="list"
            />
            <view
              v-for="record in followUpRecords"
              :key="record.id"
              class="record-item"
            >
              <view class="record-header">
                <view class="record-status">
                  <u-tag
                    :text="getContactLabel(record.contactStatus)"
                    :type="getContactTagType(record.contactStatus)"
                    size="mini"
                  />
                  <u-tag
                    :text="record.status === 1 ? '有效' : '无效'"
                    :type="record.status === 1 ? 'success' : 'error'"
                    size="mini"
                    plain
                  />
                </view>
                <text class="record-time">{{
                  record.createTime || record.updateTime
                }}</text>
              </view>
              <view v-if="record.remarks" class="record-remark">
                <text>备注：{{ record.remarks }}</text>
              </view>
              <view v-if="record.salesmanName" class="record-salesman">
                <text>跟进人：{{ record.salesmanName }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </u-popup>
    </view>
  </app-page>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { $u } from "uview-pro";
import { useCarloanApi } from "@/api/carloan";
import { useLocalStore } from "@/stores";

const businessApi = useCarloanApi();
const localStore = useLocalStore();

interface LeadItem {
  uuid: string;
  id?: number;
  customerName: string;
  phone: string;
  status: string;
  source: string;
  createTime: string;
}

const searchKeyword = ref("");
const loading = ref(false);
const leadList = ref<LeadItem[]>([]);

// ========== 状态常量映射 ==========

const ApprovalStatus = {
  PENDING: { value: 0, label: "待跟进", tagType: "warning" },
  FOLLOWED: { value: 1, label: "已跟进", tagType: "success" },
  OTHER: { value: 3, label: "其他", tagType: "primary" },
} as const;

const getApprovalLabel = (approval: number) => {
  return (
    Object.values(ApprovalStatus).find((s) => s.value === approval)?.label ||
    "待跟进"
  );
};

const getTagType = (status: string) => {
  return (
    Object.values(ApprovalStatus).find((s) => s.label === status)?.tagType ||
    "info"
  );
};

// ========== 数据加载 ==========

/** 获取线索列表原始数据 */
const fetchLeadList = async (name?: string) => {
  const params: Record<string, unknown> = { dataSource: 2 };
  if (name?.trim()) {
    params.personName = name.trim();
  }
  return await businessApi.getUserList(params);
};

/** 将接口返回数据映射为列表展示格式 */
const mapLeadData = (rawList: Record<string, unknown>[]): LeadItem[] => {
  return rawList.map((item) => ({
    uuid: (item.uuid as string) || "",
    id: item.id as number | undefined,
    customerName: (item.personName as string) || "",
    phone: (item.telephone as string) || "",
    status: getApprovalLabel(item.approval as number),
    source: item.dataSource === 2 ? "线索" : "",
    createTime: (item.updateTime as string) || "",
  }));
};

/** 加载并渲染列表 */
const initData = async (name?: string) => {
  loading.value = true;
  try {
    const res = (await fetchLeadList(name)) as {
      code?: number;
      rows?: Record<string, unknown>[];
    };
    if (res?.code === 200) {
      const list = Array.isArray(res.rows) ? res.rows : [];
      leadList.value = mapLeadData(list);
    } else {
      leadList.value = [];
    }
  } catch (e) {
    console.error("获取线索列表失败", e);
    leadList.value = [];
  } finally {
    loading.value = false;
  }
};

// ========== 事件处理 ==========

const handleSearch = (value?: string) => {
  if (typeof value === "string") {
    searchKeyword.value = value;
  }
  initData(searchKeyword.value);
};

const handleClearSearch = () => {
  searchKeyword.value = "";
  initData();
};

const goToDetail = (item: LeadItem) => {
  uni.navigateTo({
    url: `/pages/carloan/idInfo?uuid=${encodeURIComponent(item.uuid)}`,
  });
};

const callPhone = (phone: string) => {
  if (!phone) return;
  uni.makePhoneCall({
    phoneNumber: phone,
    fail: () => {},
  });
};

// ========== 跟进功能 ==========
const showFollowUp = ref(false);
const currentLead = ref<LeadItem | null>(null);
const followUpLoading = ref(false);
const followUpForm = reactive<{
  id?: number;
  contactStatus: number;
  status: number;
  remarks: string;
}>({
  contactStatus: 0,
  status: 1,
  remarks: "",
});

const contactStatusOptions = [
  { label: "停机", value: 1 },
  { label: "无法联系", value: 2 },
  { label: "暂时失联", value: 3 },
  { label: "不接电话", value: 4 },
  { label: "正常联系", value: 5 },
  { label: "彻底失联", value: 6 },
];

const statusOptions = [
  { label: "有效", value: 1 },
  { label: "无效", value: 2 },
];

const showContactStatusPicker = ref(false);
const showStatusPicker = ref(false);
const contactStatusLabel = ref("");
const statusLabel = ref("");

const onContactStatusConfirm = (e: { value: number; label: string }[]) => {
  const opt = e[0];
  followUpForm.contactStatus = opt.value;
  contactStatusLabel.value = opt.label;
  showContactStatusPicker.value = false;
};

const onStatusConfirm = (e: { value: number; label: string }[]) => {
  const opt = e[0];
  followUpForm.status = opt.value;
  statusLabel.value = opt.label;
  showStatusPicker.value = false;
};

const openFollowUp = (item: LeadItem) => {
  currentLead.value = item;
  followUpForm.contactStatus = 0;
  followUpForm.status = 1;
  followUpForm.remarks = "";
  followUpForm.id = item.id;
  contactStatusLabel.value = "";
  statusLabel.value = "";
  showFollowUp.value = true;
};

const handleFollowUpSubmit = async () => {
  if (!followUpForm.contactStatus) {
    $u.toast("请选择联系状态", "error");
    return;
  }
  if (!currentLead.value?.uuid) {
    $u.toast("线索数据异常", "error");
    return;
  }

  followUpLoading.value = true;
  try {
    const res = (await businessApi.addClueFollowUp({
      id: followUpForm.id,
      uuid: currentLead.value.uuid,
      salesmanId:
        localStore.userInfo?.userId === undefined
          ? undefined
          : Number(localStore.userInfo.userId),
      contactStatus: followUpForm.contactStatus,
      remarks: followUpForm.remarks || undefined,
      status: followUpForm.status,
    })) as { code?: number; msg?: string };
    if (res?.code === 200) {
      $u.toast("跟进成功", "success");
      showFollowUp.value = false;
      setTimeout(() => {
        initData(searchKeyword.value);
      }, 1500);
    } else {
      $u.toast(res?.msg || "跟进失败", "error");
    }
  } catch (e) {
    console.error("跟进提交失败", e);
    $u.toast("跟进失败", "error");
  } finally {
    followUpLoading.value = false;
  }
};

// ========== 跟进记录 ==========
interface FollowUpRecord {
  id?: number;
  contactStatus?: number;
  status?: number;
  remarks?: string;
  salesmanName?: string;
  createTime?: string;
  updateTime?: string;
}

const showRecords = ref(false);
const followUpRecords = ref<FollowUpRecord[]>([]);
const recordsLoading = ref(false);

/** 联系状态 → 标签 */
const ContactStatusMap = {
  STOP: { value: 1, label: "停机", color: "error" },
  UNREACHABLE: { value: 2, label: "无法联系", color: "error" },
  LOST: { value: 3, label: "暂时失联", color: "warning" },
  NO_ANSWER: { value: 4, label: "不接电话", color: "warning" },
  NORMAL: { value: 5, label: "正常联系", color: "success" },
  COMPLETELY_LOST: { value: 6, label: "彻底失联", color: "error" },
} as const;

const getContactLabel = (status?: number) => {
  return (
    Object.values(ContactStatusMap).find((s) => s.value === status)?.label ||
    "未知"
  );
};

const getContactTagType = (
  status?: number
): "error" | "warning" | "success" | "info" => {
  const color = Object.values(ContactStatusMap).find(
    (s) => s.value === status
  )?.color;
  return (color as "error" | "warning" | "success" | "info") || "info";
};

const fetchRecords = async (uuid: string) => {
  const res = (await businessApi.getClueFollowUpList(uuid)) as {
    code?: number;
    data?: Record<string, unknown>[];
  };
  return res;
};

const openRecords = async (item: LeadItem) => {
  currentLead.value = item;
  showRecords.value = true;
  recordsLoading.value = true;
  try {
    const res = await fetchRecords(item.uuid);
    if (res?.code === 200 && Array.isArray(res.data)) {
      followUpRecords.value = res.data as FollowUpRecord[];
    } else {
      followUpRecords.value = [];
    }
  } catch (e) {
    console.error("获取跟进记录失败", e);
    followUpRecords.value = [];
  } finally {
    recordsLoading.value = false;
  }
};

// ========== 页面初始化 ==========
onLoad(() => {
  initData();
});
</script>

<style lang="scss" scoped>
// ===== 页面基础 =====
.lead-list-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  color: #202633;
  background: #f4f6fb;
  overflow: hidden;
}

.lead-toolbar {
  flex-shrink: 0;
  padding: 20rpx 24rpx 20rpx;
  background: #fff;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.search-input {
  flex: 1;
  min-width: 0;
}

.lead-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
  overscroll-behavior: contain;
}

.lead-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 22rpx 24rpx 152rpx;
}

// ===== 卡片 - 统一风格 =====
.lead-card {
  position: relative;
  background: #fff;
  border: 1rpx solid #edf1f7;
  border-radius: 16rpx;
  padding: 26rpx 26rpx 22rpx 34rpx;
  box-shadow: 0 8rpx 24rpx rgba(31, 76, 132, 0.06);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 22rpx;
    bottom: 22rpx;
    width: 6rpx;
    border-radius: 0 6rpx 6rpx 0;
    background: #d6dce6;
    transition: background 0.3s ease;
  }

  // 不同状态对应不同色条
  &.status-warning::before {
    background: linear-gradient(180deg, #faad14, #ffc53d);
  }
  &.status-success::before {
    background: linear-gradient(180deg, #52c41a, #73d13d);
  }
  &.status-error::before {
    background: linear-gradient(180deg, #ff4d4f, #ff7875);
  }
  &.status-primary::before {
    background: linear-gradient(180deg, #4096ff, #69b1ff);
  }

  &:active {
    transform: scale(0.99);
    box-shadow: 0 4rpx 14rpx rgba(31, 76, 132, 0.08);
  }
}

// ===== 卡片头部 =====
.lead-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 22rpx;
}

.lead-name {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  flex: 1;
  min-width: 0;
}

.avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 8rpx 16rpx rgba(31, 76, 132, 0.12);

  &--warning {
    background: #faad14;
  }
  &--success {
    background: #52c41a;
  }
  &--error {
    background: #ff4d4f;
  }
  &--primary {
    background: #4096ff;
  }
  &--info {
    background: #9098a5;
  }
}

.title-block {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.name {
  font-size: 32rpx;
  font-weight: 700;
  color: #202633;
  line-height: 1.35;
  max-width: 360rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lead-time {
  font-size: 22rpx;
  color: #9aa3b2;
  line-height: 1.4;
}

// ===== 卡片内容区 =====
.lead-info {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 18rpx;
  border-radius: 14rpx;
  background: #f8fafc;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  line-height: 1.6;
}

.info-icon {
  width: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 4rpx;
}

.label {
  color: #818b9b;
  width: 132rpx;
  flex-shrink: 0;
  font-size: 26rpx;
}

.value {
  flex: 1;
  color: #262626;
  font-weight: 500;
  font-size: 26rpx;
  min-width: 0;
  word-break: break-all;
}

.phone-value {
  color: #2979ff;
}

// ===== 卡片底部 =====
.lead-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #edf1f7;
}

.footer-hint {
  display: flex;
  align-items: center;
  gap: 6rpx;
  min-width: 0;
  font-size: 22rpx;
  color: #9aa3b2;
}

// ===== 卡片底部按钮组 =====
.footer-actions {
  display: flex;
  gap: 12rpx;
  flex-shrink: 0;

  :deep(.u-btn) {
    min-width: 92rpx;
    height: 52rpx;
    border-radius: 26rpx !important;
  }
}

// ===== 跟进弹窗 =====
.follow-up-popup {
  width: 686rpx;
  box-sizing: border-box;
  padding: 40rpx 34rpx 34rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 24rpx 70rpx rgba(13, 34, 66, 0.18);
  overflow: hidden;
}

.follow-up-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #202633;
  margin-bottom: 22rpx;
}

.follow-up-customer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 18rpx 22rpx;
  margin-bottom: 24rpx;
  background: #f8fafc;
  border: 1rpx solid #edf1f7;
  border-radius: 16rpx;
}

.follow-up-customer-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.follow-up-customer-phone {
  font-size: 26rpx;
  color: #2979ff;
}

.follow-up-btns {
  margin-top: 28rpx;
}

// ===== 跟进记录弹窗 =====
.records-popup {
  width: 686rpx;
  box-sizing: border-box;
  max-height: 800rpx;
  padding: 40rpx 34rpx 34rpx;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 24rpx 70rpx rgba(13, 34, 66, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.records-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #202633;
  margin-bottom: 18rpx;
}

.records-customer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 16rpx 22rpx;
  margin-bottom: 24rpx;
  background: #f8fafc;
  border: 1rpx solid #edf1f7;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.records-customer-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1a1a1a;
}

.records-customer-phone {
  font-size: 26rpx;
  color: #2979ff;
}

.records-list {
  flex: 1;
  max-height: 520rpx;
}

.records-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  padding: 60rpx 0;
  font-size: 26rpx;
  color: #999;
}

.record-item {
  padding: 22rpx 0;
  border-bottom: 1rpx solid #edf1f7;

  &:last-child {
    border-bottom: none;
  }
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.record-status {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.record-time {
  font-size: 22rpx;
  color: #9aa3b2;
  flex-shrink: 0;
}

.record-remark {
  font-size: 26rpx;
  color: #4e5969;
  line-height: 1.6;
  margin-top: 8rpx;
}

.record-salesman {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}
</style>
