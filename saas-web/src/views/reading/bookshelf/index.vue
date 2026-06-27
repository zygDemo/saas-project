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

    <!-- 表格 -->
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="isLoading" @refresh="loadBooks">
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
  </div>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { Search } from '@element-plus/icons-vue'
  import { getBooks } from '@/api/reading'
  import { ElMessage, ElTag, ElButton, ElImage } from 'element-plus'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'ReadingBookshelf' })

  const router = useRouter()
  const searchVal = ref('')
  const isLoading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const bookshelfList = ref<any[]>([])

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
      formatter: (row: any) =>
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
      formatter: (row: any) => row.category?.name || '-'
    },
    {
      prop: 'wordCount',
      label: '字数',
      width: 100,
      align: 'center' as const,
      formatter: (row: any) => {
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
      formatter: (row: any) => h('span', { class: 'text-orange-500' }, row.rating || '-')
    },
    {
      prop: 'readCount',
      label: '阅读量',
      width: 100,
      align: 'center' as const,
      formatter: (row: any) => {
        const count = row.readCount || 0
        return count >= 10000 ? (count / 10000).toFixed(1) + '万' : count.toLocaleString()
      }
    },
    {
      prop: 'status',
      label: '状态',
      width: 80,
      align: 'center' as const,
      formatter: (row: any) =>
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
      formatter: (row: any) =>
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

  const handleSizeChange = (val: number) => {
    pageSize.value = val
    currentPage.value = 1
    loadBooks()
  }

  onMounted(() => {
    loadBooks()
  })
</script>
