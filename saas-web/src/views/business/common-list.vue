<template>
  <div class="business-list-page art-full-height">
    <ArtSearchBar
      v-model="searchFormModel"
      :items="searchFormItems"
      :span="6"
      @search="handleArtSearch"
      @reset="handleArtReset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="loadData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-if="!config.readonly" type="primary" @click="openCreate" v-ripple>
              <ArtSvgIcon icon="ri:add-line" class="mr-1" />
              新增
            </ElButton>
            <ElButton
              v-if="showActionOverview"
              type="success"
              plain
              @click="showActions = !showActions"
            >
              {{ showActions ? '隐藏动作接口' : '查看动作接口' }}
            </ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ElAlert
        v-if="showActions && showActionOverview"
        class="mb-4"
        type="success"
        :closable="false"
      >
        <template #title>已接入业务动作接口</template>
        <div class="flex flex-wrap gap-2 mt-2">
          <ElTag v-for="action in config.actions" :key="action.label" type="success">{{
            action.label
          }}</ElTag>
        </div>
      </ElAlert>

      <div v-if="isOrgModule" class="org-summary">
        <div v-for="item in orgSummaryItems" :key="item.label" class="org-summary__item">
          <div class="org-summary__icon" :class="item.tone">
            <ArtSvgIcon :icon="item.icon" />
          </div>
          <div>
            <div class="org-summary__value">{{ item.value }}</div>
            <div class="org-summary__label">{{ item.label }}</div>
          </div>
        </div>
      </div>

      <ArtTable
        :loading="loading"
        :data="records"
        :columns="tableColumns"
        :pagination="pagination"
        :extra-height-offset="0"
        :empty-text="isOrgModule ? '暂无机构数据' : '暂无数据'"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <BusinessFormDialog
      v-model="formVisible"
      :form-mode="formMode"
      :display-title="displayTitle"
      :form-fields="formFields"
      :form-model="formModel"
      :select-loading="selectLoading"
      :submitting="submitting"
      :should-show-field-group="shouldShowFieldGroup"
      :field-options="fieldOptions"
      @update:form-model="handleFormModelUpdate"
      @field-change="handleFormFieldChange"
      @submit="submitForm"
    />

    <BusinessActionDialog
      v-model="actionVisible"
      :active-action="activeAction"
      :action-fields="actionFields"
      :action-model="actionModel"
      :submitting="submitting"
      @update:action-model="handleActionModelUpdate"
      @submit="submitAction"
    />

    <BusinessDetailDrawer
      v-model="detailVisible"
      :display-title="displayTitle"
      :current-row="currentRow"
      :has-phase-tabs="hasPhaseTabs"
      :active-main-tab="activeMainTab"
      :phase-tabs="phaseTabs"
      :detail-columns="detailColumns"
      :header-stats="headerStats"
      :format-cell="formatCell"
      :status-tag-type="statusTagType"
      :normalize-tag-type="normalizeTagType"
      @update:active-main-tab="activeMainTab = $event"
      @action="handleDetailAction"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, defineAsyncComponent, onActivated, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElButton, ElSpace } from 'element-plus'
  import { useBusinessList } from './common/useBusinessList'
  import { buildBusinessTableColumns } from './common/table-columns'
  import { resolveHeaderStats } from './common/detailHelpers'
  import type { ActionConfig } from './common'

  const BusinessDetailDrawer = defineAsyncComponent(
    () => import('./common/business-detail-drawer.vue')
  )
  const BusinessFormDialog = defineAsyncComponent(() => import('./common/business-form-dialog.vue'))
  const BusinessActionDialog = defineAsyncComponent(
    () => import('./common/business-action-dialog.vue')
  )

  const {
    loading,
    submitting,
    showActions,
    searchFormModel,
    columnChecks,
    records,
    currentRow,
    detailVisible,
    formVisible,
    actionVisible,
    formMode,
    formModel,
    actionModel,
    activeAction,
    pagination,
    selectLoading,
    config,
    displayTitle,
    isOrgModule,
    showActionOverview,
    formFields,
    actionFields,
    detailColumns,
    phaseNodeTabs,
    phaseTabs,
    defaultPhaseCode,
    activeMainTab,
    searchFormItems,
    orgSummaryItems,
    loadData,
    handleSizeChange,
    handleCurrentChange,
    handleArtSearch,
    handleArtReset,
    openCreate,
    openEdit,
    submitForm,
    rowActions,
    openAction,
    submitAction,
    formatCell,
    statusTagType,
    shouldShowFieldGroup,
    fieldOptions,
    handleFieldChange,
    openDetail,
    handleDelete,
    resetRuntimeState
  } = useBusinessList()

  const route = useRoute()
  type ElementTagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'
  const hasPhaseTabs = computed(() => phaseNodeTabs.value.length > 0)
  const headerStats = computed(() => resolveHeaderStats(currentRow.value || {}))
  const tagTypes = new Set<ElementTagType>(['primary', 'success', 'warning', 'info', 'danger'])
  const normalizeTagType = (value: unknown): ElementTagType => {
    return tagTypes.has(value as ElementTagType) ? (value as ElementTagType) : 'info'
  }

  function handleDetailAction(
    action: ActionConfig & { planId?: number; plan?: Record<string, unknown> }
  ) {
    if (!currentRow.value) return
    // 合并 config.value.actions 中对应的完整 action 配置（包含 path 和 fields）
    const fullAction = config.value.actions.find((a) => a.name === action.name) || action
    // 如果是从还款计划表格点击的"还款"按钮，用 plan 数据预填表单
    if (action.plan && action.name === 'register-repayment') {
      const plan = action.plan
      fullAction.defaults = () => ({
        amount: plan.totalAmount,
        principal: plan.principal,
        interest: plan.interest,
        penalty: plan.penaltyAmount || 0
      })
    }
    openAction(currentRow.value, fullAction)
  }

  function handleFormModelUpdate(value: Record<string, unknown>) {
    Object.assign(formModel, value)
  }

  function handleActionModelUpdate(value: Record<string, unknown>) {
    Object.assign(actionModel, value)
  }

  function handleFormFieldChange(field: { prop: string }, value: unknown) {
    handleFieldChange(field as never, value)
  }

  const tableColumns = computed(() =>
    buildBusinessTableColumns({
      configColumns: config.value.columns,
      isOrgModule: isOrgModule.value,
      formatCell,
      statusTagType,
      normalizeTagType,
      openDetail,
      openEdit,
      handleDelete,
      openAction,
      rowActions,
      readonly: !!config.value.readonly
    })
  )

  onMounted(() => loadData())
  onActivated(() => loadData())

  watch(detailVisible, (visible) => {
    if (visible) {
      activeMainTab.value = String(defaultPhaseCode.value)
    }
  })

  watch(
    () => route.path,
    () => {
      activeMainTab.value = String(defaultPhaseCode.value)
      resetRuntimeState()
      loadData()
    }
  )
</script>

<style scoped>
  .business-list-page {
    :deep(.art-table-card .el-card__body) {
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    :deep(.art-table-card .art-table) {
      flex: 1;
      min-height: 0;
    }
  }

  .org-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .org-summary__item {
    display: flex;
    gap: 12px;
    align-items: center;
    min-height: 76px;
    padding: 14px 16px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .org-summary__icon {
    display: grid;
    flex: 0 0 38px;
    place-items: center;
    width: 38px;
    height: 38px;
    font-size: 20px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 8px;
  }

  .org-summary__icon.is-success {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .org-summary__icon.is-info {
    color: var(--el-color-info);
    background: var(--el-fill-color-light);
  }

  .org-summary__icon.is-warning {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  .org-summary__value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
    color: var(--el-text-color-primary);
  }

  .org-summary__label {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .org-name-cell {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .org-name-cell__icon {
    display: grid;
    flex: 0 0 34px;
    place-items: center;
    width: 34px;
    height: 34px;
    font-size: 18px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 8px;
  }

  .org-name-cell__content {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.45;
  }

  .org-name-cell__content strong,
  .org-name-cell__content span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .org-name-cell__content span,
  .org-contact-cell span,
  .org-scale-cell {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .org-contact-cell,
  .org-service-cell,
  .org-scale-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .org-contact-cell a {
    color: var(--el-color-primary);
  }

  .org-service-cell__package {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .org-scale-cell strong {
    color: var(--el-text-color-primary);
  }

  @media (width <= 1200px) {
    .org-summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 768px) {
    .org-summary {
      grid-template-columns: 1fr;
    }
  }
</style>
