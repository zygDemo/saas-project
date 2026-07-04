// common-list 业务组件类型定义

export type FieldType = 'text' | 'number' | 'textarea' | 'json' | 'select' | 'switch' | 'date'

export type OptionConfig = { label: string; value: string | number | boolean }

export type RemoteOptionsConfig = {
  module: string
  labelField?: string
  valueField?: string
  params?: Record<string, unknown> | ((model: FormModel) => Record<string, unknown>)
}

export type FilterConfig = {
  prop: string
  label: string
  type: 'select' | 'number' | 'text'
  options?: OptionConfig[]
  remoteOptions?: RemoteOptionsConfig
}

export type ColumnConfig = { prop: string; label: string; width?: number }

export type FieldConfig = {
  prop: string
  label: string
  type?: FieldType
  required?: boolean
  precision?: number
  defaultValue?: unknown
  options?: OptionConfig[]
  remoteOptions?: RemoteOptionsConfig
  placeholder?: string
  group?: string
  unit?: string
  transform?: 'percent'
}

export type ActionConfig = {
  name: string
  label: string
  path: (row: Record<string, unknown>) => string
  visible?: (row: Record<string, unknown>) => boolean
  fields?: FieldConfig[]
  defaults?: (row: Record<string, unknown>) => Record<string, unknown>
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export type PageConfig = {
  title: string
  description: string
  api: string
  listApi?: string
  readonly?: boolean
  keywordField?: string
  keywordParam?: string
  keywordPlaceholder?: string
  columns: ColumnConfig[]
  detailColumns?: ColumnConfig[]
  formFields: FieldConfig[]
  statusMap?: Record<string, string>
  actions: ActionConfig[]
  filters?: FilterConfig[]
}

export type BusinessRouteMeta = {
  businessModule?: string
  defaultQuery?: Record<string, unknown>
}

export type FormValue = string | number | boolean | Date | string[] | number[] | null | undefined
export type FormModel = Record<string, FormValue>

// 搜索表单项类型
export type SearchFormItemType = 'input' | 'select' | 'number'

export type SearchFormItem = {
  key: string
  label: string
  type: SearchFormItemType
  placeholder?: string
  clearable?: boolean
  props?: {
    placeholder?: string
    clearable?: boolean
    filterable?: boolean
    options?: OptionConfig[]
  }
}

// 列检查项类型
export type ColumnCheck = {
  label: string
  prop: string
  checked: boolean
}

// 文件项类型
export type FileItem = {
  id?: number
  fileName?: string
  fileUrl?: string
  fileSize?: number
  fileType?: string
  displayType?: 'image' | 'pdf' | 'video' | 'audio' | 'other'
  createdAt?: string
}

// 阶段动作类型
export type PhaseAction = {
  name: string
  label: string
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  visible: (row: Record<string, unknown>) => boolean
}

// 阶段配置类型
export type PhaseConfig = {
  code: number
  name: string
  nodes: number[]
  actions: PhaseAction[]
}

// 节点字段定义类型
export type NodeFieldDef = {
  source?: string
  label: string
  fields: string[]
}

// 上传响应类型
export type UploadResponse = {
  url?: string
  data?: { url?: string }
}
