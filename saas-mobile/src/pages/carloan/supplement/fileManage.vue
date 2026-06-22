<template>
  <app-page nav-title="文件管理">
    <view class="file-page">
      <!-- 上传区域 -->
      <view class="upload-section">
        <view class="section-title">
          <view class="title-dot" />
          <u-text text="上传文件" size="28rpx" bold />
        </view>
        <u-gap height="12" />
        <view class="upload-box" role="button" tabindex="0" @click="showUploadOptions">
          <u-icon name="plus" size="48" color="var(--u-type-primary)" />
          <text class="upload-text">点击上传文件</text>
          <text class="upload-hint">支持图片、文档等</text>
        </view>
      </view>

      <u-gap height="24" />

      <!-- 文件列表 -->
      <view class="list-section">
        <view class="section-title">
          <view class="title-dot" />
          <u-text text="文件列表" size="28rpx" bold />
          <u-text :text="`(${fileList.length})`" size="24rpx" color="#999" />
        </view>
        <u-gap height="12" />

        <view v-if="loading" class="loading-wrap">
          <u-loading mode="circle" size="32" />
          <text class="loading-text">加载中...</text>
        </view>

        <view v-else-if="fileList.length === 0" class="empty-wrap">
          <u-icon name="folder" size="64" color="#ccc" />
          <text class="empty-text">暂无文件</text>
        </view>

        <view v-else class="file-list">
          <view
            v-for="item in fileList"
            :key="item.id"
            class="file-item" role="button" tabindex="0" @click="previewFile(item)"
          >
            <view class="file-icon">
              <u-icon
                :name="getFileIcon(item.fileName)"
                size="48"
                :color="themeColor"
              />
            </view>
            <view class="file-info">
              <text class="file-name">{{ item.fileName }}</text>
              <text class="file-meta">{{ formatSize(item.fileSize) }} · {{ item.createTime }}</text>
            </view>
            <view class="file-actions">
              <u-icon
                name="download"
                size="36"
                color="#666"
                @click.stop="downloadFile(item)"
              />
              <u-icon
                name="trash"
                size="36"
                color="#ff4d4f"
                @click.stop="confirmDelete(item)"
              />
            </view>
          </view>
        </view>
      </view>
    </view>
  </app-page>
</template>

<script setup>
import { $u, useTheme } from "uview-pro";
import { computed, onMounted, ref } from "vue";
import { useCarloanApi } from "@/api/carloan";
import { normalizeFileRecord, toFilePreviewUrl } from "@/common/file-url";
import { useLocalStore } from "@/stores";

const businessApi = useCarloanApi();
const localStore = useLocalStore();
const loading = ref(false);
const fileList = ref([]);

// 主题色
const { currentTheme } = useTheme();
const themeColor = computed(() => {
  return currentTheme.value?.color?.primary || "var(--u-type-primary)";
});

// 获取文件列表
async function fetchFileList() {
  const userInfo = localStore.userInfo || {};
  const uuid = Object.hasOwn(userInfo, "uuid") ? String(userInfo.uuid) : "1";
  if (!uuid) {
    $u.toast("用户信息缺失，请重新登录", "error");
    return;
  }

  loading.value = true;
  try {
    const res = await businessApi.getFileList(uuid);
    if (res?.code === 200 && res.data) {
      fileList.value = res.data.map((file) => normalizeFileRecord(file));
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    loading.value = false;
  }
}

// 显示上传选项（图片/文件）
function showUploadOptions() {
  uni.showActionSheet({
    itemList: ["拍照/相册", "选择文件"],
    success: (res) => {
      if (res.tapIndex === 0) {
        chooseImage();
      } else {
        chooseDocument();
      }
    },
  });
}

// 选择图片
function chooseImage() {
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: async (res) => {
      const filePath = res.tempFilePaths?.[0];
      if (!filePath) return;
      await doUploadFile(filePath);
    },
  });
}

// 选择文档（H5/小程序支持）
function chooseDocument() {
  // #ifdef H5 || MP-WEIXIN
  uni.chooseFile({
    count: 1,
    success: async (res) => {
      const filePath = res.tempFilePaths?.[0] || res.tempFiles?.[0]?.path;
      if (!filePath) return;
      await doUploadFile(filePath);
    },
    fail: () => {
      $u.toast("当前平台暂不支持选择文件", "error");
    },
  });
  // #endif

  // #ifndef H5 || MP-WEIXIN
  $u.toast("当前平台暂不支持选择文件，请选择图片", "error");
  // #endif
}

// 上传文件 - 统一走 /m/file/upload
async function doUploadFile(filePath) {
  uni.showLoading({ title: "上传中...", mask: true });
  try {
    const res = await businessApi.uploadFile(filePath);
    if (res?.code === 200) {
      $u.toast("上传成功", "success");
      await fetchFileList();
    }
  } catch {
    // 错误已由拦截器处理
  } finally {
    uni.hideLoading();
  }
}

// 删除文件确认
function confirmDelete(item) {
  uni.showModal({
    title: "提示",
    content: `确定删除 "${item.fileName}" 吗？`,
    confirmColor: "#ff4d4f",
    success: async (res) => {
      if (res.confirm) {
        await deleteFile(item.id);
      }
    },
  });
}

// 删除文件
async function deleteFile(id) {
  try {
    const res = await businessApi.deleteFile(id);
    if (res?.code === 200) {
      $u.toast("删除成功", "success");
      await fetchFileList();
    }
  } catch {
    // 错误已由拦截器处理
  }
}

// 预览文件
function previewFile(item) {
  const isImage = /\.(?:jpg|jpeg|png|gif|webp)$/i.test(item.fileName);
  const fileUrl = item.previewUrl || toFilePreviewUrl(item.fileUrl);
  if (isImage) {
    uni.previewImage({
      urls: [fileUrl],
      current: fileUrl,
    });
  } else {
    // 其他文件下载或跳转浏览器
    uni.showModal({
      title: "提示",
      content: "是否下载该文件？",
      success: (res) => {
        if (res.confirm) {
          downloadFile(item);
        }
      },
    });
  }
}

// 下载文件
function downloadFile(item) {
  const fileUrl = item.previewUrl || toFilePreviewUrl(item.fileUrl);
  uni.downloadFile({
    url: fileUrl,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.openDocument({
          filePath: res.tempFilePath,
          showMenu: true,
        });
      }
    },
    fail: () => {
      $u.toast("下载失败", "error");
    },
  });
}

// 获取文件图标
function getFileIcon(fileName) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  const iconMap = {
    pdf: "file-text",
    doc: "file-text",
    docx: "file-text",
    xls: "grid",
    xlsx: "grid",
    ppt: "file-text",
    pptx: "file-text",
    jpg: "photo",
    jpeg: "photo",
    png: "photo",
    gif: "photo",
    mp4: "play-circle",
    mp3: "volume",
    zip: "folder",
    rar: "folder",
  };
  return iconMap[ext] || "file-text";
}

// 格式化文件大小
function formatSize(bytes) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

onMounted(() => {
  fetchFileList();
});
</script>

<style lang="scss" scoped>
.file-page {
  padding: 24rpx;
  background: linear-gradient(180deg, #f7f8f9 0%, #ffffff 100%);

}

.section-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

// .title-dot {
//   width: 6rpx;
//   height: 28rpx;
//   background: linear-gradient(180deg, var(--u-type-primary), #6bd3ff);
//   border-radius: 4rpx;
// }

.upload-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200rpx;
  border: 2rpx dashed rgba(var(--u-type-primary-rgb, 82, 64, 254), 0.35);
  border-radius: 18rpx;
  background: #fff;
  gap: 8rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #666;
}

.upload-hint {
  font-size: 22rpx;
  color: #999;
}

.loading-wrap,
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  gap: 16rpx;
}

.loading-text,
.empty-text {
  font-size: 28rpx;
  color: #999;
}

.file-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f5f5f5;
  }
}

.file-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f7ff;
  border-radius: 12rpx;
  margin-right: 20rpx;
}

.file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  overflow: hidden;
}

.file-name {
  font-size: 28rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  font-size: 24rpx;
  color: #999;
}

.file-actions {
  display: flex;
  gap: 24rpx;
  padding-left: 16rpx;
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
  .shadow { box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2); }
}
</style>