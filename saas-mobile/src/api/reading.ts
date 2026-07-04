import { http } from "uview-pro";

export function useReadingApi() {
  return {
    /** 获取图书列表 */
    getBooks: (params?: { page?: number; pageSize?: number; categoryId?: number; keyword?: string }) =>
      http.get<ApiResponse<BookListResult>>("/reading/books", params),

    /** 获取图书详情 */
    getBookDetail: (id: number | string) =>
      http.get<ApiResponse<BookDetail>>(`/reading/books/${id}`),

    /** 获取图书分类 */
    getCategories: () =>
      http.get<ApiResponse<CategoryItem[]>>("/reading/categories"),

    /** 获取章节目录（轻量版，仅 id/title/sort/isVip，无分页） */
    getChaptersLite: (bookId: number | string) =>
      http.get<ApiResponse<{ items: ChapterLiteItem[] }>>(`/reading/chapters/lite`, { bookId }),

    /** 获取章节目录（分页版） */
    getChapters: (bookId: number | string, params?: { page?: number; pageSize?: number }) =>
      http.get<ApiResponse<ChapterListResult>>(`/reading/chapters`, { bookId, ...(params || {}) }),

    /** 获取章节内容 */
    /** 根据章节ID获取章节详情（含 content） */
    getChapterDetail: (chapterId: number | string) =>
      http.get<ApiResponse<ChapterContent>>(`/reading/chapters/${chapterId}`),

    /** 加入书架 */
    addToBookshelf: (bookId: number | string) =>
      http.post<ApiResponse<any>>("/reading/bookshelf", { bookId }),

    /** 移出书架 */
    removeFromBookshelf: (bookId: number | string) =>
      http.delete<ApiResponse<any>>(`/reading/bookshelf/${bookId}`),

    /** 获取书架列表 */
    getBookshelf: () =>
      http.get<ApiResponse<BookshelfItem[]>>("/reading/bookshelf"),

    /** 获取推荐图书 */
    getRecommend: (params?: { pageSize?: number }) =>
      http.get<ApiResponse<BookItem[]>>("/reading/recommend", params),

    /** 获取阅读进度 */
    getProgress: (bookId: number | string) =>
      http.get<ApiResponse<{ chapterId: number; page: number; progress: number }>>(`/reading/progress/${bookId}`),

    /** 保存阅读进度 */
    saveProgress: (data: { bookId: number | string; chapterId: number | string; page?: number; progress?: number }) =>
      http.post<ApiResponse<any>>("/reading/progress", data),

    /** 获取阅读统计（personal=1 查询用户个人统计） */
    getStatistics: (personal?: string) =>
      http.get<ApiResponse<ReadingStatistics>>("/reading/statistics", { personal: personal || undefined }),

    /** 获取书籍评价 */
    getReviews: (params: { bookId?: number | string; page?: number; pageSize?: number }) =>
      http.get<ApiResponse<ReviewListResult>>("/reading/reviews", params),

    /** 提交书籍评价 */
    createReview: (data: { bookId: number | string; rating: number; content?: string }) =>
      http.post<ApiResponse<any>>("/reading/reviews", data),
  };
}

export interface ApiResponse<T = unknown> {
  code: number;
  msg?: string;
  data?: T;
}

export interface BookItem {
  id: number;
  title: string;
  author: string;
  cover: string;
  desc?: string;
  categoryId?: number;
  wordCount?: number;
  chapterCount?: number;
  price?: string;
  isFree?: boolean;
  isVip?: boolean;
  isSerial?: boolean;
  isFinished?: boolean;
  isHot?: boolean;
  isRecommend?: boolean;
  rating?: string;
  ratingCount?: number;
  readCount?: number;
  category?: CategoryItem;
  originalPrice?: number;
}

export interface BookDetail extends BookItem {
  isbn?: string;
  publisher?: string;
  publishDate?: string;
  downloadCount?: number;
  tags?: string;
  status?: number;
}

export interface BookListResult {
  items: BookItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CategoryItem {
  id: number;
  name: string;
  parentId?: number;
  sort?: number;
  status?: number;
}

export interface ChapterItem {
  id: number;
  bookId: number;
  title: string;
  content?: string;
  wordCount?: number;
  sort?: number;
  isVip?: boolean;
  price?: string | number;
}

export interface ChapterLiteItem {
  id: number;
  title: string;
  sort: number;
  isVip: boolean;
}

export interface ChapterListResult {
  items: ChapterItem[];
  total: number;
}

export interface ChapterContent {
  id: number;
  title: string;
  content: string;
  bookId: number;
}

export interface BookshelfItem {
  id: number;
  bookId: number;
  book?: BookItem;
  progress?: number;
  lastReadChapter?: string;
  lastReadChapterId?: string | number;
  lastReadTime?: string;
}

export interface ReadingStatistics {
  bookCount: number;
  categoryCount: number;
  activeReaderCount: number;
  totalReads: number;
  personal?: {
    shelfCount: number;
    completedCount: number;
    todayReadMinutes: number;
    totalReadMinutes: number;
  };
}

export interface ReviewItem {
  id: number;
  bookId: number;
  userId: number;
  rating: number;
  content: string;
  status: number;
  createdAt: string;
  user?: { nickname?: string; avatar?: string };
  book?: { title?: string };
}

export interface ReviewListResult {
  items: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
}
