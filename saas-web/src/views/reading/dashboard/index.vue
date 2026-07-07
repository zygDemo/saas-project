<template>
  <ReadingPageShell
    title="阅读统计"
    description="快速查看图书、分类、读者活跃与阅读量概览。"
    icon="ri:bar-chart-2-line"
  >
    <ElRow :gutter="16" class="reading-stat-grid">
      <ElCol :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.title">
        <ArtStatsCard
          :title="card.title"
          :count="card.value"
          :description="card.description"
          :icon="card.icon"
          :icon-style="card.iconStyle"
        />
      </ElCol>
    </ElRow>

    <ElRow :gutter="16" class="reading-dashboard-grid">
      <ElCol :xs="24" :lg="12">
        <ElCard shadow="never" class="reading-dashboard-card">
          <template #header>
            <div class="reading-card-header">
              <span>热门书籍 TOP 10</span>
              <ElButton link type="primary" @click="$router.push('/reading/books')">查看全部</ElButton>
            </div>
          </template>
          <ArtTable :data="hotBooks" :columns="hotBookColumns" :pagination="undefined" size="small" />
        </ElCard>
      </ElCol>

      <ElCol :xs="24" :lg="12">
        <ElCard shadow="never" class="reading-dashboard-card">
          <template #header>
            <div class="reading-card-header">
              <span>最新书评</span>
              <ElButton link type="primary" @click="$router.push('/reading/comment')">查看全部</ElButton>
            </div>
          </template>
          <ElEmpty v-if="recentReviews.length === 0" description="暂无书评" :image-size="90" />
          <div v-for="review in recentReviews" :key="review.id" class="review-item">
            <div class="flex items-center gap-2 mb-1">
              <ElRate :model-value="review.rating" disabled size="small" />
              <span class="text-sm text-gray-500">{{ review.book?.title }}</span>
            </div>
            <div class="text-sm">{{ review.content?.slice(0, 80) || '用户未填写评价内容' }}{{ review.content?.length > 80 ? '...' : '' }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ review.createdAt }}</div>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <ElCard shadow="never" class="reading-dashboard-card">
      <template #header>
        <div class="reading-card-header">
          <span>分类书籍分布</span>
        </div>
      </template>
      <ArtTable :data="categories" :columns="categoryColumns" :pagination="undefined" size="small" />
    </ElCard>
  </ReadingPageShell>
</template>

<script setup lang="ts">
  import { h, ref, computed, onMounted } from 'vue'
  import { ElProgress } from 'element-plus'
  import { getReadingStatistics, getHotBooks, getBookReviews, getBookCategories } from '@/api/reading'
  import ArtStatsCard from '@/components/core/cards/art-stats-card/index.vue'
  import ReadingPageShell from '../components/ReadingPageShell.vue'

  defineOptions({ name: 'ReadingDashboard' })

  const stats = ref<any>({})
  const hotBooks = ref<any[]>([])
  const recentReviews = ref<any[]>([])
  const categories = ref<any[]>([])
  const totalBooks = computed(() => categories.value.reduce((sum, c) => sum + (c._count?.books || 0), 0))

  const statCards = computed(() => [
    { title: '书籍总数', value: stats.value.bookCount || 0, description: '已入库图书', icon: 'ri:book-open-line', iconStyle: 'bg-primary' },
    { title: '分类数', value: stats.value.categoryCount || 0, description: '启用分类', icon: 'ri:folder-2-line', iconStyle: 'bg-success' },
    { title: '活跃读者', value: stats.value.activeReaderCount || 0, description: '近期活跃用户', icon: 'ri:user-3-line', iconStyle: 'bg-warning' },
    { title: '总阅读量', value: stats.value.totalReads || 0, description: '累计阅读次数', icon: 'ri:bar-chart-2-line', iconStyle: 'bg-danger' }
  ])

  const hotBookColumns = computed(() => [
    { type: 'index' as const, width: 56, label: '排名', align: 'center' as const },
    { prop: 'title', label: '书名', minWidth: 160, showOverflowTooltip: true },
    { prop: 'author', label: '作者', width: 110, showOverflowTooltip: true },
    { prop: 'readCount', label: '阅读量', width: 100, sortable: true, align: 'center' as const }
  ])

  const categoryColumns = computed(() => [
    { prop: 'name', label: '分类', minWidth: 180 },
    {
      prop: '_count.books',
      label: '书籍数',
      width: 120,
      align: 'center' as const,
      formatter: (row: any) => row._count?.books || 0
    },
    {
      prop: 'percent',
      label: '占比',
      minWidth: 240,
      formatter: (row: any) =>
        h(ElProgress, {
          percentage: categories.value.length ? Math.round(((row._count?.books || 0) / totalBooks.value) * 100) : 0,
          strokeWidth: 14,
          textInside: true
        })
    }
  ])

  async function fetchAll() {
    const [s, h, r, c] = await Promise.allSettled([
      getReadingStatistics(),
      getHotBooks(10),
      getBookReviews({ pageSize: 5 }),
      getBookCategories(),
    ])
    if (s.status === 'fulfilled') stats.value = s.value?.data || {}
    if (h.status === 'fulfilled') hotBooks.value = Array.isArray(h.value?.data) ? h.value.data : []
    if (r.status === 'fulfilled') recentReviews.value = r.value?.data?.items || []
    if (c.status === 'fulfilled') categories.value = c.value?.data || []
  }

  onMounted(fetchAll)
</script>

<style scoped>
  .reading-stat-grid,
  .reading-dashboard-grid {
    row-gap: 16px;
  }

  .reading-dashboard-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    box-shadow: var(--el-box-shadow-light);
  }

  .reading-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .review-item {
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .review-item:last-child {
    border-bottom: none;
  }
</style>
