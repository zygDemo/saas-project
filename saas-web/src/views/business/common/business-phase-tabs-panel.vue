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
          <template v-else>
            <template v-for="field in group.fields" :key="field.prop">
              <div v-if="field.type === 'repayment-table'" class="repayment-table-wrap">
                <div class="repayment-table__header">
                  <span class="repayment-table__title">{{ field.label }}</span>
                  <span class="repayment-table__summary">
                    共 {{ field.value?.length || 0 }} 期
                  </span>
                </div>
                <ElTable :data="field.value" stripe border size="small" class="repayment-table"
                  :row-class-name="repaymentRowClass"
                  :header-cell-style="{ background: 'var(--el-color-primary-light-9)', color: 'var(--el-text-color-primary)', fontWeight: '600' }"
                >
                  <ElTableColumn prop="period" label="期数" min-width="55" align="center">
                    <template #default="{ row }">第{{ row.period }}期</template>
                  </ElTableColumn>
                  <ElTableColumn prop="dueDate" label="到期日" min-width="95" align="center">
                    <template #default="{ row }">{{ formatDate(row.dueDate) }}</template>
                  </ElTableColumn>
                  <ElTableColumn prop="principal" label="本金" min-width="80" align="right">
                    <template #default="{ row }">{{ formatMoney(row.principal) }}</template>
                  </ElTableColumn>
                  <ElTableColumn prop="interest" label="利息" min-width="70" align="right">
                    <template #default="{ row }">{{ formatMoney(row.interest) }}</template>
                  </ElTableColumn>
                  <ElTableColumn prop="totalAmount" label="应还总额" min-width="90" align="right">
                    <template #default="{ row }">
                      <span class="repayment-table__amount">{{ formatMoney(row.totalAmount) }}</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="status" label="状态" min-width="75" align="center">
                    <template #default="{ row }">
                      <ElTag :type="repaymentStatusType(row.status)" size="small" effect="plain">
                        {{ repaymentStatusLabel(row.status) }}
                      </ElTag>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="paidTotal" label="已还金额" min-width="85" align="right">
                    <template #default="{ row }">
                      <span :class="{ 'repayment-table__paid': Number(row.paidTotal) > 0 }">
                        {{ formatMoney(row.paidTotal) }}
                      </span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="overdueDays" label="逾期" min-width="55" align="center">
                    <template #default="{ row }">
                      <span v-if="row.overdueDays > 0" class="repayment-table__overdue">
                        {{ row.overdueDays }}天
                      </span>
                      <span v-else>-</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="penaltyAmount" label="罚息" min-width="70" align="right">
                    <template #default="{ row }">
                      <span v-if="Number(row.penaltyAmount) > 0" class="repayment-table__overdue">
                        {{ formatMoney(row.penaltyAmount) }}
                      </span>
                      <span v-else>-</span>
                    </template>
                  </ElTableColumn>
                  <ElTableColumn label="操作" width="70" align="center">
                    <template #default="{ row }">
                      <ElButton
                        v-if="isCurrentPeriod(row, field.value)"
                        type="primary"
                        size="small"
                        link
                        @click="$emit('action', { name: 'register-repayment', planId: row.id, plan: row })"
                      >
                        还款
                      </ElButton>
                    </template>
                  </ElTableColumn>
                </ElTable>
              </div>
              <ElDescriptions v-else :column="2" border size="small">
                <ElDescriptionsItem :label="field.label">
                  {{ field.value }}
                </ElDescriptionsItem>
              </ElDescriptions>
            </template>
          </template>
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

  const _repaymentStatusLabelMap: Record<string, string> = {
    NOT_DUE: '未到期', PAID: '已还清', OVERDUE: '已逾期',
    PARTIAL: '部分还款', PENDING: '待还款', SETTLED: '已结清'
  }
  const _repaymentStatusTypeMap: Record<string, string> = {
    NOT_DUE: 'info', PAID: 'success', OVERDUE: 'danger',
    PARTIAL: 'warning', PENDING: 'warning', SETTLED: 'success'
  }

  function repaymentStatusLabel(status: string) {
    return _repaymentStatusLabelMap[status] || status || '-'
  }
  function repaymentStatusType(status: string) {
    return (_repaymentStatusTypeMap[status] || 'info') as 'success' | 'warning' | 'danger' | 'info'
  }

  function repaymentRowClass({ row }: { row: Record<string, unknown> }) {
    if (row.status === 'OVERDUE') return 'repayment-row--overdue'
    if (row.status === 'PAID' || row.status === 'SETTLED') return 'repayment-row--paid'
    return ''
  }

  function formatDate(val: string | Date | undefined) {
    if (!val) return '-'
    return new Date(val).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }

  function formatMoney(val: string | number | undefined) {
    if (val === undefined || val === null || val === '') return '0.00'
    return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  /** 判断是否为当期（第一个未还清的期次） */
  function isCurrentPeriod(row: Record<string, unknown>, allPlans: Record<string, unknown>[]) {
    if (!allPlans || !allPlans.length) return false
    const status = String(row.status)
    if (status === 'PAID' || status === 'SETTLED') return false
    // 找到第一个未还清的期次
    const firstUnpaid = allPlans.find((p) => {
      const s = String(p.status)
      return s !== 'PAID' && s !== 'SETTLED'
    })
    return firstUnpaid && firstUnpaid.id === row.id
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
    overflow: visible;
  }

  .detail-drawer__main-tabs :deep(.el-tab-pane) {
    height: 100%;
    overflow: visible;
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
    overflow: visible;
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
  }

  .phase-fields__group-title {
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-extra-light) 100%);
    border-bottom: 1px solid var(--el-color-primary-light-8);
    letter-spacing: 0.5px;
  }

  .phase-fields__group :deep(.el-descriptions) {
    border: none;
    border-radius: 0;
  }

  .phase-fields__group :deep(.el-descriptions__body) {
    border: none;
  }

  .phase-fields__group :deep(.el-descriptions__label) {
    font-weight: 500;
    color: var(--el-text-color-secondary);
    width: 90px;
  }

  .phase-fields__group :deep(.el-descriptions__content) {
    color: var(--el-text-color-primary);
    font-size: 13px;
  }

  .repayment-table-wrap {
    padding: 0;
    overflow: visible;
  }

  .repayment-table__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-extra-light) 100%);
    border-bottom: 1px solid var(--el-color-primary-light-8);
    border-radius: 8px 8px 0 0;
  }

  .repayment-table__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .repayment-table__summary {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .repayment-table {
    width: 100%;
  }

  .repayment-table :deep(.el-table__header th) {
    background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-light) 100%);
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding: 10px 0;
    border-bottom: 2px solid var(--el-color-primary-light-5);
  }

  .repayment-table :deep(.el-table__row td) {
    font-size: 13px;
    padding: 8px 0;
  }

  .repayment-table :deep(.el-table__row.el-table__row--striped td) {
    background: var(--el-fill-color-blank);
  }

  .repayment-table__amount {
    font-weight: 700;
    color: var(--el-color-primary);
    font-size: 13px;
  }

  .repayment-table__paid {
    color: var(--el-color-success);
    font-weight: 600;
    font-size: 13px;
  }

  .repayment-table__overdue {
    color: var(--el-color-danger);
    font-weight: 700;
    font-size: 13px;
  }

  :deep(.repayment-row--overdue) {
    background-color: var(--el-color-danger-light-9) !important;
  }

  :deep(.repayment-row--overdue:hover td) {
    background-color: var(--el-color-danger-light-8) !important;
  }

  :deep(.repayment-row--paid) {
    opacity: 0.65;
  }
</style>
