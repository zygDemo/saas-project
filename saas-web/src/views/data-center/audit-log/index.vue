<template>
  <div class="audit-log-page art-full-height">
    <!-- 统计卡片 -->
    <ElRow :gutter="20">
      <ElCol :xl="5" :lg="5" :sm="12" :xs="24">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-theme/10 text-theme">
              <ArtSvgIcon icon="ri:file-list-3-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-g-800">{{ stats.total }}</div>
              <p class="mt-1 text-sm text-g-500">总请求数</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xl="5" :lg="5" :sm="12" :xs="24">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-success/10 text-success">
              <ArtSvgIcon icon="ri:checkbox-circle-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-success">{{ stats.successCount }}</div>
              <p class="mt-1 text-sm text-g-500">成功请求</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xl="5" :lg="5" :sm="12" :xs="24">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-danger/10 text-danger">
              <ArtSvgIcon icon="ri:close-circle-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-danger">{{ stats.failCount }}</div>
              <p class="mt-1 text-sm text-g-500">失败请求</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xl="4" :lg="4" :sm="12" :xs="24">
        <div class="art-card p-5 mb-5 max-sm:mb-4">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-info/10 text-info">
              <ArtSvgIcon icon="ri:percent-line" class="text-xl" />
            </div>
            <div>
              <div class="text-2xl font-bold text-g-800">{{ stats.successRate }}%</div>
              <p class="mt-1 text-sm text-g-500">成功率</p>
            </div>
          </div>
        </div>
      </ElCol>
      <ElCol :xl="5" :lg="5" :sm="12" :xs="24">
        <div class="art-card p-5 mb-5 max-sm:mb-4 attack-card" @click="showAttackMonitor = true">
          <div class="flex items-center gap-4">
            <div class="size-12 rounded-lg flex-cc bg-warning/10 text-warning">
              <ArtSvgIcon icon="ri:warning-line" class="text-xl" />
            </div>
            <div class="flex-1">
              <div class="text-2xl font-bold text-warning">{{ stats.attackIps?.length || 0 }}</div>
              <p class="mt-1 text-sm text-g-500">异常IP数</p>
            </div>
            <ArtSvgIcon icon="ri:arrow-right-s-line" class="text-lg text-g-400 arrow-icon" />
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 图表区域 -->
    <ElRow :gutter="20" class="mb-5">
      <ElCol :xl="14" :lg="15" :xs="24">
        <ElCard class="art-card-xs">
          <template #header>
            <div class="card-header">
              <h4>接口调用时段分布</h4>
              <ElSpace>
                <ElTag type="info" size="small">正常请求</ElTag>
                <ElTag type="danger" size="small">异常请求</ElTag>
              </ElSpace>
            </div>
          </template>
          <div ref="hourlyChartRef" style="width: 100%; height: 280px"></div>
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
            <ElDescriptionsItem label="IP">
              <ElTag
                :type="isAttackIp(currentRow.ip) ? 'danger' : 'info'"
                effect="dark"
                size="small"
              >
                {{ currentRow.ip || '-' }}
              </ElTag>
            </ElDescriptionsItem>
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

    <!-- 异常IP监控弹窗 -->
    <ElDrawer v-model="showAttackMonitor" title="异常IP监控" size="90%" destroy-on-close>
      <AttackMonitor :stats="stats" />
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { ref, h, onMounted, onUnmounted, reactive, computed, watch } from 'vue'
  import { useTable } from '@/hooks/core/useTable'
  import * as echarts from 'echarts'
  import {
    fetchAuditLogs,
    fetchAuditLogStats,
    type AuditLogItem,
    type AuditLogStats
  } from '@/api/data-center'
  import { ElTag, ElButton } from 'element-plus'
  import AuditLogSearch from './modules/audit-log-search.vue'
  import AttackMonitor from './modules/attack-monitor.vue'

  defineOptions({ name: 'AuditLog' })

  // 统计数据
  const stats = reactive<AuditLogStats>({
    total: 0,
    successCount: 0,
    failCount: 0,
    successRate: 0,
    modules: [],
    actions: [],
    hourly: [],
    attackIps: [],
    burstIps: [],
    loginAttempts: [],
    consecutiveFails: []
  })

  // 弹窗控制
  const detailVisible = ref(false)
  const currentRow = ref<AuditLogItem | null>(null)
  const showAttackMonitor = ref(false)

  // 搜索表单
  const searchForm = ref({
    keyword: '',
    module: '',
    action: '',
    userName: '',
    status: ''
  })

  // 图表引用
  const hourlyChartRef = ref<HTMLElement>()
  let hourlyChart: echarts.ECharts | null = null

  // 模块分布数据
  const moduleChartData = computed(() =>
    stats.modules.slice(0, 8).map((item) => ({
      value: item.count,
      name: item.module
    }))
  )
  const moduleColors = [
    '#4C87F3',
    '#93F1B4',
    '#8BD8FC',
    '#FFD485',
    '#FF8A8A',
    '#C49FFF',
    '#FFB4A2',
    '#A8D8EA'
  ]

  // 计算接口调用次数
  const moduleCallCounts = computed(() => {
    const counts: Record<string, number> = {}
    stats.modules.forEach((item) => {
      counts[item.module] = item.count
    })
    return counts
  })

  // 判断是否为攻击IP
  const isAttackIp = (ip?: string) => {
    if (!ip) return false
    return stats.attackIps?.some((item) => item.ip === ip) || false
  }

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
      updateHourlyChart()
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  // 初始化图表
  function initCharts() {
    if (hourlyChartRef.value) {
      hourlyChart = echarts.init(hourlyChartRef.value)
    }
  }

  // 更新24小时分布图表
  function updateHourlyChart() {
    if (!hourlyChart || !stats.hourly.length) return

    const hours = stats.hourly.map((item) => item.label)
    const counts = stats.hourly.map((item) => item.count)
    const attackCounts = stats.hourly.map((item) => item.attackCount)

    hourlyChart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } }
      },
      legend: {
        data: ['正常请求', '异常请求'],
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
          name: '请求数',
          position: 'left',
          axisLabel: { fontSize: 10 }
        }
      ],
      series: [
        {
          name: '正常请求',
          type: 'bar',
          barWidth: '60%',
          data: counts,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4C87F3' },
              { offset: 1, color: '#8BD8FC' }
            ])
          }
        },
        {
          name: '异常请求',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: attackCounts,
          lineStyle: { color: '#f56c6c', width: 3 },
          itemStyle: { color: '#f56c6c', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
              { offset: 1, color: 'rgba(245, 108, 108, 0.02)' }
            ])
          }
        }
      ]
    })
  }

  // 监听数据变化
  watch(() => stats.hourly, updateHourlyChart)

  // 窗口大小变化
  function handleResize() {
    hourlyChart?.resize()
  }

  // 表格配置
  const {
    columns,
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
      apiParams: { current: 1, size: 20, ...searchForm.value },
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
              : h('span', { class: 'text-g-400' }, '-')
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
          prop: 'ip',
          label: 'IP',
          width: 140,
          formatter: (row: AuditLogItem) => {
            const isAttack = isAttackIp(row.ip)
            return h(
              ElTag,
              {
                type: isAttack ? 'danger' : 'info',
                effect: isAttack ? 'dark' : 'plain',
                size: 'small'
              },
              () => row.ip || '-'
            )
          }
        },
        {
          prop: 'statusCode',
          label: '状态码',
          width: 100,
          formatter: (row: AuditLogItem) => {
            const code = row.statusCode
            if (!code) return h('span', { class: 'text-g-400' }, '-')
            return h(
              ElTag,
              { type: statusTagType(code), effect: 'dark', size: 'small' },
              () => code
            )
          }
        },
        {
          prop: 'description',
          label: '描述',
          minWidth: 260,
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
              { link: true, type: 'primary', size: 'small', onClick: () => openDetail(row) },
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
    initCharts()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    hourlyChart?.dispose()
  })
</script>

<style scoped>
  .attack-card {
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 4px 12px rgba(245, 175, 25, 0.3);
      transform: translateY(-2px);
    }

    .arrow-icon {
      transition: transform 0.3s;
    }

    &:hover .arrow-icon {
      transform: translateX(4px);
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
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
