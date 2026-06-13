<template>
  <div class="data-stats-page art-full-height">
    <ElCard class="art-card-xs mb-4">
      <template #header>
        <div class="page-header">
          <div>
            <h3>数据统计</h3>
            <p>业务规模、流程分布、金额与近期开单趋势</p>
          </div>
          <ElButton :loading="loading" type="primary" @click="loadData">
            <ArtSvgIcon icon="ri:refresh-line" class="mr-1" />
            刷新
          </ElButton>
        </div>
      </template>
      <ElSpace wrap>
        <ElDatePicker
          v-model="dateRange"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width: 380px"
        />
        <ElButton type="primary" @click="loadData">
          <ArtSvgIcon icon="ri:search-line" class="mr-1" />
          查询
        </ElButton>
        <ElButton @click="resetRange">
          <ArtSvgIcon icon="ri:restart-line" class="mr-1" />
          重置
        </ElButton>
      </ElSpace>
    </ElCard>

    <!-- 概览卡片 -->
    <div class="stats-grid">
      <div v-for="card in overviewCards" :key="card.label" class="stat-tile">
        <div class="stat-tile__icon" :class="card.tone">
          <ArtSvgIcon :icon="card.icon" />
        </div>
        <div class="stat-tile__content">
          <div class="stat-tile__value">{{ card.value }}</div>
          <div class="stat-tile__label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="content-grid">
      <ElCard class="art-card-xs">
        <template #header>
          <div class="card-header">
            <h4>流程阶段分布</h4>
            <ElTag type="info" size="small">共 {{ totalApplications }} 单</ElTag>
          </div>
        </template>
        <ArtTable
          :loading="loading"
          :data="stats.phases"
          :columns="phaseColumns"
          :show-table-header="false"
          empty-text="暂无数据"
        />
      </ElCard>

      <ElCard class="art-card-xs">
        <template #header>
          <div class="card-header">
            <h4>近期开单趋势</h4>
            <ElTag type="success" size="small">最近 {{ stats.trends.length }} 天</ElTag>
          </div>
        </template>
        <ArtTable
          :loading="loading"
          :data="stats.trends"
          :columns="trendColumns"
          :show-table-header="false"
          empty-text="暂无数据"
        />
      </ElCard>

      <ElCard class="art-card-xs">
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

      <ElCard class="art-card-xs">
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
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, h, onMounted, reactive, ref } from 'vue'
  import { ElProgress } from 'element-plus'
  import { fetchDataCenterStats, type DataCenterStats } from '@/api/data-center'

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

  const overviewCards = computed(() => [
    {
      label: '订单总数',
      value: totalApplications.value,
      icon: 'ri:file-list-3-line',
      tone: ''
    },
    {
      label: '客户总数',
      value: stats.overview.customerTotal || 0,
      icon: 'ri:user-heart-line',
      tone: 'is-info'
    },
    {
      label: '线索总数',
      value: stats.overview.leadTotal || 0,
      icon: 'ri:user-search-line',
      tone: 'is-info'
    },
    {
      label: '已放款订单',
      value: stats.overview.disbursedCount || 0,
      icon: 'ri:money-cny-circle-line',
      tone: 'is-success'
    },
    {
      label: '拒绝/取消',
      value: stats.overview.rejectedCount || 0,
      icon: 'ri:close-circle-line',
      tone: 'is-danger'
    },
    {
      label: '通过率',
      value: (stats.overview.passRate || 0) + '%',
      icon: 'ri:percent-line',
      tone: ''
    },
    {
      label: '申请金额',
      value: money(stats.overview.requestedAmount),
      icon: 'ri:funds-line',
      tone: ''
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

  // 流程阶段分布列配置
  const phaseColumns = computed(() => [
    { prop: 'name', label: '阶段', minWidth: 140 },
    {
      prop: 'count',
      label: '订单数',
      width: 100,
      align: 'center',
      formatter: (row: { count: number }) => h('span', { class: 'number-value' }, row.count)
    },
    {
      label: '占比',
      minWidth: 160,
      formatter: (row: { count: number }) =>
        h('div', { class: 'progress-cell' }, [
          h(ElProgress, {
            percentage: percentage(row.count, totalApplications.value),
            strokeWidth: 8,
            format: (p: number) => p + '%'
          })
        ])
    }
  ])

  // 近期开单趋势列配置
  const trendColumns = computed(() => [
    { prop: 'day', label: '日期', width: 130 },
    {
      prop: 'count',
      label: '订单数',
      width: 100,
      align: 'center',
      formatter: (row: { count: number }) => h('span', { class: 'number-value' }, row.count)
    },
    {
      label: '申请金额',
      minWidth: 150,
      formatter: (row: { amount: number }) => h('span', { class: 'money-value' }, money(row.amount))
    }
  ])

  // 产品排行列配置
  const productColumns = computed(() => [
    {
      type: 'index',
      label: '排名',
      width: 70,
      align: 'center',
      formatter: (row: any, column: any, value: any, index: number) =>
        h('div', { class: ['rank-badge', index < 3 ? 'rank-top' : ''] }, index + 1)
    },
    { prop: 'name', label: '产品', minWidth: 160 },
    {
      prop: 'count',
      label: '订单数',
      width: 100,
      align: 'center',
      formatter: (row: { count: number }) => h('span', { class: 'number-value' }, row.count)
    },
    {
      label: '申请金额',
      minWidth: 150,
      formatter: (row: { amount: number }) => h('span', { class: 'money-value' }, money(row.amount))
    }
  ])

  // 资方排行列配置
  const funderColumns = computed(() => [
    {
      type: 'index',
      label: '排名',
      width: 70,
      align: 'center',
      formatter: (row: any, column: any, value: any, index: number) =>
        h('div', { class: ['rank-badge', index < 3 ? 'rank-top' : ''] }, index + 1)
    },
    { prop: 'name', label: '资方', minWidth: 160 },
    {
      prop: 'count',
      label: '订单数',
      width: 100,
      align: 'center',
      formatter: (row: { count: number }) => h('span', { class: 'number-value' }, row.count)
    },
    {
      label: '申请金额',
      minWidth: 150,
      formatter: (row: { amount: number }) => h('span', { class: 'money-value' }, money(row.amount))
    }
  ])

  async function loadData() {
    loading.value = true
    try {
      const [startAt, endAt] = dateRange.value || []
      const result = await fetchDataCenterStats({ startAt, endAt })
      Object.assign(stats, result)
    } finally {
      loading.value = false
    }
  }

  function resetRange() {
    dateRange.value = []
    loadData()
  }

  function percentage(value: number, total: number) {
    if (!total) return 0
    return Number(((value / total) * 100).toFixed(1))
  }

  function money(value: unknown) {
    const num = Number(value || 0)
    if (num === 0) return '¥0.00'
    return num.toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    })
  }

  onMounted(loadData)
</script>

<style scoped>
  .data-stats-page {
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat-tile {
    display: flex;
    gap: 12px;
    align-items: center;
    min-height: 82px;
    padding: 14px 16px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: all 0.3s;
  }

  .stat-tile:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: var(--el-box-shadow-light);
  }

  .stat-tile__icon {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 44px;
    height: 44px;
    font-size: 22px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 10px;
  }

  .stat-tile__icon.is-success {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .stat-tile__icon.is-warning {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  .stat-tile__icon.is-danger {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  .stat-tile__icon.is-info {
    color: var(--el-color-info);
    background: var(--el-fill-color-light);
  }

  .stat-tile__content {
    flex: 1;
    min-width: 0;
  }

  .stat-tile__value {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stat-tile__label {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .content-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-header h4 {
    font-size: 15px;
  }

  .number-value {
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .money-value {
    font-weight: 600;
    color: var(--el-color-success);
  }

  .progress-cell {
    padding-right: 12px;
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

  @media (width <= 1400px) {
    .stats-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (width <= 1200px) {
    .stats-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .content-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (width <= 768px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
