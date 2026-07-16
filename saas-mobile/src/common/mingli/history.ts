export type MingliRecordType = 'bazi' | 'liuyao'

export interface MingliHistoryRecord {
  id: string
  type: MingliRecordType
  title: string
  subtitle: string
  time: string
  timestamp: number
  data: Record<string, unknown>
}

const STORAGE_KEY = 'mingli_history'
const MAX_RECORDS = 50

export function getMingliHistory(): MingliHistoryRecord[] {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    if (!stored) return []
    const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is MingliHistoryRecord => Boolean(item?.id && item?.type && item?.data))
      .sort((a, b) => b.timestamp - a.timestamp)
  } catch {
    return []
  }
}

export function saveMingliRecord(record: Omit<MingliHistoryRecord, 'id' | 'time' | 'timestamp'>): MingliHistoryRecord {
  const now = new Date()
  const saved: MingliHistoryRecord = {
    ...record,
    id: `${record.type}-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    time: formatRecordTime(now),
    timestamp: now.getTime()
  }
  const records = [saved, ...getMingliHistory()].slice(0, MAX_RECORDS)
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
  return saved
}

export function getMingliRecord(id: string): MingliHistoryRecord | undefined {
  return getMingliHistory().find(item => item.id === id)
}

export function removeMingliRecord(id: string) {
  const records = getMingliHistory().filter(item => item.id !== id)
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
}

export function clearMingliHistory() {
  uni.removeStorageSync(STORAGE_KEY)
}

/** 导出历史记录为JSON */
export function exportMingliHistory(): string {
  const records = getMingliHistory()
  return JSON.stringify(records, null, 2)
}

/** 导出历史记录为文本 */
export function exportMingliHistoryAsText(): string {
  const records = getMingliHistory()
  if (records.length === 0) return '暂无历史记录'

  let text = '=== 命理历史记录 ===\n\n'
  records.forEach((record, index) => {
    text += `${index + 1}. ${record.title}\n`
    text += `   类型：${record.type === 'bazi' ? '八字排盘' : '六爻问事'}\n`
    text += `   时间：${record.time}\n`
    text += `   描述：${record.subtitle}\n\n`
  })
  text += `共 ${records.length} 条记录`
  return text
}

function formatRecordTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
