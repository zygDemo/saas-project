<template>
  <ReadingPageShell
    title="评论管理"
    description="审核和维护用户书评，快速定位待处理内容。"
    icon="ri:chat-3-line"
  >
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :span="8"
      :show-expand="false"
      @search="handleSearch"
      @reset="handleReset"
    />

    <ElCard class="art-table-card">
      <ArtTableHeader
        :loading="isLoading"
        @refresh="loadReviews"
        layout="refresh,size,fullscreen,columns,settings"
      >
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
        <div class="comment-detail__meta">
          <span class="comment-detail__label">图书</span>
          <span class="comment-detail__value">{{ currentComment.bookName }}</span>
          <span class="comment-detail__label">用户</span>
          <span class="comment-detail__value">{{ currentComment.username }}</span>
          <span class="comment-detail__label">评论时间</span>
          <span class="comment-detail__value">{{ currentComment.createTime }}</span>
          <span class="comment-detail__label">状态</span>
          <span class="comment-detail__value">
            <ElTag
              :type="
                currentComment.status === 'approved'
                  ? 'success'
                  : currentComment.status === 'pending'
                    ? 'warning'
                    : 'danger'
              "
            >
              {{
                currentComment.status === 'approved'
                  ? '已通过'
                  : currentComment.status === 'pending'
                    ? '待审核'
                    : '已驳回'
              }}
            </ElTag>
          </span>
        </div>
        <div>
          <div class="comment-detail__label mb-2">评论内容</div>
          <div class="comment-detail__content">{{ currentComment.content }}</div>
        </div>
      </template>
    </ElDrawer>
  </ReadingPageShell>
</template>

<script setup lang="ts">
  import ReadingPageShell from '../components/ReadingPageShell.vue'
  import { h } from 'vue'
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

  const searchForm = reactive<{ keyword: string; status?: number }>({
    keyword: '',
    status: undefined
  })
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
            row.status === 'approved' ? '已通过' : row.status === 'pending' ? '待审核' : '已驳回'
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
      if (searchForm.keyword) params.keyword = searchForm.keyword
      if (searchForm.status !== undefined) params.status = searchForm.status
      const res = (await getBookReviews(params)) as unknown as ReviewApiResponse
      commentList.value = (res?.items || []).map((item: ReviewApiItem) => ({
        id: item.id,
        bookName: item.book?.title || '未知',
        content: item.content || '',
        username: item.user?.nickname || item.user?.username || '匿名',
        createTime: item.createdAt || '',
        status: statusMap[item.status] || 'pending'
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

  const searchItems = computed(() => [
    {
      label: '评论内容',
      key: 'keyword',
      type: 'input',
      placeholder: '搜索评论内容',
      clearable: true
    },
    {
      label: '审核状态',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '审核状态',
        clearable: true,
        options: [
          { label: '待审核', value: 0 },
          { label: '已通过', value: 1 },
          { label: '已驳回', value: 2 }
        ]
      }
    }
  ])

  const handleReset = () => {
    searchForm.keyword = ''
    searchForm.status = undefined
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
    })
      .then(async () => {
        try {
          await deleteReview(row.id)
          ElMessage.success('删除成功')
          loadReviews()
        } catch (error: unknown) {
          const err = error as ApiErrorResponse
          ElMessage.error(err?.response?.data?.message || '删除失败')
        }
      })
      .catch(() => {})
  }

  // 监听筛选条件变化
  watch(
    () => searchForm.status,
    () => {
      currentPage.value = 1
      loadReviews()
    }
  )

  onMounted(() => {
    loadReviews()
  })
</script>

<style scoped>
  .comment-detail__meta {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    gap: 10px 12px;
    padding: 14px;
    margin-bottom: 18px;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .comment-detail__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .comment-detail__value {
    min-width: 0;
    font-size: 13px;
    color: var(--el-text-color-primary);
  }

  .comment-detail__content {
    padding: 14px;
    line-height: 1.7;
    color: var(--el-text-color-primary);
    white-space: pre-wrap;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }
</style>
