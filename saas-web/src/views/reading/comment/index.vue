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
          <ElOption label="待审核" value="pending" />
          <ElOption label="已通过" value="approved" />
          <ElOption label="已驳回" value="rejected" />
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
const statusFilter = ref('')
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showDetail = ref(false)
const currentComment = ref<CommentItem | null>(null)

const commentList = ref<CommentItem[]>([
  { id: 1, bookName: '红楼梦', content: '非常经典的文学作品，值得反复阅读', username: '张三', createTime: '2025-06-01 10:30', status: 'approved' },
  { id: 2, bookName: '三体', content: '科幻巨作，想象力惊人', username: '李四', createTime: '2025-06-02 14:20', status: 'pending' },
  { id: 3, bookName: '人类简史', content: '从宏观角度解读人类发展历程', username: '王五', createTime: '2025-06-03 09:15', status: 'approved' },
  { id: 4, bookName: '国富论', content: '经济学的奠基之作，需要仔细研读', username: '赵六', createTime: '2025-06-04 16:45', status: 'rejected' },
  { id: 5, bookName: '百年孤独', content: '魔幻现实主义的巅峰之作', username: '钱七', createTime: '2025-06-05 11:00', status: 'pending' }
])

const handleSearch = () => {
  currentPage.value = 1
}

const handlePageChange = (val: number) => {
  currentPage.value = val
}

const handleApprove = (row: CommentItem) => {
  row.status = 'approved'
  ElMessage.success('评论已通过审核')
}

const handleReject = (row: CommentItem) => {
  row.status = 'rejected'
  ElMessage.success('评论已驳回')
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
  }).then(() => {
    commentList.value = commentList.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}
</script>