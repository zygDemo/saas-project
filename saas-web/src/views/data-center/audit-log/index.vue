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

    <ElCard class="art-table-card" style="margin-top: 0">
      <ElTable v-loading="loading" :data="records" row-key="id" border stripe>
        <ElTableColumn prop="id" label="ID" width="90" />
        <ElTableColumn prop="createdAt" label="时间" min-width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </ElTableColumn>
        <ElTableColumn prop="userName" label="用户" width="130">
          <template #default="{ row }">{{ row.userName || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn prop="module" label="模块" width="140" />
        <ElTableColumn prop="action" label="方法" width="90">
          <template #default="{ row }">
            <ElTag :type="methodTag(row.action)" effect="light">{{ row.action }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="description" label="描述" min-width="280" show-overflow-tooltip />
        <ElTableColumn prop="ip" label="IP" min-width="140" show-overflow-tooltip />
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton link type="primary" @click="openDetail(row)">详情</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="flex justify-end mt-4">
        <ElPagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </ElCard>

    <ElDrawer v-model="detailVisible" title="日志详情" size="680px">
      <ElDescriptions v-if="currentRow" :column="1" border>
        <ElDescriptionsItem label="时间">{{ formatDateTime(currentRow.createdAt) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="用户">{{ currentRow.userName || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="模块">{{ currentRow.module }}</ElDescriptionsItem>
        <ElDescriptionsItem label="方法">{{ currentRow.action }}</ElDescriptionsItem>
        <ElDescriptionsItem label="描述">{{ currentRow.description || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="IP">{{ currentRow.ip || '-' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="User Agent">{{ currentRow.userAgent || '-' }}</ElDescriptionsItem>
      </ElDescriptions>
      <ElDivider>请求数据</ElDivider>
      <pre class="json-block">{{ stringify(currentRow?.requestData) }}</pre>
      <ElDivider>响应数据</ElDivider>
      <pre class="json-block">{{ stringify(currentRow?.responseData) }}</pre>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
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
      const [startAt, endAt] = dateRange.value
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

  function stringify(value: unknown) {
    if (value === undefined || value === null || value === '') return '-'
    if (typeof value === 'string') return value
    return JSON.stringify(value, null, 2)
  }

  function formatDateTime(value?: string) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('zh-CN', { hour12: false })
  }

  function methodTag(method: string) {
    if (method === 'GET') return 'primary'
    if (method === 'POST') return 'success'
    if (method === 'DELETE') return 'danger'
    return 'warning'
  }

  onMounted(loadData)
</script>

<style scoped>
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

  .json-block {
    max-height: 280px;
    padding: 14px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    background: var(--el-fill-color-light);
    border-radius: 8px;
  }
</style>
