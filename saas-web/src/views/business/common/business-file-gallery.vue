<template>
  <div class="file-gallery">
    <div
      v-for="file in files"
      :key="file.id"
      class="file-gallery__item"
      @click="$emit('preview', file)"
    >
      <img
        v-if="file.displayType === 'image'"
        :src="file.fileUrl"
        :alt="file.fileTypeName"
        class="file-gallery__img"
      />
      <div
        v-else-if="file.displayType === 'pdf'"
        class="file-gallery__icon file-gallery__icon--pdf"
      >
        <ArtSvgIcon icon="ri:file-pdf-2-line" class="file-gallery__icon-svg" />
      </div>
      <div
        v-else-if="file.displayType === 'video'"
        class="file-gallery__icon file-gallery__icon--video"
      >
        <ArtSvgIcon icon="ri:video-line" class="file-gallery__icon-svg" />
      </div>
      <div
        v-else-if="file.displayType === 'audio'"
        class="file-gallery__icon file-gallery__icon--audio"
      >
        <ArtSvgIcon icon="ri:music-line" class="file-gallery__icon-svg" />
      </div>
      <div v-else class="file-gallery__icon file-gallery__icon--other">
        <ArtSvgIcon icon="ri:file-3-line" class="file-gallery__icon-svg" />
      </div>
      <div class="file-gallery__name">{{ file.fileTypeName || file.fileName }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { PropType } from 'vue'
  import type { FileGalleryItem } from './detailHelpers'

  defineProps({
    files: {
      type: Array as PropType<FileGalleryItem[]>,
      default: () => []
    }
  })

  defineEmits<{
    preview: [file: FileGalleryItem]
  }>()
</script>

<style scoped>
  .file-gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
    padding: 8px 0;
  }

  .file-gallery__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px;
    cursor: pointer;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .file-gallery__item:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px var(--el-box-shadow-light);
  }

  .file-gallery__img {
    width: 100%;
    height: 100px;
    object-fit: cover;
    border-radius: 4px;
  }

  .file-gallery__icon {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100px;
    border-radius: 4px;
  }

  .file-gallery__icon--pdf {
    background: var(--el-color-danger-light-9);
  }

  .file-gallery__icon--video {
    background: var(--el-color-primary-light-9);
  }

  .file-gallery__icon--audio {
    background: var(--el-color-success-light-9);
  }

  .file-gallery__icon--other {
    background: var(--el-fill-color-light);
  }

  .file-gallery__icon-svg {
    font-size: 36px;
    color: var(--el-text-color-secondary);
  }

  .file-gallery__icon--pdf .file-gallery__icon-svg {
    color: var(--el-color-danger);
  }

  .file-gallery__icon--video .file-gallery__icon-svg {
    color: var(--el-color-primary);
  }

  .file-gallery__icon--audio .file-gallery__icon-svg {
    color: var(--el-color-success);
  }

  .file-gallery__name {
    width: 100%;
    overflow: hidden;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
