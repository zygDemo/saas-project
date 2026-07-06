<template>
  <div class="page-content !mb-5">
    <h1 class="text-2xl font-medium mb-5">阅读统计</h1>

    <!-- 统计卡片 -->
    <ElRow :gutter="16" class="mb-6">
      <ElCol :span="6" v-for="card in statCards" :key="card.title">
        <ElCard shadow="hover" class="stat-card">
          <div class="flex items-center gap-4">
            <div class="stat-icon" :style="{ backgroundColor: card.color + '20', color: card.color }">
              <i :class="card.icon" />
            </div>
            <div>
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.title }}</div>
            </div>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>

    <!-- 热门书籍 -->
    <ElRow :gutter="16" class="mb-6">
      <ElCol :span="12">
        <ElCard shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">热门书籍 TOP 10</span>
              <ElButton link type="primary" @click="$router.push('/reading/books')">查看全部</ElButton>
            </div>
          </template>
          <ElTable :data="hotBooks" stripe size="small">
            <ElTableColumn type="index" width="50" />
            <ElTableColumn label="书名" prop="title" min-width="150" />
            <ElTableColumn label="作者" prop="author" width="100" />
            <ElTableColumn label="阅读量" prop="readCount" width="80" sortable />
          </ElTable>
        </ElCard>
      </ElCol>

      <ElCol :span="12">
        <ElCard shadow="hover">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="font-medium">最新书评</span>
              <ElButton link type="primary" @click="$router.push('/reading/comment')">查看全部</ElButton>
            </div>
          </template>
          <div v-if="recentReviews.length === 0" class="text-gray-400 text-center py-8">暂无书评</div>
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

    <!-- 分类分布 -->
    <ElCard shadow="hover">
      <template #header>
        <span class="font-medium">分类书籍分布</span>
      </template>
      <ElTable :data="categories" stripe size="small">
        <ElTableColumn label="分类" prop="name" min-width="150" />
        <ElTableColumn label="书籍数" width="100">
          <template #default="{ row }">{{ row._count?.books || 0 }}</template>
        </ElTableColumn>
        <ElTableColumn label="占比" min-width="200">
          <template #default="{ row }">
            <ElProgress
              :percentage="categories.length ? Math.round((row._count?.books || 0) / totalBooks * 100) : 0"
              :stroke-width="16"
              :text-inside="true"
            />
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getReadingStatistics, getHotBooks, getBookReviews, getBookCategories } from '@/api/reading'

const stats = ref<any>({})
const hotBooks = ref<any[]>([])
const recentReviews = ref<any[]>([])
const categories = ref<any[]>([])
const totalBooks = computed(() => categories.value.reduce((sum, c) => sum + (c._count?.books || 0), 0))

const statCards = computed(() => [
  { title: '书籍总数', value: stats.value.bookCount || 0, icon: 'ri-book-open-line', color: '#409EFF' },
  { title: '分类数', value: stats.value.categoryCount || 0, icon: 'ri-folder-2-line', color: '#67C23A' },
  { title: '活跃读者', value: stats.value.activeReaderCount || 0, icon: 'ri-user-3-line', color: '#E6A23C' },
  { title: '总阅读量', value: stats.value.totalReads || 0, icon: 'ri-bar-chart-2-line', color: '#F56C6C' },
])

async function fetchAll() {
  const [s, h, r, c] = await Promise.allSettled([
    getReadingStatistics(),
    getHotBooks(10),
    getBookReviews({ pageSize: 5 }),
    getBookCategories(),
  ])
  if (s.status === 'fulfilled') stats.value = s.value?.data || {}
  if (h.status === 'fulfilled') hotBooks.value = h.value?.data || []
  if (r.status === 'fulfilled') recentReviews.value = r.value?.data?.items || []
  if (c.status === 'fulfilled') categories.value = c.value?.data || []
}

onMounted(fetchAll)
</script>

<style scoped>
.stat-card { height: 100%; }
.stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; }
.stat-value { font-size: 28px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--el-text-color-secondary); }
.review-item { padding: 12px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.review-item:last-child { border-bottom: none; }
</style>
