/**
 * 前后端统一的 API 响应契约
 *
 * 与后端 NestJS `ApiResponse` / `PaginatedResponse` 对齐，
 * 供 saas-mobile API 客户端与页面复用，减少散落的 `any` / `unknown` 过渡型代码。
 */

/** 通用业务响应 */
export interface ApiResponse<T = unknown> {
  code: number
  msg?: string
  data?: T
}

/** 分页响应（records 形态） */
export interface PageResult<T = unknown> {
  records?: T[]
  total?: number
  current?: number
  size?: number
  pageNum?: number
  pageSize?: number
}

/** 统一错误响应 */
export interface ErrorResponse {
  code: number
  msg: string
}

/** 上传响应 */
export interface UploadResponse {
  id?: number
  url?: string
  fileUrl?: string
  previewUrl?: string
  rawUrl?: string
  objectKey?: string
  fileKey?: string
  fileName?: string
  fileSize?: number
  fileType?: string
  fileCode?: string
}

// ==================== 读书模块共享类型 ====================

export interface BookItem {
  id: number
  title: string
  author: string
  cover: string
  desc?: string
  categoryId?: number
  wordCount?: number
  chapterCount?: number
  price?: string
  isFree?: boolean
  isVip?: boolean
  isSerial?: boolean
  isFinished?: boolean
  isHot?: boolean
  isRecommend?: boolean
  rating?: string
  ratingCount?: number
  readCount?: number
  category?: CategoryItem
  originalPrice?: number
}

export interface BookDetail extends BookItem {
  isbn?: string
  publisher?: string
  publishDate?: string
  downloadCount?: number
  tags?: string
  status?: number
}

export interface BookListResult {
  items: BookItem[]
  total: number
  page: number
  pageSize: number
}

export interface CategoryItem {
  id: number
  name: string
  parentId?: number
  sort?: number
  status?: number
}

export interface ChapterItem {
  id: number
  bookId: number
  title: string
  content?: string
  wordCount?: number
  sort?: number
  isVip?: boolean
  price?: string | number
}

export interface ChapterLiteItem {
  id: number
  title: string
  sort: number
  isVip: boolean
}

export interface ChapterListResult {
  items: ChapterItem[]
  total: number
}

export interface ChapterContent {
  id: number
  title: string
  content: string
  bookId: number
}

export interface BookshelfItem {
  id: number
  bookId: number
  book?: BookItem
  progress?: number
  lastReadChapter?: string
  lastReadChapterId?: string | number
  lastReadTime?: string
}

export interface ReadingStatistics {
  bookCount: number
  categoryCount: number
  activeReaderCount: number
  totalReads: number
  personal?: {
    shelfCount: number
    completedCount: number
    todayReadMinutes: number
    totalReadMinutes: number
  }
}

export interface ReviewItem {
  id: number
  bookId: number
  userId: number
  rating: number
  content: string
  status: number
  createdAt: string
  user?: { nickname?: string; avatar?: string }
  book?: { title?: string }
}

export interface ReviewListResult {
  items: ReviewItem[]
  total: number
  page: number
  pageSize: number
}
