// 详情抽屉展示辅助函数：保持 common-list.vue 只负责模板和渲染组合

export type FileGalleryItem = {
  id: string | number
  displayType?: 'image' | 'pdf' | 'video' | 'audio' | 'other' | string
  fileUrl?: string
  fileTypeName?: string
  fileName?: string
}

export type DetailHeaderStat = {
  label: string
  value: string | number | boolean | Date | null | undefined
  highlight?: boolean
}

export type PhaseFieldGroup = {
  fields: Array<{ prop?: string; value?: unknown }>
}

export function resolveHeaderStats(row: Record<string, unknown>): DetailHeaderStat[] {
  return [
    { label: '申请金额', value: `¥${row.amount || '-'}`, highlight: true },
    { label: '期限', value: `${row.term || '-'}个月` },
    { label: '年利率', value: formatRate(row.rate) },
    { label: '还款方式', value: String(row.repaymentMethod || '-') },
    { label: '创建人', value: String(row.creatorName || '-') },
    { label: '车牌号', value: String(row.plateNumber || '-') },
    { label: '当前节点', value: String(row.currentNodeName || '-') }
  ]
}

export function isFileGroup(group: PhaseFieldGroup): boolean {
  return group.fields.length === 1 && group.fields[0].prop === '_files'
}

export function fileGroupFiles(group: PhaseFieldGroup): FileGalleryItem[] {
  const value = group.fields[0]?.value
  return Array.isArray(value) ? (value as FileGalleryItem[]) : []
}

function formatRate(value: unknown): string {
  if (!value) return '-'
  const rate = Number(value)
  return Number.isFinite(rate) ? `${(rate * 100).toFixed(2)}%` : String(value)
}
