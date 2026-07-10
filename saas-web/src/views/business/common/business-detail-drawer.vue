<template>
  <ElDrawer
    :model-value="modelValue"
    :title="`${displayTitle}详情`"
    :size="hasPhaseTabs ? '85%' : '640px'"
    :with-header="true"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template v-if="hasPhaseTabs && currentRow">
      <div class="detail-drawer__header">
        <div class="detail-drawer__header-top">
          <div class="detail-drawer__header-identity">
            <span class="detail-drawer__order-no">{{ currentRow?.applicationNo }}</span>
            <ElTag
              :type="normalizeTagType(statusTagType(currentRow?.status))"
              effect="plain"
              round
              size="small"
            >
              {{ formatCell(currentRow, 'status') }}
            </ElTag>
          </div>
          <div class="detail-drawer__header-summary">
            <span class="detail-drawer__summary-item">
              <span class="detail-drawer__summary-label">客户</span>
              <span class="detail-drawer__summary-value">{{ currentRow?.customerName }}</span>
            </span>
            <span class="detail-drawer__summary-sep">/</span>
            <span class="detail-drawer__summary-item">
              <span class="detail-drawer__summary-label">产品</span>
              <span class="detail-drawer__summary-value">{{ currentRow?.productName }}</span>
            </span>
            <span class="detail-drawer__summary-sep">/</span>
            <span class="detail-drawer__summary-item">
              <span class="detail-drawer__summary-label">资方</span>
              <span class="detail-drawer__summary-value">{{ currentRow?.funderName }}</span>
            </span>
          </div>
        </div>
        <div class="detail-drawer__header-stats">
          <div
            v-for="stat in headerStats"
            :key="stat.label"
            class="detail-drawer__stat"
            :class="{ 'detail-drawer__stat--highlight': stat.highlight }"
          >
            <span class="detail-drawer__stat-label">{{ stat.label }}</span>
            <span class="detail-drawer__stat-value">{{ stat.value }}</span>
          </div>
        </div>
      </div>

      <BusinessPhaseTabsPanel
        :current-row="currentRow"
        :phase-tabs="phaseTabs"
        :active-main-tab="activeMainTab"
        @update:active-main-tab="$emit('update:activeMainTab', $event)"
        @action="$emit('action', $event)"
        @preview-file="previewFile"
      />
    </template>

    <template v-else>
      <div class="detail-drawer__content">
        <ElDescriptions
          v-if="currentRow"
          :column="2"
          border
          :content-style="{ paddingBottom: '12px' }"
        >
          <ElDescriptionsItem
            v-for="column in detailColumns"
            :key="column.prop"
            :label="column.label"
          >
            {{ formatCell(currentRow, column.prop) }}
          </ElDescriptionsItem>
        </ElDescriptions>
        <ElDivider>原始数据</ElDivider>
        <pre class="detail-json">{{ JSON.stringify(currentRow, null, 2) }}</pre>
      </div>
    </template>

    <ElDialog v-model="filePreviewVisible" title="文件预览" width="720px">
      <video
        v-if="filePreviewType === 'video'"
        :src="filePreviewUrl"
        controls
        style="width: 100%; max-height: 480px"
      />
      <audio
        v-else-if="filePreviewType === 'audio'"
        :src="filePreviewUrl"
        controls
        style="width: 100%"
      />
      <template #footer>
        <ElButton @click="filePreviewVisible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { PropType } from 'vue'
  import BusinessPhaseTabsPanel from './business-phase-tabs-panel.vue'
  import type { DetailHeaderStat, FileGalleryItem } from './detailHelpers'

  type DetailColumnLike = { prop: string; label: string }
  type PhaseActionLike = {
    name: string
    label: string
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
    visible: (row: Record<string, unknown>) => boolean
  }
  type PhaseGroupLike = {
    nodeCode: string | number
    nodeName: string
    fields: Array<{ prop?: string; label?: string; value?: unknown }>
  }
  type PhaseTabLike = {
    code: string | number
    name: string
    actions?: PhaseActionLike[]
    groups: PhaseGroupLike[]
  }
  type ElementTagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

  defineProps({
    modelValue: {
      type: Boolean,
      required: true
    },
    displayTitle: {
      type: String,
      required: true
    },
    currentRow: {
      type: Object as PropType<Record<string, unknown> | null>,
      default: null
    },
    hasPhaseTabs: {
      type: Boolean,
      required: true
    },
    activeMainTab: {
      type: String,
      required: true
    },
    phaseTabs: {
      type: Array as PropType<PhaseTabLike[]>,
      default: () => []
    },
    detailColumns: {
      type: Array as PropType<DetailColumnLike[]>,
      default: () => []
    },
    headerStats: {
      type: Array as PropType<DetailHeaderStat[]>,
      default: () => []
    },
    formatCell: {
      type: Function as PropType<(row: Record<string, unknown>, prop: string) => string>,
      required: true
    },
    statusTagType: {
      type: Function as PropType<(value: unknown) => string>,
      required: true
    },
    normalizeTagType: {
      type: Function as PropType<(value: unknown) => ElementTagType>,
      required: true
    }
  })

  defineEmits<{
    'update:modelValue': [value: boolean]
    'update:activeMainTab': [value: string]
    action: [action: PhaseActionLike]
  }>()

  const filePreviewVisible = ref(false)
  const filePreviewUrl = ref('')
  const filePreviewType = ref<'image' | 'pdf' | 'video' | 'audio' | 'other'>('other')

  function previewFile(file: FileGalleryItem) {
    const fileUrl = file.fileUrl || ''
    filePreviewUrl.value = fileUrl
    filePreviewType.value = normalizePreviewType(file.displayType)
    if (filePreviewType.value === 'video' || filePreviewType.value === 'audio') {
      filePreviewVisible.value = true
    } else if (fileUrl) {
      window.open(fileUrl, '_blank')
    }
  }

  function normalizePreviewType(value: FileGalleryItem['displayType']) {
    return ['image', 'pdf', 'video', 'audio', 'other'].includes(String(value))
      ? (value as 'image' | 'pdf' | 'video' | 'audio' | 'other')
      : 'other'
  }
</script>

<style scoped>
  :deep(.el-drawer__header) {
    margin-bottom: 0 !important;
  }

  .detail-drawer__content {
    padding: 8px 0 24px;
  }

  .detail-drawer__content .el-descriptions__label {
    width: 100px !important;
  }

  .detail-json {
    max-height: 300px;
    padding: 12px;
    overflow-y: auto;
    font-size: 12px;
    line-height: 1.5;
    background: var(--el-fill-color-lighter);
    border-radius: 4px;
  }

  .detail-drawer__header {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
    margin-bottom: 6px;
    background: linear-gradient(
      180deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border: 1px solid var(--el-color-primary-light-8);
    border-radius: 8px;
    box-shadow: 0 2px 8px var(--el-box-shadow-light);
  }

  .detail-drawer__header-top {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .detail-drawer__header-identity {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .detail-drawer__order-no {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    letter-spacing: 0.5px;
  }

  .detail-drawer__header-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .detail-drawer__summary-item {
    display: flex;
    gap: 3px;
    align-items: center;
  }

  .detail-drawer__summary-label {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  .detail-drawer__summary-value {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .detail-drawer__summary-sep {
    margin: 0 1px;
    font-size: 11px;
    color: var(--el-border-color);
  }

  .detail-drawer__header-stats {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }

  .detail-drawer__stat {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    padding: 4px 6px;
    background: var(--el-bg-color);
    border-radius: 4px;
    transition: background 0.2s;
  }

  .detail-drawer__stat:hover {
    background: var(--el-fill-color-light);
  }

  .detail-drawer__stat-label {
    overflow: hidden;
    font-size: 10px;
    color: var(--el-text-color-secondary);
    text-overflow: ellipsis;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  .detail-drawer__stat-value {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail-drawer__stat--highlight .detail-drawer__stat-value {
    color: var(--el-color-primary);
  }
</style>
