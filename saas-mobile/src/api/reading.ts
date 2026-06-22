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

    /** 获取章节目录 */
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
  lastReadTime?: string;
}
