<!-- 最近交易时间线 -->
<template>
  <ArtTimelineListCard
    :list="timelineData"
    title="最近交易"
    subtitle="今日订单动态"
    class="h-[27.8rem] mb-5 max-sm:mb-4"
    :loading="loading"
  />
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { fetchDataCenterStats } from '@/api/data-center'

  interface TimelineItem {
    time: string
    status: string
    content: string
    code?: string
  }

  const loading = ref(false)
  const timelineData = ref<TimelineItem[]>([])

  const STATUS_COLORS: Record<string, string> = {
    SUBMITTED: 'rgb(73, 190, 255)',
    PENDING_RISK_PRE: 'rgb(54, 158, 255)',
    RISK_PRE_PASSED: 'rgb(103, 232, 207)',
    PENDING_FIRST_REVIEW: 'rgb(255, 193, 7)',
    FIRST_REVIEW_PASSED: 'rgb(103, 232, 207)',
    PENDING_SUPPLEMENT: 'rgb(255, 193, 7)',
    PENDING_SIGN: 'rgb(54, 158, 255)',
    SIGNED: 'rgb(103, 232, 207)',
    DISBURSED: 'rgb(103, 232, 207)',
    CANCELLED: 'rgb(255, 105, 105)',
  }

  const PHASE_LABELS: Record<number, string> = {
    1100: '身份证录入',
    1110: '车辆信息录入',
    1200: '征信/申请提交',
    2000: '审批处理',
    3000: '补件处理',
    4000: '签约阶段',
    5000: '放款阶段',
  }

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr)
    const h = d.getHours()
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h < 12 ? '上午' : '下午'} ${h}:${m}`
  }

  async function loadRecentTransactions() {
    loading.value = true
    try {
      const res = await fetchDataCenterStats()
      const data = res?.data || res || {}

      // 从趋势数据中提取最近活动
      const trends = data.trends || []
      const phases = data.phases || []
      const statuses = data.statuses || []

      const items: TimelineItem[] = []

      // 用阶段数据生成时间线
      if (phases.length > 0) {
        const now = new Date()
        phases
          .filter((p: any) => p.count > 0)
          .slice(0, 4)
          .forEach((p: any, i: number) => {
            const label = PHASE_LABELS[p.code] || p.name || `阶段${p.code}`
            items.push({
              time: formatTime(new Date(now.getTime() - i * 3600000).toISOString()),
              status: 'rgb(54, 158, 255)',
              content: `${label} ${p.count}件待处理`,
            })
          })
      }

      // 用状态数据补充
      if (statuses.length > 0) {
        statuses
          .filter((s: any) => s.count > 0)
          .slice(0, 2)
          .forEach((s: any) => {
            items.push({
              time: '实时',
              status: STATUS_COLORS[s.status] || 'rgb(54, 158, 255)',
              content: `${s.status} 状态 ${s.count}件`,
            })
          })
      }

      if (items.length > 0) {
        timelineData.value = items.slice(0, 6)
      } else {
        timelineData.value = [{ time: '-', status: 'rgb(180, 180, 180)', content: '暂无最近交易数据' }]
      }
    } catch (e) {
      console.warn('获取最近交易失败:', e)
      timelineData.value = [{ time: '-', status: 'rgb(180, 180, 180)', content: '暂无最近交易数据' }]
    } finally {
      loading.value = false
    }
  }

  onMounted(loadRecentTransactions)
</script>
