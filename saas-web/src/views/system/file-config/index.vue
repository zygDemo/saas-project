<template>
  <div class="file-config-page art-full-height">
    <ElCard class="art-card-xs mb-4">
      <template #header>
        <div class="config-header">
          <div>
            <h3>文件存储配置</h3>
            <p>管理系统文件存储策略、对象存储服务商及上传限制。</p>
          </div>
          <ElSpace>
            <ElButton type="primary" :loading="saving" @click="saveConfig">保存配置</ElButton>
            <ElButton @click="loadConfig">重置</ElButton>
          </ElSpace>
        </div>
      </template>

      <ElForm :model="form" label-width="140px" class="config-form">
        <ElDivider content-position="left">存储服务商</ElDivider>
        <ElFormItem label="存储类型" required>
          <ElSelect v-model="form.storageType" style="width: 260px" @change="onStorageTypeChange">
            <ElOption label="本地存储" value="LOCAL" />
            <ElOption label="阿里云 OSS" value="OSS" />
            <ElOption label="腾讯云 COS" value="COS" />
            <ElOption label="AWS S3" value="S3" />
          </ElSelect>
        </ElFormItem>

        <template v-if="form.storageType !== 'LOCAL'">
          <ElFormItem label="Endpoint" required>
            <ElInput
              v-model="form.endpoint"
              placeholder="如 https://oss-cn-hangzhou.aliyuncs.com"
            />
          </ElFormItem>
          <ElFormItem label="Bucket" required>
            <ElInput v-model="form.bucket" placeholder="Bucket 名称" />
          </ElFormItem>
          <ElFormItem label="Region">
            <ElInput v-model="form.region" placeholder="如 cn-hangzhou（S3 需要）" />
          </ElFormItem>
          <ElFormItem label="Access Key">
            <ElInput v-model="form.accessKey" placeholder="AccessKey ID" />
          </ElFormItem>
          <ElFormItem label="Secret Key">
            <ElInput
              v-model="form.secretKey"
              type="password"
              show-password
              placeholder="AccessKey Secret"
            />
          </ElFormItem>
          <ElFormItem label="自定义域名">
            <ElInput v-model="form.customDomain" placeholder="CDN / 自定义域名（可选）" />
          </ElFormItem>
        </template>
      </ElForm>
    </ElCard>

    <ElCard class="art-card-xs">
      <template #header>
        <div class="config-header">
          <h3>上传策略</h3>
        </div>
      </template>

      <ElForm :model="form" label-width="140px">
        <ElFormItem label="单文件上限 (MB)">
          <ElInputNumber
            v-model="form.maxFileSize"
            :min="1"
            :max="500"
            controls-position="right"
            style="width: 200px"
          />
        </ElFormItem>
        <ElFormItem label="允许的文件类型">
          <ElSelect
            v-model="form.allowedTypes"
            multiple
            filterable
            allow-create
            placeholder="不限制则留空"
            style="width: 500px"
          >
            <ElOption label="图片 (jpg, png, gif, webp)" value="image/*" />
            <ElOption label="文档 (pdf, doc, docx, xls, xlsx)" value=".pdf,.doc,.docx,.xls,.xlsx" />
            <ElOption label="压缩包 (zip, rar)" value=".zip,.rar" />
            <ElOption label="视频 (mp4, avi)" value="video/*" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="文件路径前缀">
          <ElInput
            v-model="form.pathPrefix"
            placeholder="如 uploads/、files/（可选）"
            style="width: 300px"
          />
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard v-if="form.storageType !== 'LOCAL'" class="art-card-xs mt-4">
      <template #header>
        <div class="config-header">
          <h3>连接测试</h3>
        </div>
      </template>

      <ElSpace>
        <ElButton :loading="testing" @click="testConnection">测试连接</ElButton>
        <ElTag v-if="testResult !== null" :type="testResult ? 'success' : 'danger'">
          {{ testResult ? '连接成功' : '连接失败' }}
        </ElTag>
      </ElSpace>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'

  defineOptions({ name: 'FileConfig' })

  interface StorageConfig {
    storageType: string
    endpoint: string
    bucket: string
    region: string
    accessKey: string
    secretKey: string
    customDomain: string
    maxFileSize: number
    allowedTypes: string[]
    pathPrefix: string
  }

  const saving = ref(false)
  const testing = ref(false)
  const testResult = ref<boolean | null>(null)
  const form = reactive<StorageConfig>({
    storageType: 'LOCAL',
    endpoint: '',
    bucket: '',
    region: '',
    accessKey: '',
    secretKey: '',
    customDomain: '',
    maxFileSize: 10,
    allowedTypes: [],
    pathPrefix: 'uploads/'
  })

  const defaultForm = { ...form }

  onMounted(() => {
    loadConfig()
  })

  function loadConfig() {
    try {
      const saved = localStorage.getItem('fileStorageConfig')
      if (saved) {
        Object.assign(form, JSON.parse(saved))
      }
    } catch {
      // 使用默认配置
    }
  }

  function onStorageTypeChange() {
    testResult.value = null
  }

  async function saveConfig() {
    if (form.storageType !== 'LOCAL') {
      if (!form.endpoint) {
        ElMessage.warning('请输入 Endpoint')
        return
      }
      if (!form.bucket) {
        ElMessage.warning('请输入 Bucket 名称')
        return
      }
    }

    saving.value = true
    try {
      localStorage.setItem('fileStorageConfig', JSON.stringify(form))
      Object.assign(defaultForm, form)
      ElMessage.success('存储配置已保存')
    } finally {
      saving.value = false
    }
  }

  async function testConnection() {
    testing.value = true
    testResult.value = null

    try {
      // 模拟连接测试（后续对接真实 API）
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (form.endpoint && form.bucket && form.accessKey) {
        testResult.value = true
        ElMessage.success('存储服务连接正常')
      } else {
        testResult.value = false
        ElMessage.warning('请填写完整的连接信息后再测试')
      }
    } catch {
      testResult.value = false
      ElMessage.error('连接测试失败，请检查配置')
    } finally {
      testing.value = false
    }
  }
</script>

<style scoped lang="scss">
  .file-config-page {
    .config-header {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 600;
      }

      p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: var(--el-text-color-secondary);
      }
    }

    .config-form {
      max-width: 640px;
    }
  }
</style>
