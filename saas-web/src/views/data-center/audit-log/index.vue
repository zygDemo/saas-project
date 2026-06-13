<template>
  <div class="audit-log-page art-full-height">
    <ElCard class="art-card-xs mb-4">
      <template #header>
        <div class="page-header">
          <div>
            <h3>日志审计</h3>
            <p>接口访问、操作动作、请求摘要与响应摘要</p>
          </div>
          <ElButton :loading="loading" type="primary" @click="loadData">
            <ArtSvgIcon icon="ri:refresh-line" class="mr-1" />
            刷新
          </ElButton>
        </div>
      </template>
      <ElSpace wrap>
        <ElInput
          v-model="query.keyword"
          clearable
          placeholder="关键字"
          style="width: 180px"
          @keyup.enter="handleSearch"
        />
        <ElInput
          v-model="query.module"
          clearable
          placeholder="模块"
          style="width: 150px"
          @keyup.enter="handleSearch"
        />
        <ElSelect v-model="query.action" clearable placeholder="方法" style="width: 120px">
          <ElOption v-for="item in methods" :key="item" :label="item" :value="item" />
        </ElSelect>
        <ElInput
          v-model="query.userName"
          clearable
          placeholder="用户"
          style="width: 150px"
          @keyup.enter="handleSearch"
        />
        <ElDatePicker
          v-model="dateRange"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 380px"
        />
        <ElButton type="primary" @click="handleSearch">
          <ArtSvgIcon icon="ri:search-line" class="mr-1" />
          查询
        </ElButton>
        <ElButton @click="resetSearch">
          <ArtSvgIcon icon="ri:restart-line" class="mr-1" />
          重置
        </ElButton>
      </ElSpace>
    </ElCard>

    <ElCard class="table-card">
      <ElTable
        v-loading="loading"
        :data="records"
        row-key="id"
        border
        stripe
        height="100%"
      >
        <ElTableColumn prop="id" label="ID" width="80" align="center" />
        <ElTableColumn prop="createdAt" label="时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="userName" label="用户" width="110">
          <template #default="{ row }">
            <ElTag v-if="row.userName" size="small">{{ row.userName }}</ElTag>
            <span v-else class="text-secondary">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="module" label="模块" width="130">
          <template #default="{ row }">
            <ElTag type="info" size="small" effect="plain">{{ row.module }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="action" label="方法" width="90" align="center">
          <template #default="{ row }">
            <ElTag :type="methodTag(row.action)" effect="dark" size="small">{{ row.action }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="description" label="描述" min-width="260" show-overflow-tooltip />
        <ElTableColumn prop="ip" label="IP" width="140" show-overflow-tooltip />
        <ElTableColumn label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton link type="primary" size="small" @click="openDetail(row)">详情</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-wrapper">
        <ElPagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          :page-sizes="[20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </ElCard>

    <ElDrawer v-model="detailVisible" title="日志详情" size="700px" destroy-on-close>
      <template v-if="currentRow">
        <ElDescriptions :column="1" border class="mb-4">
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

        <ElDivider content-position="left">
          <ElIcon class="mr-1"><Document /></ElIcon>
          请求数据
        </ElDivider>
        <div class="json-block">{{ formatJson(currentRow?.requestData) }}</div>

        <ElDivider content-position="left">
          <ElIcon class="mr-1"><Document /></ElIcon>
          响应数据
        </ElDivider>
        <div class="json-block">{{ formatJson(currentRow?.responseData) }}</div>
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { Document } from '@element-plus/icons-vue'
  import { fetchAuditLogs, type AuditLogItem } from '@/api/data-center'

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  const loading = ref(false)
  const detailVisible = ref(false)
  const records = ref<AuditLogItem[]>([])
  const currentRow = ref<AuditLogItem | null>(null)
  const dateRange = ref<string[]>([])
  const pagination = reactive({ current: 1, size: 20, total: 0 })
  const query = reactive({
    keyword: '',
    module: '',
    action: '',
    userName: ''
  })

  async function loadData() {
    loading.value = true
    try {
      const [startAt, endAt] = dateRange.value || []
      const result = await fetchAuditLogs({
        current: pagination.current,
        size: pagination.size,
        startAt,
        endAt,
        ...query
      })
      records.value = result.records || []
      pagination.total = result.total || 0
    } finally {
      loading.value = false
    }
  }

  function handleSearch() {
    pagination.current = 1
    loadData()
  }

  function handleSizeChange(size: number) {
    pagination.size = size
    pagination.current = 1
    loadData()
  }

  function handleCurrentChange(current: number) {
    pagination.current = current
    loadData()
  }

  function resetSearch() {
    query.keyword = ''
    query.module = ''
    query.action = ''
    query.userName = ''
    dateRange.value = []
    handleSearch()
  }

  function openDetail(row: AuditLogItem) {
    currentRow.value = row
    detailVisible.value = true
  }

  function formatJson(value: unknown): string {
    if (value === undefined || value === null || value === '') return '-'
    if (typeof value === 'string') {
      // 尝试解析可能被截断的 JSON 字符串
      try {
        // 如果是被截断的字符串（包含 preview 字段），直接返回
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

  function formatDateTime(value?: string) {
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

  function methodTag(method: string) {
    const map: Record<string, string> = {
      GET: 'primary',
      POST: 'success',
      PUT: 'warning',
      PATCH: 'warning',
      DELETE: 'danger'
    }
    return map[method] || 'info'
  }

  onMounted(loadData)
</script>

<style scoped>
  .audit-log-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  h3,
  p {
    margin: 0;
  }

  p {
    margin-top: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .table-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  :deep(.table-card .el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-bottom: 0;
  }

  :deep(.el-table) {
    flex: 1;
    overflow: auto;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
    flex-shrink: 0;
  }

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

  :deep(.el-descriptions) {
    margin-bottom: 0;
  }
</style>
