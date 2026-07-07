<template>
  <ReadingPageShell
    title="书架管理"
    description="统一查看已入库图书的上架状态、阅读热度与章节维护入口。"
    icon="ri:book-2-line"
  >
    <template #actions>
      <ElButton type="primary" @click="$router.push('/reading/books')">管理图书</ElButton>
    </template>

    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="8"
      :show-expand="false"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader :loading="isLoading" @refresh="loadBooks" layout="refresh,size,fullscreen,columns,settings">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="$router.push('/reading/books')">管理图书</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="isLoading"
        :data="bookshelfList"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="paginationOptions"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handlePageChange"
      />
    </ElCard>
  </ReadingPageShell>
</template>

<script setup lang="ts">
  import ReadingPageShell from '../components/ReadingPageShell.vue'
  import { h } from 'vue'
  import { getBooks } from '@/api/reading'
  import { ElMessage, ElTag, ElButton, ElImage } from 'element-plus'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'ReadingBookshelf' })

  interface BookshelfItem {
    id: number
    title: string
    author: string
    cover?: string
    category?: { id: number; name: string } | null
    wordCount?: number
    chapterCount?: number
    rating?: number
    readCount?: number
    status: number
  }

  interface BookListResponse {
    items: BookshelfItem[]
    total: number
  }

  interface BookListParams {
    page: number
    pageSize: number
    keyword?: string
  }

  const router = useRouter()
  const searchForm = reactive({ keyword: '' })
  const isLoading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)

  const bookshelfList = ref<BookshelfItem[]>([])

  // 分页配置
  const pagination = computed(() => ({
    total: total.value,
    current: currentPage.value,
    size: pageSize.value
  }))

  const paginationOptions = {
    pageSizes: [10, 20, 50, 100]
  }

  // ArtTable 列配置
  const columns = computed(() => [
    { type: 'index' as const, width: 60, label: '序号', align: 'center' as const },
    {
      prop: 'cover',
      label: '封面',
      width: 80,
      align: 'center' as const,
      formatter: (row: BookshelfItem) =>
        row.cover
          ? h(ElImage, {
              src: row.cover,
              style: 'width: 40px; height: 56px; object-fit: cover; border-radius: 4px;',
              previewSrcList: [row.cover],
              previewTeleported: true
            })
          : h('span', { class: 'text-gray-400' }, '无图')
    },
    { prop: 'title', label: '书名', minWidth: 200, showOverflowTooltip: true },
    { prop: 'author', label: '作者', width: 120 },
    {
      prop: 'category.name',
      label: '分类',
      width: 100,
      formatter: (row: BookshelfItem) => row.category?.name || '-'
    },
    {
      prop: 'wordCount',
      label: '字数',
      width: 100,
      align: 'center' as const,
      formatter: (row: BookshelfItem) => {
        const count = row.wordCount || 0
        return count >= 10000 ? (count / 10000).toFixed(1) + '万' : count.toLocaleString()
      }
    },
    { prop: 'chapterCount', label: '章节', width: 80, align: 'center' as const },
    {
      prop: 'rating',
      label: '评分',
      width: 80,
      align: 'center' as const,
      formatter: (row: BookshelfItem) => h('span', { class: 'text-orange-500' }, row.rating || '-')
    },
    {
      prop: 'readCount',
      label: '阅读量',
      width: 100,
      align: 'center' as const,
      formatter: (row: BookshelfItem) => {
        const count = row.readCount || 0
        return count >= 10000 ? (count / 10000).toFixed(1) + '万' : count.toLocaleString()
      }
    },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      align: 'center' as const,
      formatter: (row: BookshelfItem) =>
        h(ElTag, { type: row.status === 1 ? 'success' : 'info' }, () =>
          row.status === 1 ? '上架' : '下架'
        )
    },
    {
      prop: 'operation',
      label: '操作',
      width: 120,
      fixed: 'right' as const,
      align: 'center' as const,
      formatter: (row: BookshelfItem) =>
        h('div', [
          h(
            ElButton,
            {
              size: 'small',
              type: 'primary',
              link: true,
              onClick: () => router.push(`/reading/chapters/${row.id}`)
            },
            () => '查看章节'
          )
        ])
    }
  ])

  const loadBooks = async () => {
    isLoading.value = true
    try {
      const params: BookListParams = { page: currentPage.value, pageSize: pageSize.value }
      if (searchForm.keyword) params.keyword = searchForm.keyword
      const res = (await getBooks(params)) as unknown as BookListResponse
      bookshelfList.value = res?.items || []
      total.value = res?.total || 0
    } catch {
      ElMessage.error('加载图书失败')
    } finally {
      isLoading.value = false
    }
  }

  const searchItems = computed(() => [
    {
      label: '关键词',
      key: 'keyword',
      type: 'input',
      placeholder: '搜索书名 / 作者',
      clearable: true
    }
  ])

  const handleSearch = () => {
    currentPage.value = 1
    loadBooks()
  }

  const handleReset = () => {
    searchForm.keyword = ''
    currentPage.value = 1
    loadBooks()
  }

  const handlePageChange = (val: number) => {
    currentPage.value = val
    loadBooks()
  }

  const handleSizeChange = (val: number) => {
    pageSize.value = val
    currentPage.value = 1
    loadBooks()
  }

  onMounted(() => {
    loadBooks()
  })
</script>
