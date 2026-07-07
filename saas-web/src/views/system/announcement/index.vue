<template>
  <div class="announcement-page art-full-height">
    <div class="page-hero">
      <div class="page-hero__icon">
        <i class="ri-notification-3-line"></i>
      </div>
      <div class="page-hero__content">
        <div class="page-hero__eyebrow">Operation Notice</div>
        <h2>公告管理</h2>
        <p>发布和管理系统公告通知，支持草稿、定时发布、置顶和到期控制。</p>
      </div>
      <div class="page-hero__actions">
        <ElButton v-auth="'add'" type="primary" @click="openDialog()">
          <ElIcon class="mr-1"><Plus /></ElIcon>新增公告
        </ElButton>
      </div>
    </div>

    <ArtSearchBar
      v-model="searchModel"
      :items="searchItems"
      :span="6"
      :show-expand="false"
      @search="handleSearch"
      @reset="resetSearch"
    />

    <ElCard class="art-table-card announcement-table-card">
      <ArtTableHeader :loading="loading" layout="refresh,size,fullscreen,columns,settings" @refresh="loadData">
        <template #left>
          <div class="table-title">
            <span>公告列表</span>
            <ElTag effect="plain" size="small">共 {{ pagination.total }} 条</ElTag>
          </div>
        </template>
      </ArtTableHeader>

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
      width="760px"
      top="5vh"
      class="announcement-dialog"
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="92px" class="announcement-form">
        <div class="form-section">基础信息</div>
        <ElFormItem label="公告标题" prop="title">
          <ElInput v-model="form.title" maxlength="200" show-word-limit placeholder="请输入公告标题" />
        </ElFormItem>
        <ElRow :gutter="16">
          <ElCol :xs="24" :sm="12">
            <ElFormItem label="公告类型">
              <ElSelect v-model="form.type" class="w-full">
                <ElOption v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :sm="12">
            <ElFormItem label="重要程度">
              <ElSelect v-model="form.level" class="w-full">
                <ElOption v-for="item in levelOptions" :key="item.value" :label="item.label" :value="item.value" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="16">
          <ElCol :xs="24" :sm="12">
            <ElFormItem label="发布时间">
              <ElDatePicker
                v-model="form.publishAt"
                type="datetime"
                placeholder="不填则发布时立即生效"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :sm="12">
            <ElFormItem label="过期时间">
              <ElDatePicker
                v-model="form.expireAt"
                type="datetime"
                placeholder="不填则长期有效"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="16">
          <ElCol :xs="24" :sm="12">
            <ElFormItem label="发布范围">
              <ElInput v-model="form.target" maxlength="100" placeholder="如：全部用户 / 管理员 / 指定机构" />
            </ElFormItem>
          </ElCol>
          <ElCol :xs="24" :sm="12">
            <ElFormItem label="置顶展示">
              <ElSwitch v-model="form.topFlag" active-text="置顶" inactive-text="普通" />
            </ElFormItem>
          </ElCol>
        </ElRow>

        <div class="form-section">公告内容</div>
        <ElFormItem label="内容" prop="content">
          <ElInput
            v-model="form.content"
            type="textarea"
            :autosize="{ minRows: 8, maxRows: 14 }"
            placeholder="请输入公告内容，支持 HTML 片段"
          />
        </ElFormItem>
        <ElFormItem label="备注">
          <ElInput v-model="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit placeholder="可选" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton :loading="submitting" @click="handleSubmit('DRAFT')">保存草稿</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit('PUBLISHED')">保存并发布</ElButton>
      </template>
    </ElDialog>

    <!-- 详情预览 -->
    <ElDialog v-model="previewVisible" title="公告预览" width="720px" class="announcement-preview-dialog">
      <div v-if="previewItem" class="announcement-preview">
        <div class="preview-header">
          <div>
            <h2>{{ previewItem.title }}</h2>
            <div class="preview-meta">
              <ElTag :type="getTypeTag(previewItem.type)" size="small">{{ getTypeLabel(previewItem.type) }}</ElTag>
              <ElTag :type="getLevelTag(previewItem.level)" size="small">{{ getLevelLabel(previewItem.level) }}</ElTag>
              <ElTag :type="getStatusTag(previewItem.status)" size="small">{{ getStatusLabel(previewItem.status) }}</ElTag>
            </div>
          </div>
          <div class="preview-time">
            {{ previewItem.publishAt || previewItem.createTime }}
          </div>
        </div>
        <ElDivider />
        <div class="preview-content" v-html="previewItem.content || '暂无内容'"></div>
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
    fetchUnpublishAnnouncement,
    fetchExpireAnnouncement,
    fetchDeleteAnnouncement
  } from '@/api/system-manage'
  import { ElMessage, ElMessageBox, ElTag, ElButton, ElSpace } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import type { FormInstance, FormRules } from 'element-plus'

  defineOptions({ name: 'Announcement' })

  type AnnItem = Api.SystemManage.AnnouncementItem
  type TagType = '' | 'info' | 'success' | 'warning' | 'danger'

  const loading = ref(false)
  const submitting = ref(false)
  const records = ref<AnnItem[]>([])
  const dialogVisible = ref(false)
  const previewVisible = ref(false)
  const previewItem = ref<AnnItem | null>(null)
  const formRef = ref<FormInstance>()

  const searchModel = ref<Record<string, unknown>>({})
  const searchForm = reactive({ title: '', type: '', level: '', status: '' })
  const pagination = reactive({ current: 1, size: 20, total: 0 })

  const typeOptions = [
    { label: '通知', value: 'NOTICE' },
    { label: '公告', value: 'ANNOUNCEMENT' },
    { label: '警告', value: 'ALERT' }
  ]
  const levelOptions = [
    { label: '普通', value: 'NORMAL' },
    { label: '重要', value: 'IMPORTANT' },
    { label: '紧急', value: 'URGENT' }
  ]
  const statusOptions = [
    { label: '草稿', value: 'DRAFT' },
    { label: '已发布', value: 'PUBLISHED' },
    { label: '已过期', value: 'EXPIRED' }
  ]

  const searchItems = computed(() => [
    { key: 'title', label: '公告标题', type: 'input' as const, placeholder: '请输入公告标题', clearable: true },
    { key: 'type', label: '类型', type: 'select' as const, props: { options: typeOptions, clearable: true, filterable: true } },
    { key: 'level', label: '级别', type: 'select' as const, props: { options: levelOptions, clearable: true, filterable: true } },
    { key: 'status', label: '状态', type: 'select' as const, props: { options: statusOptions, clearable: true, filterable: true } }
  ])

  const form = reactive({
    id: 0,
    title: '',
    content: '',
    type: 'NOTICE',
    level: 'NORMAL',
    status: 'DRAFT',
    publishAt: '',
    expireAt: '',
    target: '',
    topFlag: false,
    remark: ''
  })

  const rules: FormRules = {
    title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
    content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
  }

  const getTypeTag = (t: string): TagType => ({ NOTICE: 'info', ANNOUNCEMENT: '', ALERT: 'warning' } as Record<string, TagType>)[t] || 'info'
  const getTypeLabel = (t: string) => ({ NOTICE: '通知', ANNOUNCEMENT: '公告', ALERT: '警告' }[t] || t)
  const getLevelTag = (l: string): TagType => ({ NORMAL: 'info', IMPORTANT: 'warning', URGENT: 'danger' } as Record<string, TagType>)[l] || 'info'
  const getLevelLabel = (l: string) => ({ NORMAL: '普通', IMPORTANT: '重要', URGENT: '紧急' }[l] || l)
  const getStatusTag = (s: string): TagType => ({ DRAFT: 'info', PUBLISHED: 'success', EXPIRED: 'warning' } as Record<string, TagType>)[s] || 'info'
  const getStatusLabel = (s: string) => ({ DRAFT: '草稿', PUBLISHED: '已发布', EXPIRED: '已过期' }[s] || s)

  const columns = computed(() => [
    {
      prop: 'title',
      label: '公告标题',
      minWidth: 240,
      formatter: (row: AnnItem) =>
        h('div', { class: 'announcement-title-cell' }, [
          h('span', { class: 'announcement-title-cell__text' }, row.title),
          row.topFlag ? h(ElTag, { type: 'danger', size: 'small', effect: 'plain' }, () => '置顶') : null
        ])
    },
    {
      prop: 'type',
      label: '类型',
      width: 90,
      formatter: (row: AnnItem) => h(ElTag, { type: getTypeTag(row.type), size: 'small' }, () => getTypeLabel(row.type))
    },
    {
      prop: 'level',
      label: '级别',
      width: 90,
      formatter: (row: AnnItem) => h(ElTag, { type: getLevelTag(row.level), size: 'small' }, () => getLevelLabel(row.level))
    },
    {
      prop: 'status',
      label: '状态',
      width: 100,
      formatter: (row: AnnItem) => h(ElTag, { type: getStatusTag(row.status), size: 'small' }, () => getStatusLabel(row.status))
    },
    { prop: 'target', label: '发布范围', width: 120, showOverflowTooltip: true },
    { prop: 'viewCount', label: '阅读', width: 80, align: 'center' as const },
    { prop: 'publishAt', label: '发布时间', width: 170 },
    { prop: 'expireAt', label: '过期时间', width: 170 },
    {
      prop: 'operation',
      label: '操作',
      width: 260,
      fixed: 'right' as const,
      formatter: (row: AnnItem) =>
        h(ElSpace, { size: 4 }, () => [
          h(ElButton, { link: true, type: 'primary', onClick: () => handlePreview(row) }, () => '预览'),
          row.status !== 'PUBLISHED'
            ? h(ElButton, { link: true, type: 'success', onClick: () => handlePublish(row) }, () => '发布')
            : h(ElButton, { link: true, type: 'warning', onClick: () => handleUnpublish(row) }, () => '撤回'),
          row.status !== 'EXPIRED'
            ? h(ElButton, { link: true, type: 'warning', onClick: () => handleExpire(row) }, () => '过期')
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

  function handleSearch(params: Record<string, unknown>) {
    Object.assign(searchForm, {
      title: String(params.title || ''),
      type: String(params.type || ''),
      level: String(params.level || ''),
      status: String(params.status || '')
    })
    pagination.current = 1
    loadData()
  }

  function resetSearch() {
    searchModel.value = {}
    Object.assign(searchForm, { title: '', type: '', level: '', status: '' })
    pagination.current = 1
    loadData()
  }

  function handleSizeChange(size: number) {
    pagination.size = size
    pagination.current = 1
    loadData()
  }

  function handleCurrentChange(current: number) {
    pagination.current = current
    loadData()
  }

  function resetForm() {
    Object.assign(form, {
      id: 0,
      title: '',
      content: '',
      type: 'NOTICE',
      level: 'NORMAL',
      status: 'DRAFT',
      publishAt: '',
      expireAt: '',
      target: '',
      topFlag: false,
      remark: ''
    })
  }

  function openDialog(row?: AnnItem) {
    resetForm()
    if (row) {
      Object.assign(form, {
        ...row,
        publishAt: row.publishAt || '',
        expireAt: row.expireAt || '',
        target: row.target || '',
        remark: row.remark || ''
      })
    }
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  async function handleSubmit(targetStatus: 'DRAFT' | 'PUBLISHED') {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
    submitting.value = true
    try {
      const payload = { ...form, status: targetStatus }
      if (form.id) await fetchUpdateAnnouncement(form.id, payload)
      else await fetchCreateAnnouncement(payload)
      ElMessage.success(targetStatus === 'PUBLISHED' ? '已保存并发布' : '草稿已保存')
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

  async function handleUnpublish(row: AnnItem) {
    await ElMessageBox.confirm('确认撤回该公告并转为草稿吗？', '提示', { type: 'warning' })
    await fetchUnpublishAnnouncement(row.id)
    loadData()
  }

  async function handleExpire(row: AnnItem) {
    await ElMessageBox.confirm('确认将该公告设为过期吗？', '提示', { type: 'warning' })
    await fetchExpireAnnouncement(row.id)
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
  .announcement-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .page-hero {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 18px 20px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: var(--el-box-shadow-lighter);
  }

  .page-hero__icon {
    display: flex;
    flex: 0 0 46px;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    font-size: 24px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 12px;
  }

  .page-hero__content {
    flex: 1;
    min-width: 0;
  }

  .page-hero__eyebrow {
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-color-primary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .page-hero h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  .page-hero p {
    margin: 6px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .page-hero__actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
  }

  .announcement-table-card :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .table-title {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .announcement-title-cell {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .announcement-title-cell__text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .form-section {
    padding: 12px 0 10px;
    margin-bottom: 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .announcement-form {
    max-height: 65vh;
    padding-right: 10px;
    overflow: auto;
  }

  .announcement-preview {
    padding: 0 8px;
  }

  .preview-header {
    display: flex;
    gap: 12px;
    justify-content: space-between;
  }

  .preview-header h2 {
    margin: 0 0 12px;
    font-size: 20px;
    line-height: 1.4;
  }

  .preview-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .preview-time {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .preview-content {
    line-height: 1.8;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
  }

  .preview-content :deep(img) {
    max-width: 100%;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .page-hero {
      align-items: flex-start;
    }

    .page-hero__actions {
      width: 100%;
    }
  }
</style>
