<template>
  <u-popup
    :modelValue="visible"
    mode="bottom"
    :border-radius="24"
    :closeable="true"
    close-icon-pos="top-right"
    @update:model-value="onInput"
  >
    <view class="flow-record-popup">
      <view class="flow-record-header">
        <view class="flow-record-header__handle" />
        <view class="flow-record-header__main">
          <view class="flow-record-header__icon">
            <u-icon name="map" size="34" color="#fff" />
          </view>
          <view class="flow-record-header__text">
            <text class="flow-record-title">流程进展</text>
            <text class="flow-record-subtitle">{{ headerSubtitle }}</text>
          </view>
        </view>
        <view v-if="records.length > 0" class="flow-record-summary">
          <view class="flow-record-summary__item">
            <text class="flow-record-summary__num">{{ records.length }}</text>
            <text class="flow-record-summary__label">节点</text>
          </view>
          <view class="flow-record-summary__item">
            <text class="flow-record-summary__num">{{ doneCount }}</text>
            <text class="flow-record-summary__label">完成</text>
          </view>
        </view>
      </view>

      <view v-if="loading" class="flow-record-loading">
        <u-loading mode="circle" />
        <text class="flow-record-loading__text">正在加载进展...</text>
      </view>

      <view v-else-if="records.length === 0" class="flow-record-empty">
        <u-empty mode="list" text="暂无流程记录" />
      </view>

      <scroll-view v-else scroll-y class="flow-record__container">
        <view
          v-for="(item, idx) in records"
          :key="idx"
          class="flow-record-item"
          :class="[
            recordStateClass(item),
            {
              'flow-record-item--first': idx === 0,
              'flow-record-item--last': idx === records.length - 1,
            },
          ]"
        >
          <view class="flow-record__rail">
            <view class="flow-record__line flow-record__line--top" />
            <view class="flow-record__dot" :class="dotClass(item)">
              <u-icon
                v-if="isPass(item)"
                name="checkbox-mark"
                size="22"
                color="#fff"
              />
              <u-icon
                v-else-if="isReject(item)"
                name="close"
                size="22"
                color="#fff"
              />
              <text v-else class="flow-record__dot-text">{{ idx + 1 }}</text>
            </view>
            <view class="flow-record__line flow-record__line--bottom" />
          </view>
          <view class="flow-record__content">
            <view class="flow-record__row">
              <text class="flow-record__node">{{
                item.currentNodeName || getNodeLabel(item.currentNode)
              }}</text>
              <text class="flow-record__status" :class="statusClass(item)">
                {{ item.approvalStatus || "处理中" }}
              </text>
            </view>
            <view
              v-if="item.approveName || item.approvalTime"
              class="flow-record__meta"
            >
              <text v-if="item.approveName" class="flow-record__approver">
                {{ item.approveName }}
              </text>
              <text v-if="item.approvalTime" class="flow-record__time">
                {{ item.approvalTime }}
              </text>
            </view>
            <view
              v-if="item.approvalReason"
              class="flow-record__reason"
              :class="reasonClass(item)"
            >
              <text class="flow-record__reason-label">{{
                reasonLabel(item)
              }}</text>
              <text
                class="flow-record__reason-text"
                :class="{ 'is-clamped': needsClamp(item) && !isExpanded(idx) }"
                >{{ item.approvalReason }}</text>
              <view
                v-if="needsClamp(item)"
                class="flow-record__reason-toggle"
                @click="toggleExpand(idx)"
              >
                <text class="flow-record__reason-toggle-text">{{
                  isExpanded(idx) ? "收起" : "展开全部"
                }}</text>
                <u-icon
                  :name="isExpanded(idx) ? 'arrow-up' : 'arrow-down'"
                  size="22"
                  color="#667eea"
                />
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </u-popup>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

interface FlowRecordItem {
  currentNode: string;
  currentNodeName?: string;
  approvalStatus: string;
  approveName?: string;
  approvalTime?: string;
  approvalReason?: string;
}

const props = defineProps<{
  visible: boolean;
  loading: boolean;
  records: FlowRecordItem[];
  getNodeLabel: (key: string) => string;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

const expandedSet = ref(new Set<number>());

function isExpanded(idx: number) {
  return expandedSet.value.has(idx);
}

function toggleExpand(idx: number) {
  const next = new Set(expandedSet.value);
  if (next.has(idx)) next.delete(idx);
  else next.add(idx);
  expandedSet.value = next;
}

function needsClamp(item: FlowRecordItem) {
  const reason = String(item?.approvalReason || "");
  return reason.length > 80 || reason.includes("\n");
}

function onInput(val: boolean) {
  emit("update:visible", val);
  if (!val) expandedSet.value = new Set();
}

const doneCount = computed(
  () => props.records.filter((item) => isPass(item)).length,
);

const headerSubtitle = computed(() => {
  if (props.loading) return "同步最新处理节点";
  if (!props.records.length) return "暂无可展示的处理记录";
  const latest = props.records[0];
  return `${props.getNodeLabel(latest.currentNode)} · ${latest.approvalStatus || "处理中"}`;
});

function isPending(item: FlowRecordItem) {
  return ["待处理", "处理中", "待审核"].some((text) =>
    item.approvalStatus?.includes(text),
  );
}

function isPass(item: FlowRecordItem) {
  return ["通过", "完成", "成功", "已办结", "已完成"].some((text) =>
    item.approvalStatus?.includes(text),
  );
}

function isReject(item: FlowRecordItem) {
  return ["拒绝", "驳回", "失败", "退回"].some((text) =>
    item.approvalStatus?.includes(text),
  );
}

function isSupplement(item: FlowRecordItem) {
  return ["补件", "要求补件"].some((text) =>
    item.approvalStatus?.includes(text),
  );
}

function reasonLabel(item: FlowRecordItem) {
  if (isReject(item)) return "驳回原因";
  if (isSupplement(item)) return "补件要求";
  return "审批备注";
}

function reasonClass(item: FlowRecordItem) {
  if (isReject(item)) return "flow-record__reason--reject";
  if (isSupplement(item)) return "flow-record__reason--supplement";
  return "";
}

function dotClass(item: FlowRecordItem) {
  if (isPending(item)) return "dot-pending";
  if (isPass(item)) return "dot-pass";
  if (isReject(item)) return "dot-reject";
  return "dot-default";
}

function statusClass(item: FlowRecordItem) {
  if (isPending(item)) return "status-pending";
  if (isPass(item)) return "status-pass";
  if (isReject(item)) return "status-reject";
  return "status-default";
}

function recordStateClass(item: FlowRecordItem) {
  if (isPending(item)) return "flow-record-item--pending";
  if (isPass(item)) return "flow-record-item--pass";
  if (isReject(item)) return "flow-record-item--reject";
  return "flow-record-item--default";
}
</script>

<style lang="scss" scoped>
.flow-record-popup {
  min-height: 420rpx;
  max-height: 86vh;
  overflow: hidden;
  border-radius: 28rpx 28rpx 0 0;
  padding: 18rpx 0 calc(26rpx + env(safe-area-inset-bottom));
  background: linear-gradient(
    180deg,
    rgba(235, 245, 255, 0.96) 0%,
    rgba(248, 251, 255, 0.98) 38%,
    #ffffff 100%
  );
}

.flow-record-header {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 0 30rpx 24rpx;
}

.flow-record-header__handle {
  align-self: center;
  width: 72rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: #dce3ef;
}

.flow-record-header__main {
  display: flex;
  align-items: center;
  gap: 18rpx;
  width: 100%;
}

.flow-record-header__icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #4f7cff, #41c6a8);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 24rpx rgba(67, 124, 255, 0.22);
}

.flow-record-header__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.flow-record-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #1a1d29;
  line-height: 1.2;
}

.flow-record-subtitle {
  font-size: 24rpx;
  color: #8b93a7;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-record-summary {
  display: flex;
  width: 100%;
  padding: 18rpx 0;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(226, 235, 246, 0.95);
}

.flow-record-summary__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;

  & + & {
    border-left: 1rpx solid #edf2f8;
  }
}

.flow-record-summary__num {
  font-size: 34rpx;
  font-weight: 800;
  color: #2f68e8;
  line-height: 1.1;
}

.flow-record-summary__label {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #8b93a7;
}

.flow-record-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 96rpx 0 110rpx;
  color: #86909c;
}

.flow-record-loading__text {
  font-size: 26rpx;
  color: #86909c;
}

.flow-record-empty {
  text-align: center;
  padding: 72rpx 0 90rpx;
  color: #86909c;
  font-size: 26rpx;
}

.flow-record__container {
  max-height: 58vh;
  padding: 4rpx 28rpx 8rpx;
  box-sizing: border-box;
}

.flow-record-item {
  display: grid;
  grid-template-columns: 74rpx minmax(0, 1fr);
  column-gap: 12rpx;
  min-height: 126rpx;
  position: relative;
}

.flow-record__rail {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 126rpx;
}

.flow-record__line {
  width: 4rpx;
  flex: 1;
  min-height: 26rpx;
  background: linear-gradient(
    180deg,
    rgba(75, 122, 255, 0.22),
    rgba(38, 198, 168, 0.22)
  );
}

.flow-record__line--top {
  border-radius: 999rpx 999rpx 0 0;
}

.flow-record__line--bottom {
  border-radius: 0 0 999rpx 999rpx;
}

.flow-record-item--first .flow-record__line--top,
.flow-record-item--last .flow-record__line--bottom {
  opacity: 0;
}

.flow-record__dot {
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 18rpx rgba(31, 45, 86, 0.14);
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: -10rpx;
    border-radius: 50%;
    border: 2rpx solid rgba(64, 150, 255, 0.12);
  }

  &.dot-pending {
    background: #fff8ed;
    color: #f59e0b;
    border: 4rpx solid #ffe3b7;
  }

  &.dot-pass {
    background: linear-gradient(135deg, #20c997, #3ecf8e);
    border: 4rpx solid #d9f8ea;
  }

  &.dot-reject {
    background: linear-gradient(135deg, #ff6b6b, #f53f3f);
    border: 4rpx solid #ffe0e0;
  }

  &.dot-default {
    background: linear-gradient(135deg, #4f7cff, #168cff);
    border: 4rpx solid #dbe8ff;
  }
}

.flow-record__dot-text {
  font-size: 22rpx;
  font-weight: 800;
  color: currentColor;
  line-height: 1;
}

.flow-record__content {
  min-width: 0;
  align-self: center;
  margin: 10rpx 0 18rpx;
  padding: 22rpx 22rpx 20rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(226, 235, 246, 0.96);
  box-shadow: 0 8rpx 22rpx rgba(31, 45, 86, 0.055);
  position: relative;

  &::before {
    content: "";
    position: absolute;
    left: -10rpx;
    top: 34rpx;
    width: 18rpx;
    height: 18rpx;
    background: inherit;
    border-left: 1rpx solid rgba(226, 235, 246, 0.96);
    border-bottom: 1rpx solid rgba(226, 235, 246, 0.96);
    transform: rotate(45deg);
  }
}

.flow-record-item--pass .flow-record__content {
  border-color: rgba(32, 201, 151, 0.22);
}

.flow-record-item--reject .flow-record__content {
  border-color: rgba(245, 63, 63, 0.22);
}

.flow-record-item--pending .flow-record__content {
  border-color: rgba(245, 158, 11, 0.24);
}

.flow-record__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.flow-record__node {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
  font-weight: 800;
  color: #1d2129;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-record__status {
  flex-shrink: 0;
  font-size: 22rpx;
  font-weight: 700;
  height: 42rpx;
  line-height: 42rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;

  &.status-pending {
    background: #fff4df;
    color: #f59e0b;
  }

  &.status-pass {
    background: #eafaf2;
    color: #18a66f;
  }

  &.status-reject {
    background: #fff0f0;
    color: #e34d59;
  }

  &.status-default {
    background: #eef4ff;
    color: #2f68e8;
  }
}

.flow-record__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx 18rpx;
  margin-bottom: 12rpx;
}

.flow-record__approver,
.flow-record__time {
  font-size: 24rpx;
  color: #86909c;
  line-height: 1.35;
}

.flow-record__reason {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 16rpx 18rpx;
  background: #f7f9fc;
  border-radius: 16rpx;
  border: 1rpx solid #eef2f7;

  &--reject {
    background: linear-gradient(135deg, #fff5f5 0%, #fef2f2 100%);
    border-color: rgba(239, 68, 68, 0.18);
  }

  &--supplement {
    background: linear-gradient(135deg, #fffbeb 0%, #fef9ee 100%);
    border-color: rgba(245, 158, 11, 0.18);
  }
}

.flow-record__reason-label {
  font-size: 22rpx;
  font-weight: 700;
  color: #86909c;
  line-height: 1;

  .flow-record__reason--reject & {
    color: #e34d59;
  }

  .flow-record__reason--supplement & {
    color: #d97706;
  }
}

.flow-record__reason-text {
  font-size: 25rpx;
  color: #4e5969;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;

  &.is-clamped {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
  }

  .flow-record__reason--reject & {
    color: #991b1b;
  }

  .flow-record__reason--supplement & {
    color: #92400e;
  }
}

.flow-record__reason-toggle {
  display: flex;
  align-items: center;
  gap: 6rpx;
  align-self: flex-end;
}

.flow-record__reason-toggle-text {
  font-size: 24rpx;
  color: #667eea;
  font-weight: 600;
}
</style>
