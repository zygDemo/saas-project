import request from '@/utils/http'

// ==================== 书籍分类 ====================

/** 获取书籍分类列表 */
export function getBookCategories() {
  return request.get("/reading/categories");
}

/** 创建书籍分类 */
export function createBookCategory(data: {
  name: string;
  parentId?: number;
  sort?: number;
}) {
  return request.post("/reading/categories", data);
}

/** 更新书籍分类 */
export function updateBookCategory(
  id: number,
  data: {
    name?: string;
    parentId?: number;
    sort?: number;
    status?: number;
  }
) {
  return request.put(`/reading/categories/${id}`, data);
}

/** 删除书籍分类 */
export function deleteBookCategory(id: number) {
  return request.delete(`/reading/categories/${id}`);
}

// ==================== 书籍管理 ====================

/** 获取书籍列表 */
export function getBooks(params?: {
  keyword?: string;
  categoryId?: number;
  status?: number;
  isHot?: boolean;
  isRecommend?: boolean;
  isFinished?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return request.get("/reading/books", { params });
}

/** 获取书籍详情 */
export function getBookById(id: number) {
  return request.get(`/reading/books/${id}`);
}

/** 创建书籍 */
export function createBook(data: {
  title: string;
  author: string;
  cover?: string;
  desc?: string;
  categoryId?: number;
  isbn?: string;
  publisher?: string;
  publishDate?: string;
  wordCount?: number;
  price?: number;
  isFree?: boolean;
  isVip?: boolean;
  isSerial?: boolean;
  tags?: string;
}) {
  return request.post("/reading/books", data);
}

/** 更新书籍 */
export function updateBook(
  id: number,
  data: {
    title?: string;
    author?: string;
    cover?: string;
    desc?: string;
    categoryId?: number;
    isbn?: string;
    publisher?: string;
    publishDate?: string;
    wordCount?: number;
    price?: number;
    isFree?: boolean;
    isVip?: boolean;
    isSerial?: boolean;
    isHot?: boolean;
    isRecommend?: boolean;
    status?: number;
    sort?: number;
    tags?: string;
  }
) {
  return request.put(`/reading/books/${id}`, data);
}

/** 删除书籍 */
export function deleteBook(id: number) {
  return request.delete(`/reading/books/${id}`);
}

// ==================== 章节管理 ====================

/** 获取章节列表 */
export function getChapters(params: {
  bookId: number;
  page?: number;
  pageSize?: number;
}) {
  return request.get("/reading/chapters", { params });
}

/** 获取章节详情 */
export function getChapterById(id: number) {
  return request.get(`/reading/chapters/${id}`);
}

/** 创建章节 */
export function createChapter(data: {
  bookId: number;
  title: string;
  content?: string;
  sort?: number;
  isVip?: boolean;
  price?: number;
}) {
  return request.post("/reading/chapters", data);
}

/** 更新章节 */
export function updateChapter(
  id: number,
  data: {
    title?: string;
    content?: string;
    sort?: number;
    isVip?: boolean;
    price?: number;
  }
) {
  return request.put(`/reading/chapters/${id}`, data);
}

/** 删除章节 */
export function deleteChapter(id: number) {
  return request.delete(`/reading/chapters/${id}`);
}

// ==================== 用户书架 ====================

/** 获取用户书架 */
export function getUserBookshelf() {
  return request.get("/reading/bookshelf");
}

/** 加入书架 */
export function addToBookshelf(bookId: number) {
  return request.post("/reading/bookshelf", { bookId });
}

/** 移出书架 */
export function removeFromBookshelf(bookId: number) {
  return request.delete(`/reading/bookshelf/${bookId}`);
}

// ==================== 阅读进度 ====================

/** 获取阅读进度 */
export function getReadingProgress(bookId: number) {
  return request.get(`/reading/progress/${bookId}`);
}

/** 保存阅读进度 */
export function saveReadingProgress(data: {
  bookId: number;
  chapterId: number;
  page?: number;
  progress?: number;
  readTime?: number;
}) {
  return request.post("/reading/progress", data);
}

// ==================== 书籍评价 ====================

/** 获取书籍评价 */
export function getBookReviews(params: {
  bookId: number;
  page?: number;
  pageSize?: number;
}) {
  return request.get("/reading/reviews", { params });
}

/** 创建书籍评价 */
export function createBookReview(data: {
  bookId: number;
  rating: number;
  content?: string;
}) {
  return request.post("/reading/reviews", data);
}

// ==================== 统计 ====================

/** 获取读书统计 */
export function getReadingStatistics() {
  return request.get("/reading/statistics");
}

/** 获取热门书籍 */
export function getHotBooks(limit?: number) {
  return request.get("/reading/hot", { params: { limit } });
}

/** 获取推荐书籍 */
export function getRecommendBooks(limit?: number) {
  return request.get("/reading/recommend", { params: { limit } });
}
