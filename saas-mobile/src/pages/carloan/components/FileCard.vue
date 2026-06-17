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
  </view>
</template>

<script setup>
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
</style>