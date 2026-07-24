<template>
  <app-page nav-title="申请资料上传">
    <view class="materials-page">
      <view class="summary-band">
        <view>
          <text class="summary-title">车辆典当资料</text>
          <text class="summary-sub">必传资料上传完整后可继续填写放款信息</text>
        </view>
        <view class="summary-count">
          <text class="count-main">{{ uploadedRequiredCount }}</text>
          <text class="count-sub">/{{ requiredCount }}</text>
        </view>
      </view>

      <view class="file-grid">
        <FileCard
          v-for="item in materials"
          :key="item.code"
          :label="item.label"
          :files="item.files.map((file) => file.path)"
          :max-count="1"
          :required="item.required"
          @click="openPicker(item)"
        />
      </view>

      <view class="footer-btn">
        <u-button type="primary" shape="circle" @click="handleNext">
          下一步
        </u-button>
      </view>
    </view>

    <u-popup v-model="showPopup" mode="bottom" :round="24">
      <view v-if="currentItem" class="upload-popup">
        <view class="popup-head">
          <text class="popup-title">{{ currentItem.label }}</text>
          <text class="popup-tip">{{ currentItem.required ? "必传" : "非必传" }} · {{ acceptText }}</text>
        </view>

        <view v-if="currentItem.files.length" class="selected-file">
          <u-icon :name="currentItem.accept === 'video' ? 'play-circle' : 'file-text'" size="42" color="var(--u-type-primary)" />
          <view class="selected-info">
            <text class="selected-name">{{ currentItem.files[0].name }}</text>
            <text class="selected-time">{{ currentItem.files[0].createTime }}</text>
          </view>
          <u-button size="mini" type="error" plain @click="removeCurrentFile">
            删除
          </u-button>
        </view>

        <view v-else class="empty-file">
          <u-icon name="upload" size="54" color="#9ca3af" />
          <text>暂无文件</text>
        </view>

        <u-button type="primary" shape="circle" @click="chooseCurrentFile">
          {{ currentItem.files.length ? "重新选择" : "选择文件" }}
        </u-button>
      </view>
    </u-popup>
  </app-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { $u } from "uview-pro";
import { useSessionStore } from "@/stores";
import FileCard from "../components/FileCard.vue";
import { createEmptyPawnMaterials, getNowText } from "@/common/pawnMock";
import { APP_ROUTES } from "@/common/navigation";

const sessionStore = useSessionStore();
const materials = ref(createEmptyPawnMaterials());
const showPopup = ref(false);
const currentCode = ref("");

const currentItem = computed(() =>
  materials.value.find((item) => item.code === currentCode.value),
);

const requiredCount = computed(() =>
  materials.value.filter((item) => item.required).length,
);

const uploadedRequiredCount = computed(() =>
  materials.value.filter((item) => item.required && item.files.length > 0).length,
);

const acceptText = computed(() => {
  if (!currentItem.value) return "";
  const map = {
    image: "图片",
    video: "视频",
    file: "文件",
  };
  return map[currentItem.value.accept] || "文件";
});

onLoad(() => {
  const cached = sessionStore.orderInfo?.pawnMaterials;
  if (Array.isArray(cached) && cached.length) {
    materials.value = cached;
  }
});

function openPicker(item) {
  currentCode.value = item.code;
  showPopup.value = true;
}

function setCurrentFile(file) {
  if (!currentItem.value) return;
  currentItem.value.files = [{
    name: file.name,
    path: file.path,
    size: file.size || 0,
    type: currentItem.value.accept,
    createTime: getNowText(),
  }];
}

function getFileName(path, fallback) {
  return String(path || "").split("/").pop() || fallback;
}

function chooseCurrentFile() {
  if (!currentItem.value) return;

  if (currentItem.value.accept === "image") {
    uni.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["camera", "album"],
      success: (res) => {
        const path = res.tempFilePaths?.[0];
        if (!path) return;
        const tempFile = Array.isArray(res.tempFiles) ? res.tempFiles[0] : {};
        setCurrentFile({
          path,
          name: tempFile?.name || getFileName(path, `${currentItem.value.label}.jpg`),
          size: tempFile?.size,
        });
      },
    });
    return;
  }

  if (currentItem.value.accept === "video") {
    uni.chooseVideo({
      sourceType: ["camera", "album"],
      compressed: true,
      success: (res) => {
        const path = res.tempFilePath;
        if (!path) return;
        setCurrentFile({
          path,
          name: res.name || getFileName(path, `${currentItem.value.label}.mp4`),
          size: res.size,
        });
      },
    });
    return;
  }

  // #ifdef H5 || MP-WEIXIN
  uni.chooseFile({
    count: 1,
    success: (res) => {
      const file = Array.isArray(res.tempFiles) ? res.tempFiles[0] : null;
      if (!file?.path) return;
      setCurrentFile({
        path: file.path,
        name: file.name || getFileName(file.path, currentItem.value.label),
        size: file.size,
      });
    },
  });
  // #endif

  // #ifndef H5 || MP-WEIXIN
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["camera", "album"],
    success: (res) => {
      const path = res.tempFilePaths?.[0];
      if (!path) return;
      setCurrentFile({
        path,
        name: getFileName(path, `${currentItem.value.label}.jpg`),
      });
    },
  });
  // #endif
}

function removeCurrentFile() {
  if (!currentItem.value) return;
  currentItem.value.files = [];
}

function handleNext() {
  const missing = materials.value.find((item) => item.required && item.files.length === 0);
  if (missing) {
    $u.toast(`请上传${missing.label}`, "error");
    return;
  }

  sessionStore.setOrderInfo({
    businessType: "pawn",
    pawnMaterials: materials.value,
  });

  uni.navigateTo({
    url: APP_ROUTES.carloan.approval.pawnLoanInfo,
  });
}
</script>

<style lang="scss" scoped>
.materials-page {
  min-height: 100%;
  padding: 28rpx 24rpx 140rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);
}

.summary-band {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 24rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, #eff6ff, #ecfeff);
  border: 1rpx solid #dbeafe;
}

.summary-title,
.summary-sub {
  display: block;
}

.summary-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.summary-sub {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #64748b;
}

.summary-count {
  display: flex;
  align-items: baseline;
  color: var(--u-type-primary);
}

.count-main {
  font-size: 42rpx;
  font-weight: 800;
}

.count-sub {
  font-size: 26rpx;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24rpx 18rpx;
}

.footer-btn {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 4rpx 20rpx rgba(15, 23, 42, 0.05);
}

.upload-popup {
  padding: 32rpx 24rpx calc(32rpx + env(safe-area-inset-bottom));
  background: #fff;
}

.popup-head {
  
  text-align: center;
}

.popup-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.popup-tip {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #64748b;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  border-radius: 20rpx;
  background: #f8fafc;
}

.selected-info {
  flex: 1;
  min-width: 0;
}

.selected-name,
.selected-time {
  display: block;
}

.selected-name {
  font-size: 28rpx;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-time {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #94a3b8;
}

.empty-file {
  height: 180rpx;
  margin-bottom: 24rpx;
  border: 2rpx dashed #d1d5db;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  color: #9ca3af;
  font-size: 26rpx;
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-container { background-color: #121212; }
  .card { background-color: #1e1e1e; }
  .card-item { background-color: #1e1e1e; }
  .list-item { background-color: #1e1e1e; }
  .section { background-color: #1e1e1e; }
  .form-item { background-color: #1e1e1e; border-color: #2a2a2a; }
  .title { color: #e5e6eb; }
  .subtitle { color: #8b8c91; }
  .desc { color: #8b8c91; }
  .label { color: #b0b3b8; }
  .value { color: #e5e6eb; }
  .name { color: #e5e6eb; }
  .info { color: #b0b3b8; }
  .text { color: #e5e6eb; }
  .tip { color: #8b8c91; }
  .divider { background-color: #2a2a2a; }
  .border { border-color: #2a2a2a; }
  .input { background-color: #2a2a2a; color: #e5e6eb; }
  .textarea { background-color: #2a2a2a; color: #e5e6eb; }
  .picker { background-color: #2a2a2a; color: #e5e6eb; }
  .footer { background-color: #1e1e1e; }
}
</style>