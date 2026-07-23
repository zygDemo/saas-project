import request from '@/utils/http'

// ==================== 分类管理 ====================

/** 获取菜品分类列表 */
export function getFoodCategories(params?: { keyword?: string; page?: number; pageSize?: number }) {
  const { page, pageSize, ...rest } = params || {}
  return request.get({ url: '/food/category/list', params: { ...rest, current: page, size: pageSize } })
}

/** 创建菜品分类 */
export function createFoodCategory(data: { name: string; icon?: string; sortOrder?: number }) {
  return request.post({ url: '/food/category', data, showSuccessMessage: true })
}

/** 更新菜品分类 */
export function updateFoodCategory(id: number, data: { name?: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
  return request.put({ url: `/food/category/${id}`, data, showSuccessMessage: true })
}

/** 删除菜品分类 */
export function deleteFoodCategory(id: number) {
  return request.del({ url: `/food/category/${id}`, showSuccessMessage: true })
}

// ==================== 菜品管理 ====================

/** 获取菜品列表 */
export function getFoodDishes(params?: { keyword?: string; categoryId?: number; isActive?: boolean; page?: number; pageSize?: number }) {
  const { page, pageSize, ...rest } = params || {}
  return request.get({ url: '/food/dish/list', params: { ...rest, current: page, size: pageSize } })
}

/** 获取菜品详情 */
export function getFoodDishById(id: number) {
  return request.get({ url: `/food/dish/${id}` })
}

/** 创建菜品 */
export function createFoodDish(data: { name: string; description?: string; price: number; originalPrice?: number; imageUrl?: string; categoryId: number; sortOrder?: number }) {
  return request.post({ url: '/food/dish', data, showSuccessMessage: true })
}

/** 更新菜品 */
export function updateFoodDish(id: number, data: { name?: string; description?: string; price?: number; originalPrice?: number; imageUrl?: string; categoryId?: number; sortOrder?: number; isActive?: boolean }) {
  return request.put({ url: `/food/dish/${id}`, data, showSuccessMessage: true })
}

/** 删除菜品 */
export function deleteFoodDish(id: number) {
  return request.del({ url: `/food/dish/${id}`, showSuccessMessage: true })
}

// ==================== 订单管理 ====================

/** 获取订单列表 */
export function getFoodOrders(params?: { status?: number; orderNo?: string; page?: number; pageSize?: number }) {
  const { page, pageSize, ...rest } = params || {}
  return request.get({ url: '/food/order/list', params: { ...rest, current: page, size: pageSize } })
}

/** 更新订单状态 */
export function updateFoodOrderStatus(id: number, status: number) {
  return request.put({ url: `/food/order/${id}/status`, data: { status }, showSuccessMessage: true })
}
