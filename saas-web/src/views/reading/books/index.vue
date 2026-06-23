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
          placeholder="搜索图书名称/作者"
          @keyup.enter="handleSearch"
        />
      </ElCol>
      <ElCol :lg="6" :md="8" :sm="12" :xs="24">
        <ElSelect
          v-model="categoryFilter"
          placeholder="选择分类"
          clearable
          class="w-full"
          @change="handleSearch"
        >
          <ElOption v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
        </ElSelect>
      </ElCol>
      <ElCol :lg="6" :md="8" :sm="12" :xs="24">
        <ElSelect
          v-model="statusFilter"
          placeholder="选择状态"
          clearable
          class="w-full"
          @change="handleSearch"
        >
          <ElOption label="上架" :value="1" />
          <ElOption label="下架" :value="0" />
        </ElSelect>
      </ElCol>
      <ElCol :lg="6" :md="8" :sm="12" :xs="24">
        <ElButton type="primary" @click="handleSearch">
          <ElIcon class="mr-1"><Search /></ElIcon>
          搜索
        </ElButton>
        <ElButton @click="handleReset">重置</ElButton>
      </ElCol>
    </ElRow>

    <!-- 图书列表 -->
    <ElTable :data="bookList" stripe border v-loading="isLoading">
      <ElTableColumn type="index" label="序号" width="60" align="center" />
      <ElTableColumn prop="title" label="图书名称" min-width="180" />
      <ElTableColumn prop="author" label="作者" width="120" />
      <ElTableColumn prop="category.name" label="分类" width="100">
        <template #default="{ row }">
          {{ row.category?.name || '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="wordCount" label="字数" width="100" align="center">
        <template #default="{ row }">
          {{ formatWordCount(row.wordCount) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="chapterCount" label="章节" width="80" align="center" />
      <ElTableColumn prop="rating" label="评分" width="80" align="center">
        <template #default="{ row }">
          <span class="text-orange-500">{{ row.rating }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="readCount" label="阅读量" width="100" align="center">
        <template #default="{ row }">
          {{ formatNumber(row.readCount) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <ElTag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架' : '下架' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="isHot" label="热门" width="70" align="center">
        <template #default="{ row }">
          <ElTag v-if="row.isHot" type="danger" size="small">热</ElTag>
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="isRecommend" label="推荐" width="70" align="center">
        <template #default="{ row }">
          <ElTag v-if="row.isRecommend" type="warning" size="small">荐</ElTag>
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <ElButton size="small" type="primary" link @click="handleEdit(row)" v-auth="'edit'"
            >编辑</ElButton
          >
          <ElButton size="small" type="success" link @click="handleChapters(row)">章节</ElButton>
          <ElButton size="small" type="danger" link @click="handleDelete(row)" v-auth="'delete'"
            >删除</ElButton
          >
        </template>
      </ElTableColumn>
    </ElTable>

    <div class="flex justify-center mt-5">
      <ElPagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        background
        layout="prev, pager, next, total, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 新增/编辑图书弹窗 -->
    <ElDialog v-model="showDialog" :title="isEdit ? '编辑图书' : '新增图书'" width="700px">
      <ElForm :model="formData" label-width="100px">
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="图书名称" required>
              <ElInput v-model="formData.title" placeholder="请输入图书名称" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="作者" required>
              <ElInput v-model="formData.author" placeholder="请输入作者" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="分类">
              <ElSelect v-model="formData.categoryId" placeholder="请选择分类" class="w-full">
                <ElOption
                  v-for="cat in categoryList"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="ISBN">
              <ElInput v-model="formData.isbn" placeholder="请输入ISBN" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="出版社">
              <ElInput v-model="formData.publisher" placeholder="请输入出版社" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="出版日期">
              <ElDatePicker
                v-model="formData.publishDate"
                type="date"
                placeholder="选择日期"
                class="w-full"
                value-format="YYYY-MM-DD"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="字数">
              <ElInputNumber
                v-model="formData.wordCount"
                :min="0"
                class="w-full"
                placeholder="请输入字数"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="价格">
              <ElInputNumber
                v-model="formData.price"
                :min="0"
                :precision="2"
                class="w-full"
                placeholder="请输入价格"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="封面URL">
          <ElInput v-model="formData.cover" placeholder="请输入封面图片URL" />
        </ElFormItem>
        <ElFormItem label="简介">
          <ElInput v-model="formData.desc" type="textarea" :rows="3" placeholder="请输入简介" />
        </ElFormItem>
        <ElRow :gutter="20">
          <ElCol :span="8">
            <ElFormItem label="是否免费">
              <ElSwitch v-model="formData.isFree" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="是否VIP">
              <ElSwitch v-model="formData.isVip" />
            </ElFormItem>
          </ElCol>
          <ElCol :span="8">
            <ElFormItem label="是否连载">
              <ElSwitch v-model="formData.isSerial" />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="标签">
          <ElInput v-model="formData.tags" placeholder="多个标签用逗号分隔" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showDialog = false">取消</ElButton>
        <ElButton type="primary" @click="handleSave" :loading="saving">保存</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { Search } from '@element-plus/icons-vue'
  import { getBooks, createBook, updateBook, deleteBook, getBookCategories } from '@/api/reading'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'ReadingBooks' })

  const router = useRouter()
  const searchVal = ref('')
  const categoryFilter = ref<number | ''>('')
  const statusFilter = ref<number | ''>('')
  const showDialog = ref(false)
  const isEdit = ref(false)
  const editId = ref<number | null>(null)
  const isLoading = ref(false)
  const saving = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)

  const categoryList = ref<any[]>([])
  const bookList = ref<any[]>([])

  const formData = reactive({
    title: '',
    author: '',
    categoryId: null as number | null,
    isbn: '',
    publisher: '',
    publishDate: '',
    wordCount: 0,
    price: 0,
    cover: '',
    desc: '',
    isFree: true,
    isVip: false,
    isSerial: true,
    tags: ''
  })

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const res = await getBookCategories()
      categoryList.value = res || []
    } catch (error) {
      console.error('加载分类失败', error)
    }
  }

  // 加载图书列表
  const loadBooks = async () => {
    isLoading.value = true
    try {
      const params: any = {
        page: currentPage.value,
        pageSize: pageSize.value
      }
      if (searchVal.value) params.keyword = searchVal.value
      if (categoryFilter.value) params.categoryId = categoryFilter.value
      if (statusFilter.value !== '') params.status = statusFilter.value

      const res = (await getBooks(params)) as any
      bookList.value = res?.items || []
      total.value = res?.total || 0
    } catch (error) {
      console.error('加载图书失败', error)
    } finally {
      isLoading.value = false
    }
  }

  const handleSearch = () => {
    currentPage.value = 1
    loadBooks()
  }

  const handleReset = () => {
    searchVal.value = ''
    categoryFilter.value = ''
    statusFilter.value = ''
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

  const formatWordCount = (count: number) => {
    if (count >= 10000) return (count / 10000).toFixed(1) + '万'
    return count?.toString() || '0'
  }

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万'
    return num?.toString() || '0'
  }

  const openAddDialog = () => {
    isEdit.value = false
    editId.value = null
    Object.assign(formData, {
      title: '',
      author: '',
      categoryId: null,
      isbn: '',
      publisher: '',
      publishDate: '',
      wordCount: 0,
      price: 0,
      cover: '',
      desc: '',
      isFree: true,
      isVip: false,
      isSerial: true,
      tags: ''
    })
    showDialog.value = true
  }

  const handleEdit = (row: any) => {
    isEdit.value = true
    editId.value = row.id
    Object.assign(formData, {
      title: row.title,
      author: row.author,
      categoryId: row.categoryId,
      isbn: row.isbn || '',
      publisher: row.publisher || '',
      publishDate: row.publishDate || '',
      wordCount: row.wordCount || 0,
      price: row.price || 0,
      cover: row.cover || '',
      desc: row.desc || '',
      isFree: row.isFree ?? true,
      isVip: row.isVip ?? false,
      isSerial: row.isSerial ?? true,
      tags: row.tags || ''
    })
    showDialog.value = true
  }

  const handleDelete = (row: any) => {
    ElMessageBox.confirm(`确定删除图书《${row.title}》吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          await deleteBook(row.id)
          ElMessage.success('删除成功')
          loadBooks()
        } catch (error) {
          ElMessage.error('删除失败')
        }
      })
      .catch(() => {})
  }

  const handleChapters = (row: any) => {
    router.push(`/reading/chapters/${row.id}`)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.author) {
      ElMessage.warning('请填写必填项')
      return
    }

    saving.value = true
    try {
      if (isEdit.value && editId.value) {
        await updateBook(editId.value, formData)
        ElMessage.success('编辑成功')
      } else {
        await createBook(formData)
        ElMessage.success('新增成功')
      }
      showDialog.value = false
      loadBooks()
    } catch (error) {
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
    } finally {
      saving.value = false
    }
  }

  onMounted(() => {
    loadCategories()
    loadBooks()
  })
</script>
