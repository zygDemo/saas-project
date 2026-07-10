<template>
  <div class="monitor-page art-full-height">
    <!-- 统计卡片 -->
    <ElRow :gutter="20">
      <ElCol :xl="6" :lg="6" :sm="12" :xs="24">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-info/10 text-info">
              <ArtSvgIcon icon="ri:file-list-3-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-g-800">{{ stats.total || 0 }}</div>
              <p class="mt-1 text-sm text-g-500">监控事件总数</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xl="6" :lg="6" :sm="12" :xs="24">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-danger/10 text-danger">
              <ArtSvgIcon icon="ri:close-circle-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-danger">{{ stats.errorCount || 0 }}</div>
              <p class="mt-1 text-sm text-g-500">错误事件</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xl="6" :lg="6" :sm="12" :xs="24">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-warning/10 text-warning">
              <ArtSvgIcon icon="ri:flashlight-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-warning">{{ stats.performanceCount || 0 }}</div>
              <p class="mt-1 text-sm text-g-500">性能告警</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xl="6" :lg="6" :sm="12" :xs="24">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-success/10 text-success">
              <ArtSvgIcon icon="ri:mouse-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-success">{{ stats.actionCount || 0 }}</div>
              <p class="mt-1 text-sm text-g-500">行为埋点</p>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 错误趋势 -->
    <ElCard class="art-card-xs mb-5">
      <template #header>
        <div class="card-header">
          <h4>近24小时错误趋势</h4>
          <ElTag type="info" size="small">按小时统计</ElTag>
        </div>
      </template>
      <div ref="trendChartRef" style="width: 100%; height: 320px"></div>
    </ElCard>

    <!-- 搜索栏 -->
    <MonitorSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <!-- 表格 -->
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElTag type="info" effect="plain">共 {{ pagination.total }} 条记录</ElTag>
            <ElTag type="danger" effect="plain">错误 {{ stats.errorCount || 0 }}</ElTag>
            <ElTag type="warning" effect="plain">性能 {{ stats.performanceCount || 0 }}</ElTag>
            <ElTag type="success" effect="plain">行为 {{ stats.actionCount || 0 }}</ElTag>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        :show-table-header="true"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #action="{ row }">
          <ElButton size="small" @click="showDetail(row)">详情</ElButton>
        </template>
      </ArtTable>

      <ElDrawer v-model="detailVisible" title="监控明细" size="700px" destroy-on-close>
        <template v-if="currentRow">
          <ElDescriptions :column="1" border class="mb-4">
            <ElDescriptionsItem label="ID">{{ currentRow.id }}</ElDescriptionsItem>
            <ElDescriptionsItem label="时间">{{
              formatDateTime(currentRow.createdAt)
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="类型">
              <ElTag :type="typeTagType(currentRow.type)" effect="dark" size="small">{{
                currentRow.type
              }}</ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="事件">{{ currentRow.event || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="页面">{{
              currentRow.page || currentRow.route || '-'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="状态码">
              <ElTag :type="statusTagType(currentRow.statusCode)" effect="dark" size="small">
                {{ currentRow.statusCode || '-' }}
              </ElTag>
            </ElDescriptionsItem>
            <ElDescriptionsItem label="耗时">{{
              currentRow.duration != null ? `${currentRow.duration}ms` : '-'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="IP">{{ currentRow.ip || '-' }}</ElDescriptionsItem>
            <ElDescriptionsItem label="User Agent">
              <div class="ua-text">{{ currentRow.userAgent || '-' }}</div>
            </ElDescriptionsItem>
          </ElDescriptions>

          <ElDivider content-position="left">消息</ElDivider>
          <div class="json-block">{{ currentRow.message || '-' }}</div>

          <ElDivider v-if="currentRow.stack" content-position="left">堆栈</ElDivider>
          <div v-if="currentRow.stack" class="json-block">{{ currentRow.stack }}</div>
        </template>
      </ElDrawer>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted, reactive, watch } from 'vue'
  import { useTable } from '@/hooks/core/useTable'
  import { echarts, graphic } from '@/plugins/echarts'
  import {
    fetchMonitorLogs,
    fetchMonitorStats,
    type MonitorLogItem,
    type MonitorStats
  } from '@/api/monitor'
  import { ElTag, ElButton } from 'element-plus'
  import MonitorSearch from './modules/monitor-search.vue'

  defineOptions({ name: 'Monitor' })

  const stats = reactive<MonitorStats>({
    total: 0,
    errorCount: 0,
    performanceCount: 0,
    actionCount: 0,
    hourly: [],
    sourceBreakdown: []
  })

  const detailVisible = ref(false)
  const currentRow = ref<MonitorLogItem | null>(null)
  const searchForm = ref({
    keyword: '',
    module: 'frontend-monitor',
    event: '',
    statusCode: ''
  })

  const trendChartRef = ref<HTMLElement>()
  let trendChart: echarts.ECharts | null = null

  const columns = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'createdAt', label: '时间', width: 180 },
    { prop: 'type', label: '类型', width: 120 },
    { prop: 'event', label: '事件', minWidth: 220 },
    { prop: 'page', label: '页面', width: 180 },
    { prop: 'statusCode', label: '状态码', width: 100 },
    { prop: 'duration', label: '耗时', width: 110 },
    { prop: 'ip', label: 'IP', width: 140 },
    { prop: 'action', label: '操作', width: 100, fixed: 'right' }
  ]

  const { loading, data, pagination, refreshData, handleSizeChange, handleCurrentChange } =
    useTable({
      core: {
        apiFn: fetchMonitorLogs,
        immediate: true
      }
    })

  const handleSearch = () => {
    refreshData()
  }

  const resetSearchParams = () => {
    searchForm.value = {
      keyword: '',
      module: 'frontend-monitor',
      event: '',
      statusCode: ''
    }
    refreshData()
  }

  const typeTagType = (type?: string) => {
    if (type === 'error') return 'danger'
    if (type === 'performance') return 'warning'
    if (type === 'action') return 'success'
    if (type === 'request-error') return 'danger'
    return 'info'
  }

  const statusTagType = (statusCode?: number) => {
    if (!statusCode) return 'info'
    if (statusCode >= 200 && statusCode < 300) return 'success'
    if (statusCode >= 400 && statusCode < 500) return 'warning'
    if (statusCode >= 500) return 'danger'
    return 'info'
  }

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

  const showDetail = (row: Record<string, unknown>) => {
    currentRow.value = row as unknown as MonitorLogItem
    detailVisible.value = true
  }

  const loadStats = async () => {
    try {
      const result = await fetchMonitorStats({
        module: searchForm.value.module
      })
      Object.assign(stats, result)
      updateTrendChart()
    } catch (error) {
      console.error('获取监控统计失败:', error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const initTrendChart = () => {
    if (trendChartRef.value && !trendChart) {
      trendChart = echarts.init(trendChartRef.value)
    }
  }

  const updateTrendChart = () => {
    if (!trendChart || !stats.hourly?.length) return

    const hours = stats.hourly.map((item) => item.label)
    const counts = stats.hourly.map((item) => item.count)
    const attackCounts = stats.hourly.map((item) => item.attackCount)

    trendChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } }
      },
      legend: {
        data: ['监控事件', '错误事件'],
        top: 0,
        right: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '40px',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: hours,
          axisTick: { alignWithLabel: true },
          axisLabel: { interval: 2, fontSize: 10 }
        }
      ],
      yAxis: [
        {
          type: 'value',
          name: '事件数',
          position: 'left',
          axisLabel: { fontSize: 10 }
        }
      ],
      series: [
        {
          name: '监控事件',
          type: 'bar',
          barWidth: '60%',
          data: counts,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4C87F3' },
              { offset: 1, color: '#8BD8FC' }
            ])
          }
        },
        {
          name: '错误事件',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: attackCounts,
          lineStyle: { color: '#f56c6c', width: 3 },
          itemStyle: { color: '#f56c6c', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.02)' }
            ])
          }
        }
      ]
    })
  }

  watch(
    () => stats.hourly,
    () => updateTrendChart()
  )

  onMounted(() => {
    loadStats()
  })

  onUnmounted(() => {
    trendChart?.dispose()
    trendChart = null
  })
</script>

<style scoped lang="scss">
  .ua-text {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    word-break: break-all;
  }

  .json-block {
    padding: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    word-break: break-all;
    white-space: pre-wrap;
    background: #f5f7fa;
    border-radius: 6px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
