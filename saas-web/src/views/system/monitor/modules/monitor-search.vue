<template>
  <ElCard class="mb-5">
    <ElForm :model="model" inline>
      <ElFormItem label="事件" prop="keyword">
        <ElInput v-model="model.keyword" placeholder="搜索事件/消息" clearable />
      </ElFormItem>
      <ElFormItem label="类型" prop="type">
        <ElSelect v-model="model.type" placeholder="全部" clearable>
          <ElOption label="错误" value="error" />
          <ElOption label="性能" value="performance" />
          <ElOption label="行为" value="action" />
          <ElOption label="请求" value="request" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="页面" prop="page">
        <ElInput v-model="model.page" placeholder="页面路径" clearable />
      </ElFormItem>
      <ElFormItem label="状态码" prop="statusCode">
        <ElInput v-model="model.statusCode" placeholder="如 404" clearable />
      </ElFormItem>
      <ElFormItem>
        <ElSpace>
          <ElButton type="primary" @click="$emit('search', model)">查询</ElButton>
          <ElButton @click="$emit('reset', resetForm)">重置</ElButton>
        </ElSpace>
      </ElFormItem>
    </ElForm>
  </ElCard>
</template>

<script setup lang="ts">
  import { reactive } from 'vue'

  defineOptions({ name: 'MonitorSearch' })

  const model = reactive({
    keyword: '',
    type: '',
    page: '',
    statusCode: ''
  })

  const resetForm = () => {
    model.keyword = ''
    model.type = ''
    model.page = ''
    model.statusCode = ''
  }
</script>
