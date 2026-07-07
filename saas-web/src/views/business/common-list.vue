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

    <ElDialog
      v-model="formVisible"
      :title="formMode === 'create' ? `新增${displayTitle}` : `编辑${displayTitle}`"
      width="680px"
    >
      <ElForm label-width="130px" class="business-form">
        <template v-for="(field, index) in formFields" :key="field.prop">
          <div v-if="shouldShowFieldGroup(field, index)" class="business-form__section">{{
            field.group
          }}</div>
          <ElFormItem :label="field.label" :required="field.required">
            <ElInputNumber
              v-if="field.type === 'number'"
              v-model="formModel[field.prop] as number"
              :min="0"
              :precision="field.precision"
              controls-position="right"
              style="width: 100%"
            >
              <template v-if="field.unit" #suffix>{{ field.unit }}</template>
            </ElInputNumber>
            <ElSelect
              v-else-if="field.type === 'select'"
              v-model="formModel[field.prop]"
              clearable
              filterable
              :placeholder="field.placeholder || `请选择${field.label}`"
              :loading="Boolean(selectLoading[field.prop])"
              style="width: 100%"
              @change="(value) => handleFieldChange(field, value)"
            >
              <ElOption
                v-for="option in fieldOptions(field)"
                :key="String(option.value)"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <ElSwitch
              v-else-if="field.type === 'switch'"
              v-model="formModel[field.prop] as boolean"
            />
            <ElDatePicker
              v-else-if="field.type === 'date'"
              v-model="formModel[field.prop] as string | number | Date | string[] | undefined"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              :placeholder="field.placeholder || `请选择${field.label}`"
              style="width: 100%"
            />
            <ElInput
              v-else
              v-model="formModel[field.prop] as string"
              clearable
              :autosize="
                field.type === 'json' || field.type === 'textarea'
                  ? { minRows: 3, maxRows: 8 }
                  : undefined
              "
              :placeholder="field.placeholder || `请输入${field.label}`"
              :type="field.type === 'textarea' || field.type === 'json' ? 'textarea' : 'text'"
            />
          </ElFormItem>
        </template>
      </ElForm>
      <template #footer>
        <ElButton @click="formVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitForm">保存</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="actionVisible" :title="activeAction?.label || '业务动作'" width="560px">
      <ElForm label-width="120px" class="business-form">
        <ElFormItem
          v-for="field in actionFields"
          :key="field.prop"
          :label="field.label"
          :required="field.required"
        >
          <ElInputNumber
            v-if="field.type === 'number'"
            v-model="actionModel[field.prop] as number"
            :min="0"
            :precision="field.precision"
            controls-position="right"
            style="width: 100%"
          />
          <ElDatePicker
            v-else-if="field.type === 'date'"
            v-model="actionModel[field.prop] as string | number | Date | string[] | undefined"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
            style="width: 100%"
          />
          <ElInput
            v-else
            v-model="actionModel[field.prop] as string"
            clearable
            :type="field.type === 'textarea' ? 'textarea' : 'text'"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="actionVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitAction">确认执行</ElButton>
      </template>
    </ElDialog>

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
  import { computed, defineAsyncComponent, h, onActivated, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElTag, ElButton, ElSpace } from 'element-plus'
  import { useBusinessList } from './common/useBusinessList'
  import { resolveHeaderStats } from './common/detailHelpers'
  import type { ActionConfig } from './common'

  const BusinessDetailDrawer = defineAsyncComponent(() => import('./common/business-detail-drawer.vue'))

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

  function handleDetailAction(action: ActionConfig) {
    if (currentRow.value) openAction(currentRow.value, action)
  }

  const tableColumns = computed(() => {
    const cols: Array<Record<string, unknown>> = [{ type: 'index', width: 60, label: '序号' }]

    for (const column of config.value.columns) {
      cols.push({
        prop: column.prop,
        label: column.label,
        minWidth: column.width || 140,
        showOverflowTooltip:
          !isOrgModule.value ||
          !['name', 'contactName', 'packageType', 'businessScale'].includes(column.prop),
        formatter: (row: Record<string, unknown>) => {
          if (isOrgModule.value && column.prop === 'name') {
            return h('div', { class: 'org-name-cell' }, [
              h('div', { class: 'org-name-cell__icon' }, [h('i', { class: 'ri-building-2-line' })]),
              h('div', { class: 'org-name-cell__content' }, [
                h('strong', {}, formatCell(row, 'name')),
                h('span', {}, formatCell(row, 'code'))
              ])
            ])
          }
          if (isOrgModule.value && column.prop === 'contactName') {
            return h('div', { class: 'org-contact-cell' }, [
              h('span', {}, formatCell(row, 'contactName')),
              row.contactPhone
                ? h('a', { href: `tel:${row.contactPhone}` }, String(row.contactPhone))
                : h('span', { class: 'text-g-500' }, '未填写联系电话')
            ])
          }
          if (isOrgModule.value && column.prop === 'packageType') {
            return h('div', { class: 'org-service-cell' }, [
              h('span', { class: 'org-service-cell__package' }, formatCell(row, 'packageType')),
              h(
                ElTag,
                {
                  type: formatCell(row, 'expireAt') ? 'warning' : 'info',
                  effect: 'plain',
                  size: 'small'
                },
                () => formatCell(row, 'expireAt')
              )
            ])
          }
          if (isOrgModule.value && column.prop === 'apiEnabled') {
            return h(
              ElTag,
              { type: row.apiEnabled === false ? 'info' : 'success', effect: 'light' },
              () => (row.apiEnabled === false ? '已关闭' : '已开启')
            )
          }
          if (isOrgModule.value && column.prop === 'businessScale') {
            return h('div', { class: 'org-scale-cell' }, [
              h('span', {}, ['部门 ', h('strong', {}, formatCell(row, 'departmentCount'))]),
              h('span', {}, ['产品 ', h('strong', {}, formatCell(row, 'productCount'))]),
              h('span', {}, ['资方 ', h('strong', {}, formatCell(row, 'funderCount'))])
            ])
          }
          if (column.prop === 'status') {
            return h(
              ElTag,
              { type: normalizeTagType(statusTagType(row[column.prop])), effect: 'light' },
              () => formatCell(row, column.prop)
            )
          }
          return h('span', {}, formatCell(row, column.prop))
        }
      })
    }

    cols.push({
      prop: 'operation',
      label: '操作',
      width: isOrgModule.value ? 270 : 360,
      fixed: 'right',
      formatter: (row: Record<string, unknown>) => {
        const buttons: Array<{ label: string; type?: string; visible?: boolean; onClick?: () => void }> = [
          h(ElButton, { link: true, type: 'primary', onClick: () => openDetail(row) }, () => '详情')
        ]
        if (!config.value.readonly) {
          buttons.push(
            h(ElButton, { link: true, type: 'primary', onClick: () => openEdit(row) }, () => '编辑')
          )
          buttons.push(
            h(
              ElButton,
              { link: true, type: 'danger', onClick: () => handleDelete(row) },
              () => '删除'
            )
          )
        }
        for (const action of rowActions(row)) {
          buttons.push(
            h(
              ElButton,
              {
                link: true,
                type: normalizeTagType(action.type || 'success'),
                onClick: () => openAction(row, action)
              },
              () => action.label
            )
          )
        }
        return h(ElSpace, { wrap: true }, () => buttons)
      }
    })

    return cols
  })

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

  .business-form {
    max-height: 62vh;
    padding-right: 10px;
    overflow: auto;
  }

  .business-form__section {
    padding: 12px 0 10px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
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
