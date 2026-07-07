<template>
  <ElTabs :model-value="activeMainTab" class="detail-drawer__main-tabs" @update:model-value="handleTabChange">
    <ElTabPane
      v-for="phase in phaseTabs"
      :key="phase.code"
      :label="phase.name"
      :name="String(phase.code)"
    >
      <div v-if="!phase.groups.length" class="detail-drawer__phase-empty">
        暂无此阶段数据
      </div>
      <div v-else class="phase-fields">
        <div v-if="phase.actions && phase.actions.length" class="phase-actions">
          <ElButton
            v-for="action in phase.actions"
            :key="action.name"
            :type="(action.type || 'primary') as 'primary' | 'success' | 'warning' | 'danger' | 'info'"
            :disabled="!action.visible(currentRow)"
            @click="$emit('action', action)"
          >
            {{ action.label }}
          </ElButton>
        </div>
        <div v-for="group in phase.groups" :key="group.nodeCode" class="phase-fields__group">
          <div class="phase-fields__group-title">{{ group.nodeName }}</div>
          <BusinessFileGallery
            v-if="isFileGroup(group)"
            :files="fileGroupFiles(group)"
            @preview="$emit('preview-file', $event)"
          />
          <ElDescriptions v-else :column="2" border size="small">
            <ElDescriptionsItem
              v-for="field in group.fields"
              :key="field.prop"
              :label="field.label"
            >
              {{ field.value }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </div>
      </div>
    </ElTabPane>
  </ElTabs>
</template>

<script setup lang="ts">
  import type { PropType } from 'vue'
  import BusinessFileGallery from './business-file-gallery.vue'
  import { fileGroupFiles, isFileGroup } from './detailHelpers'
  import type { FileGalleryItem } from './detailHelpers'

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

  const props = defineProps({
    currentRow: {
      type: Object as PropType<Record<string, unknown>>,
      required: true
    },
    phaseTabs: {
      type: Array as PropType<PhaseTabLike[]>,
      default: () => []
    },
    activeMainTab: {
      type: String,
      required: true
    }
  })

  const emit = defineEmits<{
    'update:activeMainTab': [value: string]
    action: [action: PhaseActionLike]
    'preview-file': [file: FileGalleryItem]
  }>()

  function handleTabChange(value: string | number) {
    emit('update:activeMainTab', String(value))
  }
</script>

<style scoped>
  .detail-drawer__main-tabs {
    height: 100%;
  }

  .detail-drawer__main-tabs :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }

  .detail-drawer__main-tabs :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
  }

  .detail-drawer__main-tabs :deep(.el-tab-pane) {
    height: 100%;
  }

  .detail-drawer__phase-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 160px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .phase-fields {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 4px 0;
  }

  .phase-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .phase-fields__group {
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .phase-fields__group-title {
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    background: var(--el-fill-color-extra-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .phase-fields__group :deep(.el-descriptions) {
    border: none;
    border-radius: 0;
  }

  .phase-fields__group :deep(.el-descriptions__body) {
    border: none;
  }
</style>
