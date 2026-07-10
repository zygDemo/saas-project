import request from '@/utils/http'
import {} from '@/store/modules/user'

// 租户ID（与 http/index.ts 保持一致）

// ==================== 书籍分类 ====================

/** 获取书籍分类列表（支持树形和搜索） */
export function getBookCategories(params?: { tree?: boolean; keyword?: string }) {
  return request.get({ url: '/reading/categories', params })
}

/** 获取书籍分类详情 */
export function getBookCategoryById(id: number) {
  return request.get({ url: `/reading/categories/${id}` })
}

/** 批量启用/禁用分类 */
export function batchUpdateCategoryStatus(data: { ids: number[]; status: number }) {
  return request.post({ url: '/reading/categories/batch-status', data, showSuccessMessage: true })
}

/** 创建书籍分类 */
export function createBookCategory(data: { name: string; parentId?: number; sort?: number }) {
  return request.post({ url: '/reading/categories', data, showSuccessMessage: true })
}

/** 更新书籍分类 */
export function updateBookCategory(
  id: number,
  data: {
    name?: string
    parentId?: number
    sort?: number
    status?: number
  }
) {
  return request.put({ url: `/reading/categories/${id}`, data, showSuccessMessage: true })
}

/** 删除书籍分类 */
export function deleteBookCategory(id: number) {
  return request.del({ url: `/reading/categories/${id}`, showSuccessMessage: true })
}

// ==================== 书籍管理 ====================

/** 获取书籍列表 */
export function getBooks(params?: {
  keyword?: string
  categoryId?: number
  status?: number
  isHot?: boolean
  isRecommend?: boolean
  isFinished?: boolean
  page?: number
  pageSize?: number
}) {
  return request.get({ url: '/reading/books', params })
}

/** 获取书籍详情 */
export function getBookById(id: number) {
  return request.get({ url: `/reading/books/${id}` })
}

/** 创建书籍 */
export function createBook(data: {
  title: string
  author: string
  cover?: string
  desc?: string
  categoryId?: number
  isbn?: string
  publisher?: string
  publishDate?: string
  wordCount?: number
  price?: number
  isFree?: boolean
  isVip?: boolean
  isSerial?: boolean
  tags?: string
}) {
  return request.post({ url: '/reading/books', data })
}

/** 上传 TXT 文件创建图书（自动分章） — 使用原生 fetch 绕过 axios 拦截器，确保 FormData 正确发送 */
export async function uploadTxtBook(formData: FormData) {
  return request.upload<unknown>({
    url: '/reading/books/upload-txt',
    data: formData,
    showErrorMessage: true
  })
}

/** 更新书籍 */
export function updateBook(
  id: number,
  data: {
    title?: string
    author?: string
    cover?: string
    desc?: string
    categoryId?: number
    isbn?: string
    publisher?: string
    publishDate?: string
    wordCount?: number
    price?: number
    isFree?: boolean
    isVip?: boolean
    isSerial?: boolean
    isHot?: boolean
    isRecommend?: boolean
    status?: number
    sort?: number
    tags?: string
  }
) {
  return request.put({ url: `/reading/books/${id}`, data })
}

/** 删除书籍 */
export function deleteBook(id: number) {
  return request.del({ url: `/reading/books/${id}` })
}

// ==================== 章节管理 ====================

/** 获取章节列表 */
export function getChapters(params: {
  bookId: number
  page?: number
  pageSize?: number
  keyword?: string
}) {
  return request.get({ url: '/reading/chapters', params })
}

/** 获取章节详情 */
export function getChapterById(id: number) {
  return request.get({ url: `/reading/chapters/${id}` })
}

/** 创建章节 */
export function createChapter(data: {
  bookId: number
  title: string
  content?: string
  sort?: number
  isVip?: boolean
  price?: number
}) {
  return request.post({ url: '/reading/chapters', data, showSuccessMessage: true })
}

/** 更新章节 */
export function updateChapter(
  id: number,
  data: {
    title?: string
    content?: string
    sort?: number
    isVip?: boolean
    price?: number
  }
) {
  return request.put({ url: `/reading/chapters/${id}`, data, showSuccessMessage: true })
}

/** 删除章节 */
export function deleteChapter(id: number) {
  return request.del({ url: `/reading/chapters/${id}`, showSuccessMessage: true })
}

// ==================== 用户书架 ====================

/** 获取用户书架 */
export function getUserBookshelf() {
  return request.get({ url: '/reading/bookshelf' })
}

/** 加入书架 */
export function addToBookshelf(bookId: number) {
  return request.post({ url: '/reading/bookshelf', data: { bookId } })
}

/** 移出书架 */
export function removeFromBookshelf(bookId: number) {
  return request.del({ url: `/reading/bookshelf/${bookId}` })
}

// ==================== 阅读进度 ====================

/** 获取阅读进度 */
export function getReadingProgress(bookId: number) {
  return request.get({ url: `/reading/progress/${bookId}` })
}

/** 保存阅读进度 */
export function saveReadingProgress(data: {
  bookId: number
  chapterId: number
  page?: number
  progress?: number
  readTime?: number
}) {
  return request.post({ url: '/reading/progress', data })
}

// ==================== 书籍评价 ====================

/** 获取书籍评价（管理员可查全部，不传bookId） */
export function getBookReviews(params?: {
  bookId?: number
  keyword?: string
  status?: number
  page?: number
  pageSize?: number
}) {
  return request.get({ url: '/reading/reviews', params })
}

/** 创建书籍评价 */
export function createBookReview(data: { bookId: number; rating: number; content?: string }) {
  return request.post({ url: '/reading/reviews', data })
}

/** 审核评价（通过/驳回） */
export function updateReviewStatus(data: { id: number; status: number }) {
  return request.put({ url: '/reading/reviews/status', data, showSuccessMessage: true })
}

/** 删除评价（管理员） */
export function deleteReview(id: number) {
  return request.del({ url: `/reading/reviews/${id}`, showSuccessMessage: true })
}

// ==================== 统计 ====================

/** 获取读书统计 */
export function getReadingStatistics() {
  return request.get({ url: '/reading/statistics' })
}

/** 获取热门书籍 */
export function getHotBooks(limit?: number) {
  return request.get({ url: '/reading/hot', params: { limit } })
}

/** 获取推荐书籍 */
export function getRecommendBooks(limit?: number) {
  return request.get({ url: '/reading/recommend', params: { limit } })
}

// ==================== 爬虫下载 ====================

/** 爬取小说并自动入库（同步） */
export function crawlNovel(data: {
  url: string
  name?: string
  startChapter?: number
  endChapter?: number
  categoryId?: number
}) {
  return request.post({ url: '/crawler/download', data, timeout: 600000 })
}

/** 异步爬取小说（返回taskId，可轮询进度） */
export function crawlNovelAsync(
  data: {
    url: string
    name?: string
    startChapter?: number
    endChapter?: number
    categoryId?: number
  },
  config?: { signal?: AbortSignal }
) {
  return request.post({ url: '/crawler/download-async', data, ...config })
}

/** 获取爬取进度 */
export function getCrawlProgress(taskId: string) {
  return request.get({ url: `/crawler/progress/${taskId}` })
}

/** 暂停爬取任务 */
export function pauseCrawlTask(taskId: string) {
  return request.post({ url: `/crawler/pause/${taskId}` })
}

/** 恢复爬取任务 */
export function resumeCrawlTask(taskId: string) {
  return request.post({ url: `/crawler/resume/${taskId}` })
}

/** 取消爬取任务 */
export function cancelCrawlTask(taskId: string) {
  return request.post({ url: `/crawler/cancel/${taskId}` })
}

// ==================== 阅读笔记/高亮 ====================

/** 获取当前用户的笔记列表 */
export function getReadingNotes(params?: {
  bookId?: number
  chapterId?: number
  page?: number
  pageSize?: number
}) {
  return request.get({ url: '/reading/notes', params })
}

/** 获取指定章节的笔记 */
export function getNotesByChapter(bookId: number, chapterId: number) {
  return request.get({ url: `/reading/notes/chapter/${bookId}/${chapterId}` })
}

/** 创建笔记/高亮 */
export function createReadingNote(data: {
  bookId: number
  chapterId: number
  highlight?: string
  note?: string
  color?: string
  startPos?: number
  endPos?: number
}) {
  return request.post({ url: '/reading/notes', data })
}

/** 更新笔记 */
export function updateReadingNote(
  id: number,
  data: { note?: string; color?: string; status?: number }
) {
  return request.put({ url: `/reading/notes/${id}`, data, showSuccessMessage: true })
}

/** 删除笔记 */
export function deleteReadingNote(id: number) {
  return request.del({ url: `/reading/notes/${id}`, showSuccessMessage: true })
}
