<template>
  <div class="page-content !mb-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-medium">{{ $t('menus.reading.crawler') }}</h1>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">
      <div class="flex items-center mb-4">
        <el-icon class="text-2xl text-blue-500 mr-2"><i class="ri-download-cloud-2-line"></i></el-icon>
        <h2 class="text-lg font-medium">小说爬取下载</h2>
      </div>
      <p class="text-gray-500 mb-6">输入小说目录页地址，系统将自动爬取章节内容并入库为书籍和章节记录。</p>

      <el-form :model="formData" label-width="120px" :rules="formRules" ref="formRef">
        <el-form-item label="目录页地址" prop="url" required>
          <el-input v-model="formData.url" placeholder="请输入小说目录页完整URL（如：https://example.com/book/123/）" clearable>
            <template #prepend>
              <i class="ri-links-line"></i>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="小说名称">
          <el-input v-model="formData.name" placeholder="可选，不填则自动从页面获取" clearable />
        </el-form-item>

        <el-form-item label="选择分类">
          <el-tree-select
            v-model="formData.categoryId"
            :data="categoryTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="可选，选择书籍分类"
            clearable
            check-strictly
            class="w-full"
          />
        </el-form-item>

        <el-form-item label="章节范围">
          <div class="flex items-center gap-2">
            <el-input-number v-model="formData.startChapter" :min="1" placeholder="开始章节" controls-position="right" />
            <span class="text-gray-400">至</span>
            <el-input-number v-model="formData.endChapter" :min="1" placeholder="结束章节" controls-position="right" />
          </div>
          <div class="text-gray-400 text-sm mt-1">留空则下载全部章节</div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit" icon="ri-download-2-line">
            {{ loading ? '爬取中...' : '开始爬取' }}
          </el-button>
          <el-button @click="resetForm" icon="ri-refresh-line">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 下载结果 -->
    <div v-if="result" class="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
      <div class="flex items-center mb-4">
        <el-icon class="text-2xl text-green-500 mr-2"><i class="ri-check-double-line"></i></el-icon>
        <h3 class="text-lg font-medium text-green-800">下载完成</h3>
      </div>
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="text-gray-500 text-sm">书籍ID</div>
          <div class="text-lg font-medium">{{ result.bookId }}</div>
        </div>
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="text-gray-500 text-sm">书名</div>
          <div class="text-lg font-medium">{{ result.title }}</div>
        </div>
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="text-gray-500 text-sm">作者</div>
          <div class="text-lg font-medium">{{ result.author }}</div>
        </div>
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="text-gray-500 text-sm">章节数</div>
          <div class="text-lg font-medium text-blue-600">{{ result.totalChapters }}</div>
        </div>
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="text-gray-500 text-sm">总字数</div>
          <div class="text-lg font-medium text-purple-600">{{ result.totalWordCount?.toLocaleString() }}</div>
        </div>
      </div>
      <div v-if="result.failedChapters > 0" class="mt-3 text-yellow-600">
        <i class="ri-error-warning-line mr-1"></i>
        有 {{ result.failedChapters }} 章下载失败，已创建占位记录，请手动补充内容。
      </div>
      <div class="mt-4">
        <el-button type="primary" link @click="goToBooks">
          <i class="ri-arrow-right-line mr-1"></i>前往书籍管理查看
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { getBookCategories, crawlNovel } from '@/api/reading'
  import { ElMessage } from 'element-plus'
  import type { FormInstance } from 'element-plus'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'ReadingCrawler' })

  const router = useRouter()
  const formRef = ref<FormInstance>()
  const loading = ref(false)

  const formData = reactive({
    url: '',
    name: '',
    categoryId: undefined as number | undefined,
    startChapter: undefined as number | undefined,
    endChapter: undefined as number | undefined
  })

  const formRules = {
    url: [
      { required: true, message: '请输入小说目录页地址', trigger: 'blur' },
      { type: 'url' as const, message: '请输入有效的URL地址', trigger: 'blur' }
    ]
  }

  const categoryTree = ref<any[]>([])
  const result = ref<any>(null)

  const loadCategories = async () => {
    try {
      const res = (await getBookCategories({ tree: true })) as any
      categoryTree.value = Array.isArray(res) ? res : []
    } catch (error) {
      console.error('加载分类失败', error)
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      loading.value = true
      result.value = null
      try {
        const res = (await crawlNovel({
          url: formData.url,
          name: formData.name || undefined,
          startChapter: formData.startChapter || undefined,
          endChapter: formData.endChapter || undefined,
          categoryId: formData.categoryId || undefined
        })) as any
        result.value = res
        ElMessage.success(`小说 "${res.title}" 爬取成功，共 ${res.totalChapters} 章`)
      } catch (error: any) {
        ElMessage.error(error?.response?.data?.message || '爬取失败，请检查地址是否正确')
      } finally {
        loading.value = false
      }
    })
  }

  const resetForm = () => {
    if (formRef.value) {
      formRef.value.resetFields()
    }
    result.value = null
  }

  const goToBooks = () => {
    router.push({ name: 'ReadingBooks' })
  }

  onMounted(() => {
    loadCategories()
  })
</script>