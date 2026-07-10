<template>
  <div class="data-stats-page art-full-height">
    <!-- 顶部操作栏 -->
    <ElCard class="art-card-xs mb-4">
      <template #header>
        <div class="page-header">
          <div>
            <h3>数据统计</h3>
            <p>业务规模、流程分布、金额与近期开单趋势</p>
          </div>
          <ElSpace>
            <ElDatePicker
              v-model="dateRange"
              type="datetimerange"
              value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 380px"
            />
            <ElButton type="primary" :loading="loading" @click="loadData">
              <ArtSvgIcon icon="ri:search-line" class="mr-1" />
              查询
            </ElButton>
            <ElButton @click="resetRange">
              <ArtSvgIcon icon="ri:restart-line" class="mr-1" />
              重置
            </ElButton>
          </ElSpace>
        </div>
      </template>
    </ElCard>

    <!-- 核心指标卡片（2排） -->
    <ElRow :gutter="16" class="mb-4">
      <ElCol v-for="card in overviewCards" :key="card.label" :xl="6" :lg="6" :sm="12" :xs="12">
        <div class="art-card p-4 mb-3">
          <div class="flex items-center gap-3">
            <div class="stat-icon" :class="card.tone">
              <ArtSvgIcon :icon="card.icon" class="text-lg" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xl font-bold text-g-800 truncate">{{ card.value }}</div>
              <p class="text-xs text-g-500 mt-0.5">{{ card.label }}</p>
            </div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <!-- 图表区域 -->
    <ElRow :gutter="16" class="mb-4">
      <!-- 开单趋势 -->
      <ElCol :xl="14" :lg="14" :xs="24">
        <ElCard class="art-card-xs mb-4">
          <template #header>
            <div class="card-header">
              <h4>开单趋势</h4>
              <ElTag type="success" size="small">最近 {{ stats.trends.length }} 天</ElTag>
            </div>
          </template>
          <div ref="trendChartRef" style="width: 100%; height: 300px"></div>
        </ElCard>
      </ElCol>
      <!-- 流程阶段分布 -->
      <ElCol :xl="10" :lg="10" :xs="24">
        <ElCard class="art-card-xs mb-4">
          <template #header>
            <div class="card-header">
              <h4>流程阶段分布</h4>
              <ElTag type="info" size="small">共 {{ totalApplications }} 单</ElTag>
            </div>
          </template>
          <div ref="phaseChartRef" style="width: 100%; height: 300px"></div>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 排行表格 -->
    <ElRow :gutter="16">
      <ElCol :xl="12" :lg="12" :xs="24">
        <ElCard class="art-card-xs mb-4">
          <template #header>
            <div class="card-header">
              <h4>产品排行</h4>
              <ElTag type="warning" size="small">{{ stats.products.length }} 个产品</ElTag>
            </div>
          </template>
          <ArtTable
            :loading="loading"
            :data="stats.products"
            :columns="productColumns"
            :show-table-header="false"
            empty-text="暂无数据"
          />
        </ElCard>
      </ElCol>
      <ElCol :xl="12" :lg="12" :xs="24">
        <ElCard class="art-card-xs mb-4">
          <template #header>
            <div class="card-header">
              <h4>资方排行</h4>
              <ElTag type="warning" size="small">{{ stats.funders.length }} 个资方</ElTag>
            </div>
          </template>
          <ArtTable
            :loading="loading"
            :data="stats.funders"
            :columns="funderColumns"
            :show-table-header="false"
            empty-text="暂无数据"
          />
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, onMounted, onUnmounted, reactive, ref, nextTick } from 'vue'
  import { fetchDataCenterStats, type DataCenterStats } from '@/api/data-center'
  import { echarts, graphic } from '@/plugins/echarts'

  const loading = ref(false)
  const dateRange = ref<string[]>([])
  const stats = reactive<DataCenterStats>({
    overview: {},
    phases: [],
    statuses: [],
    products: [],
    funders: [],
    trends: []
  })

  const totalApplications = computed(() => Number(stats.overview.applicationTotal || 0))

  // 核心指标（8个，2排x4列）
  const overviewCards = computed(() => [
    {
      label: '订单总数',
      value: totalApplications.value,
      icon: 'ri:file-list-3-line',
      tone: 'is-primary'
    },
    {
      label: '客户总数',
      value: stats.overview.customerTotal || 0,
      icon: 'ri:user-heart-line',
      tone: 'is-info'
    },
    {
      label: '已放款',
      value: stats.overview.disbursedCount || 0,
      icon: 'ri:money-cny-circle-line',
      tone: 'is-success'
    },
    {
      label: '通过率',
      value: (stats.overview.passRate || 0) + '%',
      icon: 'ri:percent-line',
      tone: 'is-primary'
    },
    {
      label: '申请金额',
      value: money(stats.overview.requestedAmount),
      icon: 'ri:funds-line',
      tone: 'is-info'
    },
    {
      label: '审批金额',
      value: money(stats.overview.approvedAmount),
      icon: 'ri:verified-badge-line',
      tone: 'is-success'
    },
    {
      label: '放款金额',
      value: money(stats.overview.disbursedAmount),
      icon: 'ri:bank-card-line',
      tone: 'is-success'
    },
    {
      label: '待还金额',
      value: money(stats.overview.pendingRepaymentAmount),
      icon: 'ri:refund-2-line',
      tone: 'is-warning'
    }
  ])

  // 产品排行列
  const productColumns = computed(() => [
    {
      type: 'index',
      label: '排名',
      width: 70,
      align: 'center',
      formatter: (_row: Record<string, unknown>, _col: unknown, _val: unknown, index: number) =>
        h('div', { class: ['rank-badge', index < 3 ? 'rank-top' : ''] }, String(index + 1))
    },
    { prop: 'name', label: '产品', minWidth: 160 },
    {
      prop: 'count',
      label: '订单数',
      width: 100,
      align: 'center',
      formatter: (row: { count: number }) => h('span', { class: 'number-value' }, String(row.count))
    },
    {
      label: '申请金额',
      minWidth: 150,
      formatter: (row: { amount: number }) => h('span', { class: 'money-value' }, money(row.amount))
    }
  ])

  // 资方排行列
  const funderColumns = computed(() => [
    {
      type: 'index',
      label: '排名',
      width: 70,
      align: 'center',
      formatter: (_row: Record<string, unknown>, _col: unknown, _val: unknown, index: number) =>
        h('div', { class: ['rank-badge', index < 3 ? 'rank-top' : ''] }, String(index + 1))
    },
    { prop: 'name', label: '资方', minWidth: 160 },
    {
      prop: 'count',
      label: '订单数',
      width: 100,
      align: 'center',
      formatter: (row: { count: number }) => h('span', { class: 'number-value' }, String(row.count))
    },
    {
      label: '申请金额',
      minWidth: 150,
      formatter: (row: { amount: number }) => h('span', { class: 'money-value' }, money(row.amount))
    }
  ])

  // ==================== 图表 ====================
  const trendChartRef = ref<HTMLElement>()
  const phaseChartRef = ref<HTMLElement>()
  let trendChart: echarts.ECharts | null = null
  let phaseChart: echarts.ECharts | null = null

  function initCharts() {
    if (trendChartRef.value && !trendChart) trendChart = echarts.init(trendChartRef.value)
    if (phaseChartRef.value && !phaseChart) phaseChart = echarts.init(phaseChartRef.value)
  }

  function updateTrendChart() {
    if (!trendChart || !stats.trends.length) return

    const days = stats.trends.map((item) => item.day)
    const counts = stats.trends.map((item) => item.count)
    const amounts = stats.trends.map((item) => item.amount)

    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['订单数', '申请金额'], top: 0, right: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
      xAxis: { type: 'category', data: days, axisLabel: { fontSize: 10 } },
      yAxis: [
        { type: 'value', name: '订单数', position: 'left', axisLabel: { fontSize: 10 } },
        {
          type: 'value',
          name: '金额(万)',
          position: 'right',
          axisLabel: { fontSize: 10, formatter: (v: number) => (v / 10000).toFixed(0) }
        }
      ],
      series: [
        {
          name: '订单数',
          type: 'bar',
          barWidth: '40%',
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
          name: '申请金额',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: amounts,
          lineStyle: { color: '#67C23A', width: 2 },
          itemStyle: { color: '#67C23A', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: new graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(103, 194, 58, 0.2)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.02)' }
            ])
          }
        }
      ]
    })
  }

  function updatePhaseChart() {
    if (!phaseChart || !stats.phases.length) return

    const phases = stats.phases.filter((item) => item.count > 0)
    const names = phases.map((item) => item.name)
    const counts = phases.map((item) => item.count)

    phaseChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '10%', bottom: '3%', top: '5%', containLabel: true },
      xAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      yAxis: {
        type: 'category',
        data: names,
        axisLabel: { fontSize: 11, width: 80, overflow: 'truncate' }
      },
      series: [
        {
          type: 'bar',
          barWidth: '55%',
          data: counts,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: new graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#8BD8FC' },
              { offset: 1, color: '#4C87F3' }
            ])
          },
          label: {
            show: true,
            position: 'right',
            fontSize: 11,
            formatter: '{c} 单'
          }
        }
      ]
    })
  }

  function handleResize() {
    trendChart?.resize()
    phaseChart?.resize()
  }

  // ==================== 数据加载 ====================
  async function loadData() {
    loading.value = true
    try {
      const [startAt, endAt] = dateRange.value || []
      const result = await fetchDataCenterStats({ startAt, endAt })
      Object.assign(stats, result)
      nextTick(() => {
        initCharts()
        updateTrendChart()
        updatePhaseChart()
      })
    } finally {
      loading.value = false
    }
  }

  function resetRange() {
    dateRange.value = []
    loadData()
  }

  function money(value: unknown) {
    const num = Number(value || 0)
    if (num === 0) return '¥0.00'
    if (num >= 10000) return '¥' + (num / 10000).toFixed(2) + '万'
    return num.toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    })
  }

  onMounted(() => {
    loadData()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    trendChart?.dispose()
    phaseChart?.dispose()
  })
</script>

<style scoped>
  .data-stats-page {
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .page-header {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  h3,
  h4,
  p {
    margin: 0;
  }

  p {
    margin-top: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-header h4 {
    font-size: 15px;
  }

  .stat-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .stat-icon.is-primary {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .stat-icon.is-info {
    color: var(--el-color-info);
    background: var(--el-fill-color-light);
  }

  .stat-icon.is-success {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .stat-icon.is-warning {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  .stat-icon.is-danger {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  /* 表格样式 */
  .number-value {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .money-value {
    font-weight: 600;
    color: var(--el-color-success);
  }

  .rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-radius: 50%;
  }

  .rank-top {
    color: #fff;
    background: linear-gradient(135deg, #f7ba2a, #f56c6c);
  }
</style>
