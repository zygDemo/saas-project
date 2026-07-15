import { http } from "uview-pro";
import type {
  ApiResponse,
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

/** 阅读进度 */
interface ReadingProgress {
  bookId: number;
  chapterId: number;
  page: number;
  progress: number;
  updatedAt: string;
}

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
};

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

    /** 获取章节列表 */
    getChapters: (params?: { bookId?: number; page?: number; pageSize?: number }) =>
      http.get<ApiResponse<ChapterListResult>>("/reading/chapters", params),

    /** 获取章节列表(轻量) */
    getChaptersLite: (bookId: number | string) =>
      http.get<ApiResponse<ChapterLiteItem[]>>(`/reading/chapters/lite`, { bookId }),

    /** 获取章节详情 */
    getChapterDetail: (id: number | string) =>
      http.get<ApiResponse<ChapterContent>>(`/reading/chapters/${id}`),

    /** 获取书架 */
    getBookshelf: () =>
      http.get<ApiResponse<BookshelfItem[]>>("/reading/bookshelf"),

    /** 加入书架 */
    addToBookshelf: (bookId: number | string) =>
      http.post<ApiResponse<void>>("/reading/bookshelf", { bookId }),

    /** 移出书架 */
    removeFromBookshelf: (bookId: number | string) =>
      http.delete<ApiResponse<void>>(`/reading/bookshelf/${bookId}`),

    /** 获取阅读进度 */
    getProgress: (bookId: number | string) =>
      http.get<ApiResponse<ReadingProgress>>(`/reading/progress/${bookId}`),

    /** 保存阅读进度 */
    saveProgress: (data: { bookId: number; chapterId: number; progress: number }) =>
      http.post<ApiResponse<void>>("/reading/progress", data),

    /** 获取评论列表 */
    getReviews: (params?: { bookId?: number; page?: number; pageSize?: number }) =>
      http.get<ApiResponse<ReviewListResult>>("/reading/reviews", params),

    /** 发表评论 */
    createReview: (data: { bookId: number; content: string; rating?: number }) =>
      http.post<ApiResponse<void>>("/reading/reviews", data),

    /** 删除评论 */
    deleteReview: (id: number | string) =>
      http.delete<ApiResponse<void>>(`/reading/reviews/${id}`),

    /** 获取阅读统计 */
    getStatistics: () =>
      http.get<ApiResponse<ReadingStatistics>>("/reading/statistics"),

    /** 获取热门图书 */
    getHotBooks: (limit?: number) =>
      http.get<ApiResponse<BookItem[]>>("/reading/hot", { limit }),

    /** 获取推荐图书 */
    getRecommendBooks: (limit?: number) =>
      http.get<ApiResponse<BookItem[]>>("/reading/recommend", { limit }),

    /** 购买章节 */
    purchaseChapter: (chapterId: number | string) =>
      http.post<ApiResponse<{ purchased: boolean }>>(`/reading/chapters/${chapterId}/purchase`),

    /** 检查章节是否已购买 */
    checkChapterPurchased: (chapterId: number | string) =>
      http.get<ApiResponse<{ purchased: boolean }>>(`/reading/chapters/${chapterId}/purchased`),

    /** 获取已购买章节列表 */
    getPurchasedChapters: (bookId: number | string) =>
      http.get<ApiResponse<number[]>>(`/reading/chapters/purchased/${bookId}`),

    /** 点赞/取消点赞评论 */
    likeReview: (reviewId: number | string) =>
      http.post<ApiResponse<{ liked: boolean }>>(`/reading/reviews/${reviewId}/like`),

    /** 获取章节笔记 */
    getNotesByChapter: (bookId: number | string, chapterId: number | string) =>
      http.get<ApiResponse<NoteItem[]>>(`/reading/notes/chapter/${bookId}/${chapterId}`),

    /** 创建笔记 */
    createNote: (data: { bookId: number; chapterId: number; content: string; startPos?: number; endPos?: number }) =>
      http.post<ApiResponse<void>>("/reading/notes", data),
  };
}
