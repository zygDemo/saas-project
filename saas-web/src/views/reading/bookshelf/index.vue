<template>
  <div class="page-content !mb-5">
    <h1 class="text-2xl font-medium mb-5">{{ $t('menus.reading.bookshelf') }}</h1>

    <ElRow justify="space-between" :gutter="10" class="mb-5">
      <ElCol :lg="6" :md="8" :sm="12" :xs="24">
        <ElInput
          v-model="searchVal"
          :prefix-icon="Search"
          clearable
          placeholder="搜索书名/作者"
          @keyup.enter="handleSearch"
        />
      </ElCol>
      <ElCol :lg="6" :md="8" :sm="12" :xs="24" style="display: flex; justify-content: end">
        <ElButton type="primary" @click="$router.push('/reading/books')">管理图书</ElButton>
      </ElCol>
    </ElRow>

    <div class="grid grid-cols-4 gap-5 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-sm:grid-cols-1" v-loading="isLoading">
      <ElCard
        v-for="item in bookshelfList"
        :key="item.id"
        shadow="hover"
        class="cursor-pointer"
        @click="$router.push(`/reading/chapters/${item.id}`)"
      >
        <div class="flex flex-col items-center py-4">
          <img
            v-if="item.cover"
            :src="item.cover"
            class="w-20 h-28 object-cover rounded shadow mb-3"
          />
          <ArtSvgIcon v-else icon="ri:book-2-line" class="text-5xl text-primary mb-3" />
          <h3 class="text-base font-medium text-g-800 text-center line-clamp-1">{{ item.title }}</h3>
          <p class="text-sm text-g-500 mt-1">{{ item.author }}</p>
          <p class="text-xs text-g-400 mt-1">
            {{ item.chapterCount || 0 }} 章 · {{ (item.wordCount || 0).toLocaleString() }} 字
          </p>
        </div>
      </ElCard>
    </div>

    <div class="flex justify-center mt-5">
      <ElEmpty v-if="!isLoading && bookshelfList.length === 0" description="暂无图书数据" />
      <ElPagination
        v-if="total > pageSize"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        background
        layout="prev, pager, next, total"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import { getBooks } from '@/api/reading'

defineOptions({ name: 'ReadingBookshelf' })

const searchVal = ref('')
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const bookshelfList = ref<any[]>([])

const loadBooks = async () => {
  isLoading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchVal.value) params.keyword = searchVal.value
    const res = (await getBooks(params)) as any
    bookshelfList.value = res?.items || []
    total.value = res?.total || 0
  } catch {
    ElMessage.error('加载图书失败')
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadBooks()
}

const handlePageChange = (val: number) => {
  currentPage.value = val
  loadBooks()
}

onMounted(() => {
  loadBooks()
})
</script>