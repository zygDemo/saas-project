<template>
  <div class="audit-log-page art-full-height">
    <!-- 搜索栏 -->
    <AuditLogSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card">
      <!-- 表格头部 -->
      <ArtTableHeader :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElTag type="info" effect="plain">共 {{ pagination.total }} 条记录</ElTag>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        :show-table-header="true"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>

      <!-- 详情弹窗 -->
      <ElDrawer v-model="detailVisible" title="日志详情" size="700px" destroy-on-close>
        <template v-if="currentRow">
          <ElDescriptions :column="1" border class="mb-4">
            <ElDescriptionsItem label="ID">{{ currentRow.id }}</ElDescriptionsItem>
            <ElDescriptionsItem label="时间">{{ formatDateTime(currentRow.createdAt) }}</ElDescriptionsItem>
            <ElDescriptionsItem label="用户">{{ currentRow.userName || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="模块">{{ currentRow.module }}</ElDescriptionsItem>
            <ElDescriptionsItem label="方法">
              <ElTag :type="methodTag(currentRow.action)" effect="dark" size="small">{{ currentRow.action }}</ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="描述">{{ currentRow.description || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="IP">{{ currentRow.ip || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="User Agent">
              <div class="ua-text">{{ currentRow.userAgent || '-' }}</div>
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElDivider content-position="left">请求数据</ElDivider>
          <div class="json-block">{{ formatJson(currentRow.requestData) }}</div>

          <ElDivider content-position="left">响应数据</ElDivider>
          <div class="json-block">{{ formatJson(currentRow.responseData) }}</div>
        </template>
      </ElDrawer>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, h } from 'vue'
  import { useTable } from '@/hooks/core/useTable'
  import { fetchAuditLogs, type AuditLogItem } from '@/api/data-center'
  import { ElTag, ElButton } from 'element-plus'
  import AuditLogSearch from './modules/audit-log-search.vue'

  defineOptions({ name: 'AuditLog' })

  // 详情弹窗
  const detailVisible = ref(false)
  const currentRow = ref<AuditLogItem | null>(null)

  // 搜索表单
  const searchForm = ref({
    keyword: '',
    module: '',
    action: '',
    userName: ''
  })

  // HTTP 方法标签配置
  const METHOD_TAG_CONFIG: Record<string, { type: string }> = {
    GET: { type: 'primary' },
    POST: { type: 'success' },
    PUT: { type: 'warning' },
    PATCH: { type: 'warning' },
    DELETE: { type: 'danger' }
  }

  const methodTag = (method: string) => METHOD_TAG_CONFIG[method]?.type || 'info'

  // 格式化日期时间
  const formatDateTime = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  // 格式化 JSON
  const formatJson = (value: unknown): string => {
    if (value === undefined || value === null || value === '') return '-'
    if (typeof value === 'string') {
      try {
        if (value.includes('"preview"')) {
          const parsed = JSON.parse(value)
          if (parsed.preview) {
            try {
              return JSON.stringify(JSON.parse(parsed.preview), null, 2)
            } catch {
              return parsed.preview
            }
          }
        }
        return JSON.stringify(JSON.parse(value), null, 2)
      } catch {
        return value
      }
    }
    return JSON.stringify(value, null, 2)
  }

  // 打开详情
  const openDetail = (row: AuditLogItem) => {
    currentRow.value = row
    detailVisible.value = true
  }

  // 表格配置
  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    replaceSearchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: fetchAuditLogs,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      },
      columnsFactory: () => [
        { type: 'index', width: 60, label: '序号' },
        {
          prop: 'createdAt',
          label: '时间',
          width: 170,
          formatter: (row: AuditLogItem) => formatDateTime(row.createdAt)
        },
        {
          prop: 'userName',
          label: '用户',
          width: 110,
          formatter: (row: AuditLogItem) =>
            row.userName
              ? h(ElTag, { size: 'small' }, () => row.userName)
              : h('span', { class: 'text-secondary' }, '-')
        },
        {
          prop: 'module',
          label: '模块',
          width: 130,
          formatter: (row: AuditLogItem) =>
            h(ElTag, { type: 'info', size: 'small', effect: 'plain' }, () => row.module)
        },
        {
          prop: 'action',
          label: '方法',
          width: 90,
          formatter: (row: AuditLogItem) =>
            h(ElTag, { type: methodTag(row.action), effect: 'dark', size: 'small' }, () => row.action)
        },
        {
          prop: 'description',
          label: '描述',
          minWidth: 260,
          showOverflowTooltip: true
        },
        {
          prop: 'ip',
          label: 'IP',
          width: 140,
          showOverflowTooltip: true
        },
        {
          prop: 'operation',
          label: '操作',
          width: 80,
          fixed: 'right',
          formatter: (row: AuditLogItem) =>
            h(
              ElButton,
              {
                link: true,
                type: 'primary',
                size: 'small',
                onClick: () => openDetail(row)
              },
              () => '详情'
            )
        }
      ]
    }
  })

  // 搜索处理
  const handleSearch = (params: typeof searchForm.value) => {
    replaceSearchParams(params)
    getData()
  }
</script>

<style scoped>
  .text-secondary {
    color: var(--el-text-color-secondary);
  }

  .ua-text {
    word-break: break-all;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .json-block {
    max-height: 360px;
    padding: 16px;
    overflow: auto;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  :deep(.el-divider) {
    margin: 20px 0 12px;
  }

  :deep(.el-divider__text) {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
</style>
