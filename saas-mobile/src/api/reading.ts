import { http } from "uview-pro";
import type { ApiResponse } from "@/types/api/contract";
import type {
  BookItem,
  BookDetail,
  BookListResult,
  CategoryItem,
  ChapterItem,
  ChapterLiteItem,
  ChapterListResult,
  ChapterContent,
  BookshelfItem,
  ReadingStatistics,
  ReviewItem,
  NoteItem,
  ReviewListResult,
} from "@/types/api/contract";

export type {
  BookItem,
  BookDetail,
  BookListResult,
  CategoryItem,
  ChapterItem,
  ChapterLiteItem,
  ChapterListResult,
  ChapterContent,
  BookshelfItem,
  ReadingStatistics,
  ReviewItem,
  NoteItem,
  ReviewListResult,
}

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

    /** 根据章节ID获取章节详情（含 content） */
    getChapterDetail: (chapterId: number | string) =>
      http.get<ApiResponse<ChapterContent>>(`/reading/chapters/${chapterId}`),

    /** 加入书架 */
    addToBookshelf: (bookId: number | string) =>
      http.post<ApiResponse<BookshelfItem>>("/reading/bookshelf", { bookId }),

    /** 移出书架 */
    removeFromBookshelf: (bookId: number | string) =>
      http.delete<ApiResponse<unknown>>(`/reading/bookshelf/${bookId}`),

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
    saveProgress: (data: { bookId: number | string; chapterId: number | string; page?: number; progress?: number; readTime?: number }) =>
      http.post<ApiResponse<unknown>>("/reading/progress", data),

    /** 获取阅读统计（personal=1 查询用户个人统计） */
    getStatistics: (personal?: string) =>
      http.get<ApiResponse<ReadingStatistics>>("/reading/statistics", { personal: personal || undefined }),

    /** 获取书籍评价 */
    getReviews: (params: { bookId?: number | string; page?: number; pageSize?: number }) =>
      http.get<ApiResponse<ReviewListResult>>("/reading/reviews", params),

    /** 提交书籍评价 */
    createReview: (data: { bookId: number | string; rating: number; content?: string }) =>
      http.post<ApiResponse<ReviewItem>>("/reading/reviews", data),
  
      // 笔记/高亮
      getNotes: (params?: { bookId?: number | string; chapterId?: number | string; page?: number; pageSize?: number }) =>
        http.get<ApiResponse<{ items: NoteItem[]; total: number }>>('/reading/notes', params),

      getNotesByChapter: (bookId: number | string, chapterId: number | string) =>
        http.get<ApiResponse<NoteItem[]>>(`/reading/notes/chapter/${bookId}/${chapterId}`),

      createNote: (data: { bookId: number | string; chapterId: number | string; highlight?: string; note?: string; color?: string; startPos?: number; endPos?: number }) =>
        http.post<ApiResponse<NoteItem>>('/reading/notes', data),

      updateNote: (id: number | string, data: { note?: string; color?: string }) =>
        http.put<ApiResponse<unknown>>(`/reading/notes/${id}`, data),

      deleteNote: (id: number | string) =>
        http.delete<ApiResponse<unknown>>(`/reading/notes/${id}`),
    };
}
