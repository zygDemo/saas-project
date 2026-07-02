<template>
  <div class="business-list-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="searchFormModel"
      :items="searchFormItems"
      :span="6"
      @search="handleArtSearch"
      @reset="handleArtReset"
    />

    <ElCard class="art-table-card">
      <!-- 表格头部 -->
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

    <!-- 新增/编辑弹窗 -->
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

    <!-- 业务动作弹窗 -->
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

    <!-- 详情抽屉 -->
    <ElDrawer
      v-model="detailVisible"
      :title="`${displayTitle}详情`"
      :size="hasPhaseTabs ? '85%' : '640px'"
      :with-header="true"
    >
      <!-- 阶段模块：增强视图，带标签页 -->
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
        <ElTabs v-model="activeMainTab" class="detail-drawer__main-tabs">
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
              <!-- 阶段特定操作按钮 -->
              <div v-if="phase.actions && phase.actions.length" class="phase-actions">
                <ElButton
                  v-for="action in phase.actions"
                  :key="action.name"
                  :type="(action.type || 'primary') as any"
                  :disabled="!action.visible(currentRow)"
                  @click="openAction(currentRow, action)"
                >
                  {{ action.label }}
                </ElButton>
              </div>
              <div v-for="group in phase.groups" :key="group.nodeCode" class="phase-fields__group">
                <div class="phase-fields__group-title">{{ group.nodeName }}</div>
                <!-- 文件节点：图片/PDF/音视频回显 -->
                <template v-if="isFileGroup(group)">
                  <div class="file-gallery">
                    <div
                      v-for="file in fileGroupFiles(group)"
                      :key="file.id"
                      class="file-gallery__item"
                      @click="previewFile(file)"
                    >
                      <!-- 图片 -->
                      <img
                        v-if="file.displayType === 'image'"
                        :src="file.fileUrl"
                        :alt="file.fileTypeName"
                        class="file-gallery__img"
                      />
                      <!-- PDF -->
                      <div
                        v-else-if="file.displayType === 'pdf'"
                        class="file-gallery__icon file-gallery__icon--pdf"
                      >
                        <ArtSvgIcon icon="ri:file-pdf-2-line" class="file-gallery__icon-svg" />
                      </div>
                      <!-- 视频 -->
                      <div
                        v-else-if="file.displayType === 'video'"
                        class="file-gallery__icon file-gallery__icon--video"
                      >
                        <ArtSvgIcon icon="ri:video-line" class="file-gallery__icon-svg" />
                      </div>
                      <!-- 音频 -->
                      <div
                        v-else-if="file.displayType === 'audio'"
                        class="file-gallery__icon file-gallery__icon--audio"
                      >
                        <ArtSvgIcon icon="ri:music-line" class="file-gallery__icon-svg" />
                      </div>
                      <!-- 其他 -->
                      <div v-else class="file-gallery__icon file-gallery__icon--other">
                        <ArtSvgIcon icon="ri:file-3-line" class="file-gallery__icon-svg" />
                      </div>
                      <div class="file-gallery__name">{{ file.fileTypeName || file.fileName }}</div>
                    </div>
                  </div>
                </template>
                <!-- 普通字段 -->
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
      <!-- 非阶段模块：基础视图 -->
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

      <!-- 文件预览弹窗 -->
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
  </div>
</template>

<script setup lang="ts">
  import { computed, h, onActivated, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElTag, ElButton, ElSpace } from 'element-plus'
  import { useBusinessList } from './common/useBusinessList'

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
    moduleName,
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
  interface FileGalleryItem {
    id: string | number
    displayType?: 'image' | 'pdf' | 'video' | 'audio' | 'other' | string
    fileUrl?: string
    fileTypeName?: string
    fileName?: string
  }

  // ==================== 详情增强 ====================
  const hasPhaseTabs = computed(() => phaseNodeTabs.value.length > 0)

  // 详情抽屉 header 统计项（数据驱动）
  const headerStats = computed(() => {
    const row = currentRow.value || {}
    return [
      { label: '申请金额', value: `¥${row.amount || '-'}`, highlight: true },
      { label: '期限', value: `${row.term || '-'}个月` },
      { label: '年利率', value: row.rate ? `${(Number(row.rate) * 100).toFixed(2)}%` : '-' },
      { label: '还款方式', value: row.repaymentMethod || '-' },
      { label: '创建人', value: row.creatorName || '-' },
      { label: '车牌号', value: row.plateNumber || '-' },
      { label: '当前节点', value: row.currentNodeName || '-' }
    ]
  })
  const tagTypes = new Set<ElementTagType>(['primary', 'success', 'warning', 'info', 'danger'])
  const normalizeTagType = (value: unknown): ElementTagType => {
    return tagTypes.has(value as ElementTagType) ? (value as ElementTagType) : 'info'
  }

  const isFileGroup = (group: { fields: Array<{ prop?: string; value?: unknown }> }) => {
    return group.fields.length === 1 && group.fields[0].prop === '_files'
  }

  const fileGroupFiles = (group: { fields: Array<{ value?: unknown }> }): FileGalleryItem[] => {
    const value = group.fields[0]?.value
    return Array.isArray(value) ? (value as FileGalleryItem[]) : []
  }

  // ArtTable columns 配置（依赖 render function，保留在 .vue 中）
  const tableColumns = computed(() => {
    const cols: any[] = [{ type: 'index', width: 60, label: '序号' }]

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

    // 操作列
    cols.push({
      prop: 'operation',
      label: '操作',
      width: isOrgModule.value ? 270 : 360,
      fixed: 'right',
      formatter: (row: Record<string, unknown>) => {
        const buttons: any[] = [
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

  // 生命周期
  onMounted(() => loadData())
  onActivated(() => loadData())

  // 打开详情抽屉时重置标签页状态
  watch(detailVisible, (visible) => {
    if (visible) {
      activeMainTab.value = String(defaultPhaseCode.value)
    }
  })

  // 路由变化时重新加载
  watch(
    () => route.path,
    () => {
      activeMainTab.value = String(defaultPhaseCode.value)
      resetRuntimeState()
      loadData()
    }
  )

  // 文件预览
  const filePreviewVisible = ref(false)
  const filePreviewUrl = ref('')
  const filePreviewType = ref<'image' | 'pdf' | 'video' | 'audio' | 'other'>('other')

  function previewFile(file: any) {
    filePreviewUrl.value = file.fileUrl
    filePreviewType.value = file.displayType
    if (file.displayType === 'video' || file.displayType === 'audio') {
      filePreviewVisible.value = true
    } else {
      window.open(file.fileUrl, '_blank')
    }
  }
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

  .detail-drawer__content {
    padding: 8px 0 24px 0;
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

  /* ========== 增强详情抽屉样式 ========== */
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
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  .detail-drawer__header-identity {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .detail-drawer__order-no {
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    letter-spacing: 0.5px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }

  .detail-drawer__header-summary {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    flex-wrap: wrap;
  }

  .detail-drawer__summary-item {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .detail-drawer__summary-label {
    color: var(--el-text-color-placeholder);
    font-size: 11px;
  }

  .detail-drawer__summary-value {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .detail-drawer__summary-sep {
    color: var(--el-border-color);
    font-size: 11px;
    margin: 0 1px;
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
    font-size: 10px;
    color: var(--el-text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail-drawer__stat-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail-drawer__stat--highlight .detail-drawer__stat-value {
    color: var(--el-color-primary);
  }

  .detail-drawer__main-tabs {
    height: 100%;
  }

  .detail-drawer__main-tabs :deep(.el-tabs__header) {
    margin-bottom: 12px;
  }

  :deep(.el-drawer__header) {
    margin-bottom: 0 !important;
  }

  .detail-drawer__main-tabs :deep(.el-tabs__content) {
    flex: 1;
    min-height: 0;
  }

  .detail-drawer__main-tabs :deep(.el-tab-pane) {
    height: 100%;
  }

  /* ==================== 阶段字段分组 ==================== */
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
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    overflow: hidden;
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

  /* ==================== 文件回显 ==================== */
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
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }
</style>
