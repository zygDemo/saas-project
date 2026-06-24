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
    </ElRow>

    <ElTable :data="commentList" stripe border v-loading="isLoading">
      <ElTableColumn type="index" label="序号" width="60" align="center" />
      <ElTableColumn prop="bookName" label="图书" width="150" />
      <ElTableColumn prop="content" label="评论内容" min-width="300" show-overflow-tooltip />
      <ElTableColumn prop="username" label="评论用户" width="120" />
      <ElTableColumn prop="createTime" label="评论时间" width="180" />
      <ElTableColumn prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <ElTag
            :type="row.status === 'approved' ? 'success' : row.status === 'pending' ? 'warning' : 'danger'"
          >
            {{ row.status === 'approved' ? '已通过' : row.status === 'pending' ? '待审核' : '已驳回' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="240" fixed="right" align="center">
        <template #default="{ row }">
          <ElButton
            v-if="row.status === 'pending'"
            size="small"
            type="success"
            link
            @click="handleApprove(row)"
          >
            通过
          </ElButton>
          <ElButton
            v-if="row.status === 'pending'"
            size="small"
            type="warning"
            link
            @click="handleReject(row)"
          >
            驳回
          </ElButton>
          <ElButton size="small" type="primary" link @click="handleView(row)">查看</ElButton>
          <ElButton size="small" type="danger" link @click="handleDelete(row)">删除</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex justify-center mt-5">
      <ElPagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        background
        layout="prev, pager, next, total, jumper"
        @current-change="handlePageChange"
      />
    </div>

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
import { Search } from '@element-plus/icons-vue'
import { getBookReviews, updateReviewStatus, deleteReview } from '@/api/reading'

defineOptions({ name: 'ReadingComment' })

interface CommentItem {
  id: number
  bookName: string
  content: string
  username: string
  createTime: string
  status: 'pending' | 'approved' | 'rejected'
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

const loadReviews = async () => {
  isLoading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize: pageSize.value }
    if (searchVal.value) params.keyword = searchVal.value
    if (statusFilter.value !== undefined) params.status = statusFilter.value
    const res = (await getBookReviews(params)) as any
    commentList.value = (res?.items || []).map((item: any) => ({
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

const handlePageChange = (val: number) => {
  currentPage.value = val
  loadReviews()
}

const handleApprove = async (row: CommentItem) => {
  try {
    await updateReviewStatus({ id: row.id, status: 1 })
    ElMessage.success('评论已通过审核')
    loadReviews()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败')
  }
}

const handleReject = async (row: CommentItem) => {
  try {
    await updateReviewStatus({ id: row.id, status: 2 })
    ElMessage.success('评论已驳回')
    loadReviews()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '操作失败')
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
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || '删除失败')
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