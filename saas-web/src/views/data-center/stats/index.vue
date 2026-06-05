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

    <div class="stats-grid">
      <div v-for="card in overviewCards" :key="card.label" class="stat-tile">
        <div class="stat-tile__icon" :class="card.tone">
          <ArtSvgIcon :icon="card.icon" />
        </div>
        <div>
          <div class="stat-tile__value">{{ card.value }}</div>
          <div class="stat-tile__label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <ElCard class="art-card-xs">
        <template #header><h4>流程阶段分布</h4></template>
        <ElTable v-loading="loading" :data="stats.phases" border>
          <ElTableColumn prop="name" label="阶段" min-width="140" />
          <ElTableColumn prop="count" label="订单数" width="120" />
          <ElTableColumn label="占比" min-width="180">
            <template #default="{ row }">
              <ElProgress :percentage="percentage(row.count, totalApplications)" />
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>

      <ElCard class="art-card-xs">
        <template #header><h4>近期开单趋势</h4></template>
        <ElTable v-loading="loading" :data="stats.trends" border>
          <ElTableColumn prop="day" label="日期" width="140" />
          <ElTableColumn prop="count" label="订单数" width="120" />
          <ElTableColumn label="申请金额" min-width="150">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </ElTableColumn>
        </ElTable>
      </ElCard>

      <ElCard class="art-card-xs">
        <template #header><h4>产品排行</h4></template>
        <ElTable v-loading="loading" :data="stats.products" border>
          <ElTableColumn prop="name" label="产品" min-width="160" />
          <ElTableColumn prop="count" label="订单数" width="110" />
          <ElTableColumn label="申请金额" min-width="150">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </ElTableColumn>
        </ElTable>
      </ElCard>

      <ElCard class="art-card-xs">
        <template #header><h4>资方排行</h4></template>
        <ElTable v-loading="loading" :data="stats.funders" border>
          <ElTableColumn prop="name" label="资方" min-width="160" />
          <ElTableColumn prop="count" label="订单数" width="110" />
          <ElTableColumn label="申请金额" min-width="150">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
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
    { label: '订单总数', value: totalApplications.value, icon: 'ri:file-list-3-line', tone: '' },
    { label: '客户总数', value: stats.overview.customerTotal || 0, icon: 'ri:user-heart-line', tone: 'is-info' },
    { label: '已放款订单', value: stats.overview.disbursedCount || 0, icon: 'ri:money-cny-circle-line', tone: 'is-success' },
    { label: '拒绝/取消', value: stats.overview.rejectedCount || 0, icon: 'ri:close-circle-line', tone: 'is-danger' },
    { label: '申请金额', value: money(stats.overview.requestedAmount), icon: 'ri:funds-line', tone: '' },
    { label: '审批金额', value: money(stats.overview.approvedAmount), icon: 'ri:verified-badge-line', tone: 'is-success' },
    { label: '放款金额', value: money(stats.overview.disbursedAmount), icon: 'ri:bank-card-line', tone: 'is-success' },
    { label: '待还金额', value: money(stats.overview.pendingRepaymentAmount), icon: 'ri:refund-2-line', tone: 'is-warning' }
  ])

  async function loadData() {
    loading.value = true
    try {
      const [startAt, endAt] = dateRange.value
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
    return Number(value || 0).toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    })
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
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
  }

  .stat-tile__icon {
    display: grid;
    flex: 0 0 40px;
    place-items: center;
    width: 40px;
    height: 40px;
    font-size: 20px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 8px;
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

  .stat-tile__value {
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
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
  }

  @media (width <= 1200px) {
    .stats-grid,
    .content-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 768px) {
    .stats-grid,
    .content-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
