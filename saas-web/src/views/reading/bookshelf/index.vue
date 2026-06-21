<template>
  <div class="page-content !mb-5">
    <h1 class="text-2xl font-medium mb-5">{{ $t('menus.reading.bookshelf') }}</h1>

    <ElRow justify="space-between" :gutter="10" class="mb-5">
      <ElCol :lg="6" :md="8" :sm="12" :xs="24">
        <ElInput
          v-model="searchVal"
          :prefix-icon="Search"
          clearable
          placeholder="搜索书架名称"
          @keyup.enter="handleSearch"
        />
      </ElCol>
      <ElCol :lg="6" :md="8" :sm="12" :xs="24" style="display: flex; justify-content: end">
        <ElButton type="primary" @click="openCreateDialog">新增书架</ElButton>
      </ElCol>
    </ElRow>

    <div class="grid grid-cols-4 gap-5 max-2xl:grid-cols-3 max-xl:grid-cols-2 max-sm:grid-cols-1">
      <ElCard
        v-for="item in bookshelfList"
        :key="item.id"
        shadow="hover"
        class="cursor-pointer"
        @click="openDetail(item)"
      >
        <div class="flex flex-col items-center py-4">
          <ArtSvgIcon icon="ri:bookshelf-line" class="text-5xl text-primary mb-3" />
          <h3 class="text-base font-medium text-g-800">{{ item.name }}</h3>
          <p class="text-sm text-g-500 mt-1">{{ item.bookCount }} 本书</p>
          <p class="text-xs text-g-400 mt-1">创建于 {{ item.createTime }}</p>
        </div>
      </ElCard>
    </div>

    <div class="flex justify-center mt-5">
      <ElEmpty v-if="bookshelfList.length === 0" description="暂无书架数据" />
    </div>

    <!-- 创建/编辑书架弹窗 -->
    <ElDialog v-model="showDialog" :title="isEdit ? '编辑书架' : '新增书架'" width="500px">
      <ElForm :model="formData" label-width="80px">
        <ElFormItem label="书架名称" required>
          <ElInput v-model="formData.name" placeholder="请输入书架名称" />
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput v-model="formData.description" type="textarea" :rows="3" placeholder="请输入书架描述" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleSave">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'

defineOptions({ name: 'ReadingBookshelf' })

interface BookshelfItem {
  id: number
  name: string
  description: string
  bookCount: number
  createTime: string
}

const searchVal = ref('')
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const bookshelfList = ref<BookshelfItem[]>([
  { id: 1, name: '文学经典', description: '中外文学名著', bookCount: 12, createTime: '2025-01-15' },
  { id: 2, name: '科技前沿', description: '科技类书籍', bookCount: 8, createTime: '2025-02-20' },
  { id: 3, name: '历史人文', description: '历史与人文社科', bookCount: 15, createTime: '2025-03-10' },
  { id: 4, name: '经济管理', description: '经济与管理类', bookCount: 6, createTime: '2025-04-05' }
])

const formData = reactive({
  name: '',
  description: ''
})

const handleSearch = () => {
  console.log('搜索:', searchVal.value)
}

const openCreateDialog = () => {
  isEdit.value = false
  editId.value = null
  formData.name = ''
  formData.description = ''
  showDialog.value = true
}

const openDetail = (item: BookshelfItem) => {
  console.log('查看书架:', item)
}

const handleSave = () => {
  showDialog.value = false
  ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
}
</script>