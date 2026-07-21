import request from '@/utils/http'

export interface DownloadNovelDto {
  url: string
  name?: string
  startChapter?: number
  endChapter?: number
  categoryId?: number
  cookie?: string
  userAgent?: string
}

export interface DownloadFanqieDto {
  url: string
  name?: string
  startChapter?: number
  endChapter?: number
  categoryId?: number
}

export interface TaskProgress {
  taskId: string
  status: 'running' | 'paused' | 'completed' | 'cancelled' | 'error'
  total: number
  completed: number
  failed: number
  current?: string
  error?: string
}

/** 下载小说（通用） */
export function fetchCrawlerDownload(data: DownloadNovelDto) {
  return request.post<{ taskId: string }>({ url: '/crawler/download', data })
}

/** 异步下载小说 */
export function fetchCrawlerDownloadAsync(data: DownloadNovelDto) {
  return request.post<{ taskId: string }>({ url: '/crawler/download-async', data })
}

/** 获取下载进度 */
export function fetchCrawlerProgress(taskId: string) {
  return request.get<TaskProgress>({ url: `/crawler/progress/${taskId}` })
}

/** 暂停下载 */
export function fetchCrawlerPause(taskId: string) {
  return request.post({ url: `/crawler/pause/${taskId}` })
}

/** 恢复下载 */
export function fetchCrawlerResume(taskId: string) {
  return request.post({ url: `/crawler/resume/${taskId}` })
}

/** 取消下载 */
export function fetchCrawlerCancel(taskId: string) {
  return request.post({ url: `/crawler/cancel/${taskId}` })
}

/** 清除任务 */
export function fetchCrawlerClear(taskId: string) {
  return request.post({ url: `/crawler/clear/${taskId}` })
}

/** 番茄小说下载 */
export function fetchFanqieDownload(data: DownloadFanqieDto) {
  return request.post<{ taskId: string }>({ url: '/crawler/fanqie', data })
}

/** 番茄小说异步下载 */
export function fetchFanqieDownloadAsync(data: DownloadFanqieDto) {
  return request.post<{ taskId: string }>({ url: '/crawler/fanqie-async', data })
}

/** 番茄小说下载进度 */
export function fetchFanqieProgress(taskId: string) {
  return request.get<TaskProgress>({ url: `/crawler/fanqie-progress/${taskId}` })
}

/** 番茄小说暂停 */
export function fetchFanqiePause(taskId: string) {
  return request.post({ url: `/crawler/fanqie-pause/${taskId}` })
}

/** 番茄小说恢复 */
export function fetchFanqieResume(taskId: string) {
  return request.post({ url: `/crawler/fanqie-resume/${taskId}` })
}

/** 番茄小说取消 */
export function fetchFanqieCancel(taskId: string) {
  return request.post({ url: `/crawler/fanqie-cancel/${taskId}` })
}

/** 番茄小说清除 */
export function fetchFanqieClear(taskId: string) {
  return request.post({ url: `/crawler/fanqie-clear/${taskId}` })
}
