<template>
  <div class="audit-log-page art-full-height">
    <!-- 统计卡片 -->
    <div class="stats-cards mb-5">
      <ElRow :gutter="16">
        <ElCol :span="6">
          <ElCard shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <ElIcon :size="24"><Document /></ElIcon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">总请求数</div>
              </div>
            </div>
          </ElCard>
        </ElCol>
        <ElCol :span="6">
          <ElCard shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon success">
                <ElIcon :size="24"><CircleCheck /></ElIcon>
              </div>
              <div class="stat-info">
                <div class="stat-value text-success">{{ stats.successCount }}</div>
                <div class="stat-label">成功请求</div>
              </div>
            </div>
          </ElCard>
        </ElCol>
        <ElCol :span="6">
          <ElCard shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon fail">
                <ElIcon :size="24"><CircleClose /></ElIcon>
              </div>
              <div class="stat-info">
                <div class="stat-value text-danger">{{ stats.failCount }}</div>
                <div class="stat-label">失败请求</div>
              </div>
            </div>
          </ElCard>
        </ElCol>
        <ElCol :span="6">
          <ElCard shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon rate">
                <ElIcon :size="24"><TrendCharts /></ElIcon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.successRate }}%</div>
                <div class="stat-label">成功率</div>
              </div>
            </div>
          </ElCard>
        </ElCol>
      </ElRow>
    </div>

    <!-- 图表区域 -->
    <ElRow :gutter="20" class="mb-5">
      <ElCol :xl="14" :lg="15" :xs="24">
        <ElCard class="art-card-xs">
          <template #header>
            <div class="card-header">
              <h4>接口调用时段分布</h4>
              <ElTag type="info" size="small">24小时请求量分布</ElTag>
            </div>
          </template>
          <ArtBarChart
            height="280px"
            :data="hourlyChartData"
            :xAxisData="hourlyXAxisData"
            :showAxisLine="false"
            barWidth="60%"
          />
        </ElCard>
      </ElCol>
      <ElCol :xl="10" :lg="9" :xs="24">
        <ElCard class="art-card-xs">
          <template #header>
            <div class="card-header">
              <h4>模块分布</h4>
              <ElTag type="success" size="small">各模块请求占比</ElTag>
            </div>
          </template>
          <ArtRingChart
            height="280px"
            :data="moduleChartData"
            :color="moduleColors"
            :radius="['40%', '65%']"
            :showLegend="true"
            legendPosition="bottom"
            :borderRadius="8"
          />
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 搜索栏 -->
    <AuditLogSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card">
      <!-- 表格头部 -->
      <ArtTableHeader :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElTag type="info" effect="plain">共 {{ pagination.total }} 条记录</ElTag>
            <ElTag type="success" effect="plain">成功 {{ stats.successCount }}</ElTag>
            <ElTag type="danger" effect="plain">失败 {{ stats.failCount }}</ElTag>
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
            <ElDescriptionsItem label="时间">{{
              formatDateTime(currentRow.createdAt)
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="用户">{{ currentRow.userName || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="模块">{{ currentRow.module }}</ElDescriptionsItem>
            <ElDescriptionsItem label="方法">
              <ElTag :type="methodTag(currentRow.action)" effect="dark" size="small">{{
                currentRow.action
              }}</ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="状态码">
              <ElTag :type="statusTagType(currentRow.statusCode)" effect="dark" size="small">
                {{ currentRow.statusCode || '-' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="描述">{{
              currentRow.description || '-'
            }}</ElDescriptionsItem>
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
  import { ref, h, onMounted, reactive, computed } from 'vue'
  import { useTable } from '@/hooks/core/useTable'
  import {
    fetchAuditLogs,
    fetchAuditLogStats,
    type AuditLogItem,
    type AuditLogStats
  } from '@/api/data-center'
  import { ElTag, ElButton } from 'element-plus'
  import { Document, CircleCheck, CircleClose, TrendCharts } from '@element-plus/icons-vue'
  import AuditLogSearch from './modules/audit-log-search.vue'
  import type { BarDataItem } from '@/types/component/chart'

  defineOptions({ name: 'AuditLog' })

  // 统计数据
  const stats = reactive<AuditLogStats>({
    total: 0,
    successCount: 0,
    failCount: 0,
    successRate: 0,
    modules: [],
    actions: [],
    hourly: []
  })

  // 详情弹窗
  const detailVisible = ref(false)
  const currentRow = ref<AuditLogItem | null>(null)

  // 搜索表单
  const searchForm = ref({
    keyword: '',
    module: '',
    action: '',
    userName: '',
    status: ''
  })

  // 24小时分布数据
  const hourlyChartData = computed<BarDataItem[]>(() => [
    {
      name: '请求数',
      data: stats.hourly.map(item => item.count)
    }
  ])
  const hourlyXAxisData = computed(() => stats.hourly.map(item => item.label))

  // 模块分布数据
  const moduleChartData = computed(() =>
    stats.modules.slice(0, 8).map(item => ({
      value: item.count,
      name: item.module
    }))
  )
  const moduleColors = ['#4C87F3', '#93F1B4', '#8BD8FC', '#FFD485', '#FF8A8A', '#C49FFF', '#FFB4A2', '#A8D8EA']

  // 计算接口调用次数
  const moduleCallCounts = computed(() => {
    const counts: Record<string, number> = {}
    stats.modules.forEach(item => {
      counts[item.module] = item.count
    })
    return counts
  })

  // HTTP 方法标签配置
  type ElementTagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'

  const METHOD_TAG_CONFIG: Record<string, { type: ElementTagType }> = {
    GET: { type: 'primary' },
    POST: { type: 'success' },
    PUT: { type: 'warning' },
    PATCH: { type: 'warning' },
    DELETE: { type: 'danger' }
  }

  const methodTag = (method: string): ElementTagType => METHOD_TAG_CONFIG[method]?.type || 'info'

  // 状态码标签类型
  const statusTagType = (statusCode?: number) => {
    if (!statusCode) return 'info' as const
    if (statusCode >= 200 && statusCode < 300) return 'success' as const
    if (statusCode >= 400 && statusCode < 500) return 'warning' as const
    if (statusCode >= 500) return 'danger' as const
    return 'info' as const
  }

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

  // 获取统计数据
  const loadStats = async () => {
    try {
      const result = await fetchAuditLogStats()
      Object.assign(stats, result)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
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
          prop: 'callCount',
          label: '调用次数',
          width: 100,
          formatter: (row: AuditLogItem) => {
            const count = moduleCallCounts.value[row.module] || 0
            return h(
              ElTag,
              { 
                type: count > 100 ? 'danger' : count > 50 ? 'warning' : 'success', 
                effect: 'dark', 
                size: 'small' 
              },
              () => count
            )
          }
        },
        {
          prop: 'action',
          label: '方法',
          width: 90,
          formatter: (row: AuditLogItem) =>
            h(
              ElTag,
              { type: methodTag(row.action), effect: 'dark', size: 'small' },
              () => row.action
            )
        },
        {
          prop: 'statusCode',
          label: '状态码',
          width: 100,
          formatter: (row: AuditLogItem) => {
            const code = row.statusCode
            if (!code) return h('span', { class: 'text-secondary' }, '-')
            const type = statusTagType(code)
            return h(ElTag, { type, effect: 'dark', size: 'small' }, () => code)
          }
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
    loadStats()
  }

  // 初始化
  onMounted(() => {
    loadStats()
  })
</script>

<style scoped>
  .stats-cards {
    margin-bottom: 16px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.success {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }

      &.fail {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.rate {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
      color: var(--el-text-color-primary);
    }

    .stat-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-header h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .text-success {
    color: #67c23a;
  }

  .text-danger {
    color: #f56c6c;
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
  }
</style>
