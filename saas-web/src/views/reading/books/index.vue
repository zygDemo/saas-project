<template>
  <div class="page-content !mb-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-medium">{{ $t('menus.reading.books') }}</h1>
      <ElButton type="primary" @click="openAddDialog" v-auth="'add'">新增图书</ElButton>
    </div>

    <!-- 搜索栏 -->
    <ElRow :gutter="10" class="mb-5">
      <ElCol :lg="6" :md="8" :sm="12" :xs="24">
        <ElInput
          v-model="searchVal"
          :prefix-icon="Search"
          clearable
          placeholder="搜索图书名称"
          @keyup.enter="handleSearch"
        />
      </ElCol>
      <ElCol :lg="6" :md="8" :sm="12" :xs="24">
        <ElSelect v-model="categoryFilter" placeholder="选择分类" clearable class="w-full">
          <ElOption v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
        </ElSelect>
      </ElCol>
    </ElRow>

    <!-- 图书列表 -->
    <ElTable :data="bookList" stripe border v-loading="isLoading">
      <ElTableColumn type="index" label="序号" width="60" align="center" />
      <ElTableColumn prop="name" label="图书名称" min-width="180" />
      <ElTableColumn prop="author" label="作者" width="150" />
      <ElTableColumn prop="category" label="分类" width="120" />
      <ElTableColumn prop="publisher" label="出版社" width="200" />
      <ElTableColumn prop="publishDate" label="出版日期" width="120" />
      <ElTableColumn prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <ElTag :type="row.status === '上架' ? 'success' : 'info'">{{ row.status }}</ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <ElButton size="small" type="primary" link @click="handleEdit(row)" v-auth="'edit'">编辑</ElButton>
          <ElButton size="small" type="danger" link @click="handleDelete(row)" v-auth="'delete'">删除</ElButton>
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

    <!-- 新增/编辑图书弹窗 -->
    <ElDialog v-model="showDialog" :title="isEdit ? '编辑图书' : '新增图书'" width="600px">
      <ElForm :model="formData" label-width="100px">
        <ElFormItem label="图书名称" required>
          <ElInput v-model="formData.name" placeholder="请输入图书名称" />
        </ElFormItem>
        <ElFormItem label="作者" required>
          <ElInput v-model="formData.author" placeholder="请输入作者" />
        </ElFormItem>
        <ElFormItem label="分类" required>
          <ElSelect v-model="formData.category" placeholder="请选择分类" class="w-full">
            <ElOption v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.name" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="出版社">
          <ElInput v-model="formData.publisher" placeholder="请输入出版社" />
        </ElFormItem>
        <ElFormItem label="出版日期">
          <ElDatePicker v-model="formData.publishDate" type="date" placeholder="选择日期" class="w-full" />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElRadioGroup v-model="formData.status">
            <ElRadio value="上架">上架</ElRadio>
            <ElRadio value="下架">下架</ElRadio>
          </ElRadioGroup>
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

defineOptions({ name: 'ReadingBooks' })

interface BookItem {
  id: number
  name: string
  author: string
  category: string
  publisher: string
  publishDate: string
  status: string
}

interface CategoryItem {
  id: number
  name: string
}

const searchVal = ref('')
const categoryFilter = ref('')
const showDialog = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const isLoading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const categoryList = ref<CategoryItem[]>([
  { id: 1, name: '文学' },
  { id: 2, name: '科技' },
  { id: 3, name: '历史' },
  { id: 4, name: '经济' }
])

const bookList = ref<BookItem[]>([
  { id: 1, name: '红楼梦', author: '曹雪芹', category: '文学', publisher: '人民文学出版社', publishDate: '2020-01', status: '上架' },
  { id: 2, name: '三体', author: '刘慈欣', category: '科技', publisher: '重庆出版社', publishDate: '2021-03', status: '上架' },
  { id: 3, name: '人类简史', author: '尤瓦尔·赫拉利', category: '历史', publisher: '中信出版社', publishDate: '2022-06', status: '上架' },
  { id: 4, name: '国富论', author: '亚当·斯密', category: '经济', publisher: '商务印书馆', publishDate: '2023-09', status: '下架' }
])

const formData = reactive({
  name: '',
  author: '',
  category: '',
  publisher: '',
  publishDate: '',
  status: '上架'
})

const handleSearch = () => {
  currentPage.value = 1
}

const handlePageChange = (val: number) => {
  currentPage.value = val
}

const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  formData.name = ''
  formData.author = ''
  formData.category = ''
  formData.publisher = ''
  formData.publishDate = ''
  formData.status = '上架'
  showDialog.value = true
}

const handleEdit = (row: BookItem) => {
  isEdit.value = true
  editId.value = row.id
  formData.name = row.name
  formData.author = row.author
  formData.category = row.category
  formData.publisher = row.publisher
  formData.publishDate = row.publishDate
  formData.status = row.status
  showDialog.value = true
}

const handleDelete = (row: BookItem) => {
  ElMessageBox.confirm(`确定删除图书"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    bookList.value = bookList.value.filter(item => item.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const handleSave = () => {
  showDialog.value = false
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
}
</script>