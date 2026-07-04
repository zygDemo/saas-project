<template>
  <div class="page-content !mb-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-medium">{{ $t('menus.reading.comment') }}</h1>
    </div>

    <!-- 搜索栏 -->
    <ElRow :gutter="10" class="mb-5">
      <ElCol :lg="6" :md="8" :sm="12" :xs="24">
        <ElInput
          v-model="searchVal"
          :prefix-icon="Search"
          clearable
          placeholder="搜索评论内容"
          @keyup.enter="handleSearch"
        />
      </ElCol>
      <ElCol :lg="4" :md="6" :sm="12" :xs="24">
        <ElSelect v-model="statusFilter" placeholder="审核状态" clearable class="w-full">
          <ElOption label="待审核" :value="0" />
          <ElOption label="已通过" :value="1" />
          <ElOption label="已驳回" :value="2" />
        </ElSelect>
      </ElCol>
      <ElCol :lg="4" :md="6" :sm="12" :xs="24">
        <ElButton type="primary" @click="handleSearch">
          <ElIcon class="mr-1"><Search /></ElIcon>
          搜索
        </ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElCol>
    </ElRow>

    <!-- 表格 -->
    <ElCard class="art-table-card">
      <ArtTableHeader :loading="isLoading" @refresh="loadReviews">
        <template #left>
          <ElSpace wrap>
            <ElButton type="primary" @click="handleSearch">刷新</ElButton>
          </ElSpace>
        </template>
      </ArtTableHeader>

      <ArtTable
        :loading="isLoading"
        :data="commentList"
        :columns="columns"
        :pagination="pagination"
        :pagination-options="paginationOptions"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handlePageChange"
      />
    </ElCard>

    <!-- 评论详情弹窗 -->
    <ElDrawer v-model="showDetail" title="评论详情" size="500px">
      <template v-if="currentComment">
        <div class="mb-4">
          <span class="text-sm text-g-500">图书：</span>
          <span>{{ currentComment.bookName }}</span>
        </div>
        <div class="mb-4">
          <span class="text-sm text-g-500">用户：</span>
          <span>{{ currentComment.username }}</span>
        </div>
        <div class="mb-4">
          <span class="text-sm text-g-500">评论时间：</span>
          <span>{{ currentComment.createTime }}</span>
        </div>
        <div class="mb-4">
          <span class="text-sm text-g-500">状态：</span>
          <ElTag
            :type="currentComment.status === 'approved' ? 'success' : currentComment.status === 'pending' ? 'warning' : 'danger'"
          >
            {{ currentComment.status === 'approved' ? '已通过' : currentComment.status === 'pending' ? '待审核' : '已驳回' }}
          </ElTag>
        </div>
        <div>
          <span class="text-sm text-g-500 block mb-2">评论内容：</span>
          <p class="p-3 bg-g-50 rounded">{{ currentComment.content }}</p>
        </div>
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { h } from 'vue'
  import { Search } from '@element-plus/icons-vue'
  import { getBookReviews, updateReviewStatus, deleteReview } from '@/api/reading'
  import { ElMessage, ElMessageBox, ElTag, ElButton } from 'element-plus'

  defineOptions({ name: 'ReadingComment' })

  interface CommentItem {
    id: number
    bookName: string
    content: string
    username: string
    createTime: string
    status: 'pending' | 'approved' | 'rejected'
  }

  interface ReviewApiItem {
    id: number
    content?: string
    status: number
    createdAt?: string
    book?: { title?: string }
    user?: { nickname?: string; username?: string }
  }

  interface ReviewApiResponse {
    items: ReviewApiItem[]
    total: number
  }

  interface ReviewQueryParams {
    page: number
    pageSize: number
    keyword?: string
    status?: number
  }

  interface ApiErrorResponse {
    response?: { data?: { message?: string } }
  }

  const searchVal = ref('')
  const statusFilter = ref<number | undefined>(undefined)
  const isLoading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const showDetail = ref(false)
  const currentComment = ref<CommentItem | null>(null)
  const commentList = ref<CommentItem[]>([])

  const statusMap: Record<number, string> = { 0: 'pending', 1: 'approved', 2: 'rejected' }

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
    { prop: 'bookName', label: '图书', width: 150, showOverflowTooltip: true },
    { prop: 'content', label: '评论内容', minWidth: 300, showOverflowTooltip: true },
    { prop: 'username', label: '评论用户', width: 120 },
    { prop: 'createTime', label: '评论时间', width: 180 },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      align: 'center' as const,
      formatter: (row: CommentItem) =>
        h(
          ElTag,
          {
            type:
              row.status === 'approved'
                ? 'success'
                : row.status === 'pending'
                  ? 'warning'
                  : 'danger'
          },
          () =>
            row.status === 'approved'
              ? '已通过'
              : row.status === 'pending'
                ? '待审核'
                : '已驳回'
        )
    },
    {
      prop: 'operation',
      label: '操作',
      width: 240,
      fixed: 'right' as const,
      align: 'center' as const,
      formatter: (row: CommentItem) => {
        const buttons = []
        if (row.status === 'pending') {
          buttons.push(
            h(
              ElButton,
              { size: 'small', type: 'success', link: true, onClick: () => handleApprove(row) },
              () => '通过'
            ),
            h(
              ElButton,
              { size: 'small', type: 'warning', link: true, onClick: () => handleReject(row) },
              () => '驳回'
            )
          )
        }
        buttons.push(
          h(
            ElButton,
            { size: 'small', type: 'primary', link: true, onClick: () => handleView(row) },
            () => '查看'
          ),
          h(
            ElButton,
            { size: 'small', type: 'danger', link: true, onClick: () => handleDelete(row) },
            () => '删除'
          )
        )
        return h('div', buttons)
      }
    }
  ])

  const loadReviews = async () => {
    isLoading.value = true
    try {
      const params: ReviewQueryParams = { page: currentPage.value, pageSize: pageSize.value }
      if (searchVal.value) params.keyword = searchVal.value
      if (statusFilter.value !== undefined) params.status = statusFilter.value
      const res = (await getBookReviews(params)) as unknown as ReviewApiResponse
      commentList.value = (res?.items || []).map((item: ReviewApiItem) => ({
        id: item.id,
        bookName: item.book?.title || '未知',
        content: item.content || '',
        username: item.user?.nickname || item.user?.username || '匿名',
        createTime: item.createdAt || '',
        status: statusMap[item.status] || 'pending',
      }))
      total.value = res?.total || 0
    } catch {
      ElMessage.error('加载评论失败')
    } finally {
      isLoading.value = false
    }
  }

  const handleSearch = () => {
    currentPage.value = 1
    loadReviews()
  }

  const handleReset = () => {
    searchVal.value = ''
    statusFilter.value = undefined
    currentPage.value = 1
    loadReviews()
  }

  const handlePageChange = (val: number) => {
    currentPage.value = val
    loadReviews()
  }

  const handleSizeChange = (val: number) => {
    pageSize.value = val
    currentPage.value = 1
    loadReviews()
  }

  const handleApprove = async (row: CommentItem) => {
    try {
      await updateReviewStatus({ id: row.id, status: 1 })
      ElMessage.success('评论已通过审核')
      loadReviews()
    } catch (error: unknown) {
      const err = error as ApiErrorResponse
      ElMessage.error(err?.response?.data?.message || '操作失败')
    }
  }

  const handleReject = async (row: CommentItem) => {
    try {
      await updateReviewStatus({ id: row.id, status: 2 })
      ElMessage.success('评论已驳回')
      loadReviews()
    } catch (error: unknown) {
      const err = error as ApiErrorResponse
      ElMessage.error(err?.response?.data?.message || '操作失败')
    }
  }

  const handleView = (row: CommentItem) => {
    currentComment.value = row
    showDetail.value = true
  }

  const handleDelete = (row: CommentItem) => {
    ElMessageBox.confirm(`确定删除该评论吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        await deleteReview(row.id)
        ElMessage.success('删除成功')
        loadReviews()
      } catch (error: unknown) {
        const err = error as ApiErrorResponse
        ElMessage.error(err?.response?.data?.message || '删除失败')
      }
    }).catch(() => {})
  }

  // 监听筛选条件变化
  watch(statusFilter, () => {
    currentPage.value = 1
    loadReviews()
  })

  onMounted(() => {
    loadReviews()
  })
</script>
