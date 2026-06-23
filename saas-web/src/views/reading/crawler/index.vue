<template>
  <div class="page-content !mb-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-2xl font-medium">{{ $t('menus.reading.crawler') }}</h1>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm">
      <div class="flex items-center mb-4">
        <el-icon class="text-2xl text-blue-500 mr-2"
          ><i class="ri-download-cloud-2-line"></i
        ></el-icon>
        <h2 class="text-lg font-medium">小说下载</h2>
      </div>
      <p class="text-gray-500 mb-6"
        >输入小说目录页地址，系统将自动下载章节内容并入库为书籍和章节记录。</p
      >

      <el-form :model="formData" label-width="120px" :rules="formRules" ref="formRef">
        <el-form-item label="目录页地址" prop="url" required>
          <el-input
            v-model="formData.url"
            placeholder="请输入小说目录页完整URL（如：https://example.com/book/123/）"
            clearable
            :disabled="loading"
          >
            <template #prepend>
              <i class="ri-links-line"></i>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="小说名称">
          <el-input
            v-model="formData.name"
            placeholder="可选，不填则自动从页面获取"
            clearable
            :disabled="loading"
          />
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
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item label="章节范围">
          <div class="flex items-center gap-2">
            <el-input-number
              v-model="formData.startChapter"
              :min="1"
              placeholder="开始章节"
              controls-position="right"
              :disabled="loading"
            />
            <span class="text-gray-400">至</span>
            <el-input-number
              v-model="formData.endChapter"
              :min="1"
              placeholder="结束章节"
              controls-position="right"
              :disabled="loading"
            />
          </div>
          <div class="text-gray-400 text-sm mt-1">留空则下载全部章节</div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
            icon="ri-download-2-line"
          >
            {{ loading ? '下载中...' : '开始下载' }}
          </el-button>
          <el-button @click="resetForm" icon="ri-refresh-line" :disabled="loading">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 进度详情 -->
    <div v-if="taskId && progress" class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <el-icon class="text-2xl text-blue-500 mr-2">
            <i
              v-if="progress.status === 'downloading'"
              class="ri-loader-4-line animate-spin"
            ></i>
            <i v-else-if="progress.status === 'paused'" class="ri-pause-circle-line"></i>
            <i v-else-if="progress.status === 'completed'" class="ri-check-double-line"></i>
            <i v-else-if="progress.status === 'cancelled'" class="ri-close-circle-line"></i>
            <i v-else-if="progress.status === 'error'" class="ri-error-warning-line"></i>
            <i v-else class="ri-loader-4-line animate-spin"></i>
          </el-icon>
          <h3 class="text-lg font-medium text-blue-800">
            {{
              progress.status === 'completed'
                ? '下载完成'
                : progress.status === 'cancelled'
                  ? '任务已取消'
                  : progress.status === 'paused'
                    ? '任务已暂停'
                    : progress.status === 'error'
                      ? '下载出错'
                      : '正在下载...'
            }}
          </h3>
        </div>
        <!-- 操作按钮 -->
        <div class="flex items-center gap-2">
          <el-button
            v-if="progress.status === 'downloading'"
            type="warning"
            size="small"
            icon="ri-pause-line"
            @click="handlePause"
          >
            暂停
          </el-button>
          <el-button
            v-if="progress.status === 'paused'"
            type="primary"
            size="small"
            icon="ri-play-line"
            @click="handleResume"
          >
            继续
          </el-button>
          <el-button
            v-if="progress.status === 'downloading' || progress.status === 'paused'"
            type="danger"
            size="small"
            icon="ri-stop-line"
            @click="handleCancel"
          >
            取消
          </el-button>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600">下载进度</span>
          <span class="text-sm font-medium text-blue-600">
            {{ progress.completedChapters }} / {{ progress.totalChapters }}
            <span v-if="progress.totalChapters > 0"
              >({{
                Math.round((progress.completedChapters / progress.totalChapters) * 100)
              }}%)</span
            >
          </span>
        </div>
        <el-progress
          :percentage="progressPercent"
          :status="
            progress.status === 'completed'
              ? 'success'
              : progress.status === 'error'
                ? 'exception'
                : undefined
          "
          :stroke-width="20"
          :text-inside="true"
        />
      </div>

      <!-- 进度详情信息 -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4 mb-4">
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="text-gray-500 text-sm">当前状态</div>
          <div class="text-base font-medium">
            <el-tag v-if="progress.status === 'preparing'" type="info" size="small">准备中</el-tag>
            <el-tag v-else-if="progress.status === 'downloading'" type="primary" size="small"
              >下载中</el-tag
            >
            <el-tag v-else-if="progress.status === 'paused'" type="warning" size="small"
              >已暂停</el-tag
            >
            <el-tag v-else-if="progress.status === 'completed'" type="success" size="small"
              >已完成</el-tag
            >
            <el-tag v-else-if="progress.status === 'cancelled'" type="info" size="small"
              >已取消</el-tag
            >
            <el-tag v-else-if="progress.status === 'error'" type="danger" size="small">出错</el-tag>
          </div>
        </div>
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="text-gray-500 text-sm">已完成</div>
          <div class="text-base font-medium text-green-600"
            >{{ progress.completedChapters }} 章</div
          >
        </div>
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="text-gray-500 text-sm">失败</div>
          <div
            class="text-base font-medium"
            :class="progress.failedChapters > 0 ? 'text-red-600' : 'text-gray-400'"
            >{{ progress.failedChapters }} 章</div
          >
        </div>
        <div class="bg-white p-3 rounded shadow-sm">
          <div class="text-gray-500 text-sm">总字数</div>
          <div class="text-base font-medium text-purple-600">{{
            progress.totalWordCount?.toLocaleString() || 0
          }}</div>
        </div>
      </div>

      <!-- 当前章节信息 -->
      <div
        v-if="progress.status === 'downloading' || progress.status === 'preparing'"
        class="flex items-center text-sm text-gray-600 mb-2"
      >
        <i class="ri-file-text-line mr-1"></i>
        <span>{{ progress.message }}</span>
      </div>

      <!-- 实时章节日志 -->
      <div v-if="chapterLogs.length > 0" class="mt-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-gray-700">下载详情</span>
          <el-button text type="primary" size="small" @click="showLogDetail = !showLogDetail">
            {{ showLogDetail ? '收起' : '展开' }}
          </el-button>
        </div>
        <div
          v-show="showLogDetail"
          class="chapter-log-box bg-gray-900 rounded-lg p-3 max-h-[200px] overflow-y-auto font-mono text-xs"
        >
          <div
            v-for="(log, idx) in chapterLogs"
            :key="idx"
            class="py-0.5"
            :class="
              log.type === 'error'
                ? 'text-red-400'
                : log.type === 'success'
                  ? 'text-green-400'
                  : 'text-gray-300'
            "
          >
            {{ log.text }}
          </div>
        </div>
      </div>
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
          <div class="text-lg font-medium text-purple-600">{{
            result.totalWordCount?.toLocaleString()
          }}</div>
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
  import {
    getBookCategories,
    crawlNovelAsync,
    getCrawlProgress,
    pauseCrawlTask,
    resumeCrawlTask,
    cancelCrawlTask
  } from '@/api/reading'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance } from 'element-plus'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'ReadingCrawler' })

  const router = useRouter()
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const taskId = ref('')
  const progress = ref<any>(null)
  const result = ref<any>(null)
  const showLogDetail = ref(true)
  const chapterLogs = ref<Array<{ text: string; type: string }>>([])
  let pollTimer: ReturnType<typeof setInterval> | null = null

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

  const progressPercent = computed(() => {
    if (!progress.value || !progress.value.totalChapters) return 0
    return Math.round((progress.value.completedChapters / progress.value.totalChapters) * 100)
  })

  const loadCategories = async () => {
    try {
      const res = (await getBookCategories({ tree: true })) as any
      categoryTree.value = Array.isArray(res) ? res : []
    } catch (error) {
      console.error('加载分类失败', error)
    }
  }

  const startPolling = (id: string) => {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(async () => {
      try {
        const res = (await getCrawlProgress(id)) as any
        if (!res) return
        progress.value = res

        // 添加章节日志
        if (res.message) {
          const lastLog = chapterLogs.value[chapterLogs.value.length - 1]
          if (!lastLog || lastLog.text !== res.message) {
            let type = 'info'
            if (res.message.includes('失败')) type = 'error'
            else if (res.message.includes('已完成')) type = 'success'
            chapterLogs.value.push({ text: res.message, type })
            // 最多保留200条
            if (chapterLogs.value.length > 200) {
              chapterLogs.value = chapterLogs.value.slice(-200)
            }
          }
        }

        if (res.status === 'completed') {
          stopPolling()
          loading.value = false
          result.value = res.result
          ElMessage.success(
            `小说 "${res.result?.title}" 下载成功，共 ${res.result?.totalChapters} 章`
          )
        } else if (res.status === 'cancelled') {
          stopPolling()
          loading.value = false
          result.value = res.result
          ElMessage.warning('任务已取消')
        } else if (res.status === 'error') {
          stopPolling()
          loading.value = false
          ElMessage.error('下载出错：' + (res.message || '未知错误'))
        }
      } catch (error) {
        console.error('轮询进度失败', error)
      }
    }, 2000)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      loading.value = true
      result.value = null
      progress.value = null
      taskId.value = ''
      chapterLogs.value = []
      try {
        const res = (await crawlNovelAsync({
          url: formData.url,
          name: formData.name || undefined,
          startChapter: formData.startChapter || undefined,
          endChapter: formData.endChapter || undefined,
          categoryId: formData.categoryId || undefined
        })) as any
        taskId.value = res.taskId
        chapterLogs.value.push({ text: '任务已创建，开始下载...', type: 'info' })
        startPolling(res.taskId)
      } catch (error: any) {
        loading.value = false
        ElMessage.error(error?.response?.data?.message || '下载失败，请检查地址是否正确')
      }
    })
  }

  const resetForm = () => {
    if (formRef.value) {
      formRef.value.resetFields()
    }
    result.value = null
    progress.value = null
    taskId.value = ''
    chapterLogs.value = []
    stopPolling()
  }

  const handlePause = async () => {
    try {
      await pauseCrawlTask(taskId.value)
      ElMessage.success('任务已暂停')
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || '暂停失败')
    }
  }

  const handleResume = async () => {
    try {
      await resumeCrawlTask(taskId.value)
      ElMessage.success('任务已恢复')
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.message || '恢复失败')
    }
  }

  const handleCancel = async () => {
    try {
      await ElMessageBox.confirm('确定取消任务？已下载的章节将保留。', '确认取消', {
        confirmButtonText: '确定取消',
        cancelButtonText: '继续下载',
        type: 'warning'
      })
      await cancelCrawlTask(taskId.value)
      ElMessage.success('取消指令已发送')
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error?.response?.data?.message || '取消失败')
      }
    }
  }

  const goToBooks = () => {
    router.push({ name: 'ReadingBooks' })
  }

  onMounted(() => {
    loadCategories()
  })

  onUnmounted(() => {
    stopPolling()
  })
</script>

<style scoped>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .chapter-log-box {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    line-height: 1.6;
  }
</style>
