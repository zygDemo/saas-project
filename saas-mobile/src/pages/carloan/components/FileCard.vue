<template>
  <view class="file-card" @click="$emit('click')">
    <view class="upload-box" :class="{ 'has-file': files.length > 0 }">
      <image
        v-if="isImageFile(firstFileUrl)"
        :src="firstFileUrl"
        mode="aspectFill"
        class="uploaded-image"
      />
      <view v-else-if="firstFileUrl" class="file-placeholder">
        <u-icon name="file-text" size="56rpx" color="var(--u-type-primary)" />
      </view>
      <view v-else-if="!readonly" class="upload-placeholder">
        <view class="plus-icon">+</view>
      </view>
      <view v-else class="file-placeholder">
        <u-icon name="file-text" size="56rpx" color="#c0c4cc" />
      </view>
      <view class="file-count">{{ files.length }}/{{ maxCount }}</view>
    </view>
    <view class="file-label-wrap">
      <text v-if="required" class="required-star">*</text>
      <text class="file-label">{{ label }}</text>
    </view>
    <text v-if="remark" class="file-remark">{{ remark }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { toFilePreviewUrl } from "@/common/file-url";

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  files: {
    type: Array,
    default: () => [],
  },
  maxCount: {
    type: Number,
    default: 1,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  required: {
    type: Boolean,
    default: false,
  },
  remark: {
    type: String,
    default: "",
  },
});

defineEmits(["click"]);

const firstFileUrl = computed(() => toFilePreviewUrl(String(props.files[0] || "")));

function isImageFile(file) {
  return !!file && /\.(?:jpg|jpeg|png|gif|webp|bmp)(?:[?#].*)?$/i.test(String(file));
}
</script>

<style lang="scss" scoped>
.file-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.upload-box {
  width: 100%;
  aspect-ratio: 1;
  border: 2rpx dashed var(--u-type-primary);
  border-radius: 12rpx;
  background: #fff;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  &.has-file {
    border-color: transparent;
  }
}

.uploaded-image {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f8ff;
}

.plus-icon {
  font-size: 64rpx;
  color: var(--u-type-primary);
  font-weight: 300;
}

.file-count {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, var(--u-type-primary), #36cfc9);
  color: #fff;
  font-size: 24rpx;
  padding: 8rpx;
  text-align: center;
}

.file-label-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}

.required-star {
  color: #ff4d4f;
  font-size: 24rpx;
}

.file-label {
  font-size: 24rpx;
  color: #666;
  text-align: center;
}

.file-remark {
  font-size: 20rpx;
  color: #999;
  text-align: center;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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