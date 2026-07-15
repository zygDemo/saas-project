import request from '@/utils/http'

export interface Article {
  id: number
  title: string
  content?: string
  summary?: string
  coverImg?: string
  typeId?: number
  typeName?: string
  status: string
  viewCount: number
  likeCount: number
  isTop: boolean
  publishAt?: string
  createdAt: string
  updatedAt: string
}

export interface ArticleType {
  id: number
  name: string
  sort: number
  status: string
}

export interface ArticleQuery {
  page?: number
  size?: number
  keyword?: string
  typeId?: number
  status?: string
  year?: string
}

export interface CreateArticleData {
  title: string
  content?: string
  summary?: string
  coverImg?: string
  typeId?: number
  typeName?: string
  status?: string
  isTop?: boolean
}

export type UpdateArticleData = Partial<CreateArticleData>

/**
 * 获取文章列表
 */
export function fetchArticleList(params: ArticleQuery) {
  return request.get<{ list: Article[]; total: number }>({
    url: '/article/list',
    params
  })
}

/**
 * 获取文章详情
 */
export function fetchArticleDetail(id: number) {
  return request.get<Article>({
    url: `/article/${id}`
  })
}

/**
 * 创建文章
 */
export function fetchCreateArticle(data: CreateArticleData) {
  return request.post({
    url: '/article',
    data
  })
}

/**
 * 更新文章
 */
export function fetchUpdateArticle(id: number, data: UpdateArticleData) {
  return request.put({
    url: `/article/${id}`,
    data
  })
}

/**
 * 删除文章
 */
export function fetchDeleteArticle(id: number) {
  return request.del({
    url: `/article/${id}`
  })
}

/**
 * 点赞文章
 */
export function fetchLikeArticle(id: number) {
  return request.post({
    url: `/article/${id}/like`
  })
}

/**
 * 获取所有文章分类
 */
export function fetchAllArticleTypes() {
  return request.get<ArticleType[]>({
    url: '/article/type/all'
  })
}

/**
 * 创建文章分类
 */
export function fetchCreateArticleType(data: { name: string; sort?: number }) {
  return request.post({
    url: '/article/type',
    data
  })
}

/**
 * 更新文章分类
 */
export function fetchUpdateArticleType(id: number, data: { name?: string; sort?: number }) {
  return request.put({
    url: `/article/type/${id}`,
    data
  })
}

/**
 * 删除文章分类
 */
export function fetchDeleteArticleType(id: number) {
  return request.del({
    url: `/article/type/${id}`
  })
}
