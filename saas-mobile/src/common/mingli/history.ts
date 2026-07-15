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

function formatRecordTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
