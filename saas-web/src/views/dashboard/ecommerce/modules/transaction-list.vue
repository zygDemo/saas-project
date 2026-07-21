<!-- 最近活动列表 -->
<template>
  <ArtDataListCard
    class="mb-5 max-sm:mb-4"
    :maxCount="4"
    :list="dataList"
    title="最近活动"
    subtitle="订单处理状态"
    :showMoreButton="true"
    :loading="loading"
    @more="handleMore"
  />
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { router } from '@/router'
  import { fetchDataCenterStats } from '@/api/data-center'

  interface TransactionItem {
    title: string
    status: string
    time: string
    class: string
    icon: string
  }

  const loading = ref(false)

  /** 最近活动数据 - 从数据中心获取后展示各阶段订单 */
  const dataList = ref<TransactionItem[]>([
    {
      title: '暂无最近活动',
      status: '等待数据',
      time: '-',
      class: 'bg-theme/12 text-theme',
      icon: 'ri:shopping-bag-4-line'
    }
  ])

  const PHASE_MAP: Record<number, { title: string; icon: string; class: string }> = {
    1100: { title: '身份证录入', icon: 'ri:user-line', class: 'bg-theme/12 text-theme' },
    1110: { title: '车辆信息录入', icon: 'ri:car-line', class: 'bg-secondary/12 text-secondary' },
    1200: { title: '征信/申请', icon: 'ri:file-list-3-line', class: 'bg-warning/12 text-warning' },
    2000: { title: '审批中', icon: 'ri:time-line', class: 'bg-theme/12 text-theme' },
    3000: { title: '补件处理', icon: 'ri:folder-upload-line', class: 'bg-warning/12 text-warning' },
    4000: { title: '签约阶段', icon: 'ri:edit-line', class: 'bg-success/12 text-success' },
    5000: { title: '放款阶段', icon: 'ri:money-cny-circle-line', class: 'bg-success/12 text-success' }
  }

  async function loadRecentActivity() {
    loading.value = true
    try {
      const res = await fetchDataCenterStats()
      const data = res?.data || res || {}
      const phases = data.phases || []

      if (phases.length > 0) {
        dataList.value = phases
          .filter((p: any) => p.count > 0)
          .slice(0, 5)
          .map((p: any) => {
            const info = PHASE_MAP[p.code] || { title: p.name, icon: 'ri:file-line', class: 'bg-theme/12 text-theme' }
            return {
              title: `${info.title} ${p.count}件`,
              status: p.count > 0 ? '进行中' : '已完成',
              time: '实时',
              class: info.class,
              icon: info.icon
            }
          })
      }
    } catch (e) {
      console.warn('获取最近活动失败:', e)
    } finally {
      loading.value = false
    }
  }

  /** 查看更多 → 跳转到订单查询 */
  const handleMore = (): void => {
    router.push({ name: 'BusinessOrderQuery' })
  }

  onMounted(loadRecentActivity)
</script>
