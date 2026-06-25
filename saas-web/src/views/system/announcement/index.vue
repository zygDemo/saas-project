<template>
  <div class="announcement-page art-full-height">
    <ElCard class="art-table-card">
      <template #header>
        <div class="card-header">
          <div>
            <h3>公告管理</h3>
            <p>发布和管理系统公告通知</p>
          </div>
          <ElButton v-auth="'add'" type="primary" @click="openDialog()">
            <ElIcon class="mr-1"><Plus /></ElIcon>新增公告
          </ElButton>
        </div>
      </template>

      <!-- 搜索栏 -->
      <ElForm :model="searchForm" class="search-form" inline>
        <ElFormItem label="标题">
          <ElInput v-model="searchForm.title" clearable placeholder="公告标题" style="width:200px" />
        </ElFormItem>
        <ElFormItem label="类型">
          <ElSelect v-model="searchForm.type" clearable placeholder="全部" style="width:120px">
            <ElOption label="通知" value="NOTICE" />
            <ElOption label="公告" value="ANNOUNCEMENT" />
            <ElOption label="警告" value="ALERT" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" clearable placeholder="全部" style="width:120px">
            <ElOption label="草稿" value="DRAFT" />
            <ElOption label="已发布" value="PUBLISHED" />
            <ElOption label="已过期" value="EXPIRED" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="loadData">查询</ElButton>
          <ElButton @click="resetSearch">重置</ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="records"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>

    <!-- 新增/编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="form.id ? '编辑公告' : '新增公告'"
      width="700px"
      top="5vh"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="90px">
        <ElFormItem label="公告标题" prop="title">
          <ElInput v-model="form.title" placeholder="请输入公告标题" />
        </ElFormItem>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="公告类型">
              <ElSelect v-model="form.type" style="width: 100%">
                <ElOption label="通知" value="NOTICE" />
                <ElOption label="公告" value="ANNOUNCEMENT" />
                <ElOption label="警告" value="ALERT" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="重要程度">
              <ElSelect v-model="form.level" style="width: 100%">
                <ElOption label="普通" value="NORMAL" />
                <ElOption label="重要" value="IMPORTANT" />
                <ElOption label="紧急" value="URGENT" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="16">
          <ElCol :span="12">
            <ElFormItem label="发布时间">
              <ElDatePicker
                v-model="form.publishAt"
                type="datetime"
                placeholder="选择发布时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="12">
            <ElFormItem label="过期时间">
              <ElDatePicker
                v-model="form.expireAt"
                type="datetime"
                placeholder="选择过期时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElFormItem label="置顶">
          <ElSwitch v-model="form.topFlag" />
        </ElFormItem>
        <ElFormItem label="公告内容">
          <ElInput v-model="form.content" type="textarea" :rows="8" placeholder="请输入公告内容（支持HTML）" />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit('DRAFT')">保存草稿</ElButton>
        <ElButton type="success" :loading="submitting" @click="handleSubmit('PUBLISHED')">保存并发布</ElButton>
      </template>
    </ElDialog>

    <!-- 详情预览 -->
    <ElDialog v-model="previewVisible" title="公告预览" width="680px">
      <div v-if="previewItem" class="announcement-preview">
        <div class="preview-header">
          <h2>{{ previewItem.title }}</h2>
          <div class="preview-meta">
            <ElTag :type="getTypeTag(previewItem.type)" size="small">{{ getTypeLabel(previewItem.type) }}</ElTag>
            <ElTag :type="getLevelTag(previewItem.level)" size="small">{{ getLevelLabel(previewItem.level) }}</ElTag>
            <span class="preview-time">{{ previewItem.publishAt || previewItem.createTime }}</span>
          </div>
        </div>
        <ElDivider />
        <div class="preview-content" v-html="previewItem.content"></div>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import {
    fetchGetAnnouncementList,
    fetchCreateAnnouncement,
    fetchUpdateAnnouncement,
    fetchPublishAnnouncement,
    fetchDeleteAnnouncement
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox, ElTag, ElButton, Plus } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'Announcement' })

  type AnnItem = Api.SystemManage.AnnouncementItem

  const loading = ref(false)
  const submitting = ref(false)
  const records = ref<AnnItem[]>([])
  const dialogVisible = ref(false)
  const previewVisible = ref(false)
  const previewItem = ref<AnnItem | null>(null)
  const formRef = ref<FormInstance>()

  const searchForm = reactive({ title: '', type: '', status: '' })
  const pagination = reactive({ current: 1, size: 20, total: 0 })

  const form = reactive({
    id: 0,
    title: '',
    content: '',
    type: 'NOTICE',
    level: 'NORMAL',
    status: 'DRAFT',
    publishAt: '',
    expireAt: '',
    topFlag: false,
    remark: ''
  })

  const rules: FormRules = {
    title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }]
  }

  const getTypeTag = (t: string) => ({ NOTICE: 'info', ANNOUNCEMENT: '', ALERT: 'warning' }[t] || 'info') as any
  const getTypeLabel = (t: string) => ({ NOTICE: '通知', ANNOUNCEMENT: '公告', ALERT: '警告' }[t] || t)
  const getLevelTag = (l: string) => ({ NORMAL: 'info', IMPORTANT: 'warning', URGENT: 'danger' }[l] || 'info') as any
  const getLevelLabel = (l: string) => ({ NORMAL: '普通', IMPORTANT: '重要', URGENT: '紧急' }[l] || l)
  const getStatusTag = (s: string) => ({ DRAFT: 'info', PUBLISHED: 'success', EXPIRED: 'warning' }[s] || 'info') as any
  const getStatusLabel = (s: string) => ({ DRAFT: '草稿', PUBLISHED: '已发布', EXPIRED: '已过期' }[s] || s)

  const columns = computed(() => [
    { prop: 'title', label: '标题', minWidth: 200, showOverflowTooltip: true },
    {
      prop: 'type',
      label: '类型',
      width: 80,
      formatter: (row: AnnItem) => h(ElTag, { type: getTypeTag(row.type), size: 'small' }, () => getTypeLabel(row.type))
    },
    {
      prop: 'level',
      label: '级别',
      width: 80,
      formatter: (row: AnnItem) => h(ElTag, { type: getLevelTag(row.level), size: 'small' }, () => getLevelLabel(row.level))
    },
    {
      prop: 'status',
      label: '状态',
      width: 90,
      formatter: (row: AnnItem) => h(ElTag, { type: getStatusTag(row.status), size: 'small' }, () => getStatusLabel(row.status))
    },
    {
      prop: 'topFlag',
      label: '置顶',
      width: 70,
      formatter: (row: AnnItem) => row.topFlag ? h(ElTag, { type: 'danger', size: 'small' }, () => '置顶') : h('span', '-')
    },
    { prop: 'viewCount', label: '阅读', width: 70 },
    { prop: 'publishAt', label: '发布时间', width: 160 },
    { prop: 'createTime', label: '创建时间', width: 160 },
    {
      prop: 'operation',
      label: '操作',
      width: 220,
      fixed: 'right' as const,
      formatter: (row: AnnItem) =>
        h('div', [
          h(ElButton, { link: true, type: 'primary', onClick: () => handlePreview(row) }, () => '预览'),
          row.status === 'DRAFT'
            ? h(ElButton, { link: true, type: 'success', onClick: () => handlePublish(row) }, () => '发布')
            : null,
          h(ElButton, { link: true, type: 'primary', onClick: () => openDialog(row) }, () => '编辑'),
          h(ElButton, { link: true, type: 'danger', onClick: () => handleDelete(row) }, () => '删除')
        ].filter(Boolean))
    }
  ])

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchGetAnnouncementList({
        ...searchForm,
        current: pagination.current,
        size: pagination.size
      })
      records.value = res.records
      pagination.total = res.total
    } finally {
      loading.value = false
    }
  }

  function resetSearch() {
    Object.assign(searchForm, { title: '', type: '', status: '' })
    pagination.current = 1
    loadData()
  }

  function handleSizeChange(size: number) {
    pagination.size = size
    pagination.current = 1
    loadData()
  }

  function handleCurrentChange(page: number) {
    pagination.current = page
    loadData()
  }

  function openDialog(row?: AnnItem) {
    if (row) {
      Object.assign(form, {
        id: row.id,
        title: row.title,
        content: row.content || '',
        type: row.type,
        level: row.level,
        status: row.status,
        publishAt: row.publishAt || '',
        expireAt: row.expireAt || '',
        topFlag: row.topFlag,
        remark: row.remark || ''
      })
    } else {
      Object.assign(form, {
        id: 0, title: '', content: '', type: 'NOTICE', level: 'NORMAL',
        status: 'DRAFT', publishAt: '', expireAt: '', topFlag: false, remark: ''
      })
    }
    dialogVisible.value = true
  }

  async function handleSubmit(targetStatus: string) {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      const payload = { ...form, status: targetStatus }
      if (form.id) {
        await fetchUpdateAnnouncement(form.id, payload)
      } else {
        await fetchCreateAnnouncement(payload)
      }
      dialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  }

  function handlePreview(row: AnnItem) {
    previewItem.value = row
    previewVisible.value = true
  }

  async function handlePublish(row: AnnItem) {
    await ElMessageBox.confirm('确认发布该公告吗？', '提示', { type: 'warning' })
    await fetchPublishAnnouncement(row.id)
    loadData()
  }

  async function handleDelete(row: AnnItem) {
    await ElMessageBox.confirm('确认删除该公告吗？', '提示', { type: 'warning' })
    await fetchDeleteAnnouncement(row.id)
    loadData()
  }

  onMounted(loadData)
</script>

<style scoped>
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .card-header h3 {
    margin: 0;
    font-size: 16px;
  }
  .card-header p {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  .search-form {
    margin-bottom: 16px;
  }
  .announcement-preview {
    padding: 0 8px;
  }
  .preview-header h2 {
    margin: 0 0 12px;
    font-size: 20px;
    line-height: 1.4;
  }
  .preview-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .preview-time {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  .preview-content {
    line-height: 1.8;
    color: var(--el-text-color-regular);
  }
  .preview-content :deep(img) {
    max-width: 100%;
    border-radius: 4px;
  }
</style>
