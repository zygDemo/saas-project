import { http } from "uview-pro";
import type { ApiResponse, FoodCategory, FoodCartItem, FoodOrder } from "@/types/api/contract";

export type { FoodCategory, FoodCartItem, FoodOrder };

export function useFoodApi() {
  return {
    /** 获取菜单列表（分组） */
    getMenuList: () =>
      http.get<ApiResponse<FoodCategory[]>>("/food/m/menu"),

    /** 获取购物车 */
    getCart: () =>
      http.get<ApiResponse<FoodCartItem[]>>("/food/m/cart"),

    /** 添加到购物车 */
    addToCart: (data: { dishId: number; quantity?: number }) =>
      http.post<ApiResponse<FoodCartItem>>("/food/m/cart", data, { loadingText: "添加中..." }),

    /** 更新购物车数量 */
    updateCartQuantity: (dishId: number, quantity: number) =>
      http.put<ApiResponse<null>>(`/food/m/cart/${dishId}`, { quantity }, { loadingText: "更新中..." }),

    /** 清空购物车 */
    clearCart: () =>
      http.delete<ApiResponse<null>>("/food/m/cart", undefined, { loadingText: "清空中..." }),

    /** 创建订单 */
    createOrder: (data?: { remark?: string }) =>
      http.post<ApiResponse<FoodOrder>>("/food/m/order", data, { loadingText: "提交中..." }),

    /** 我的订单列表 */
    getMyOrders: (params?: { status?: number }) =>
      http.get<ApiResponse<FoodOrder[]>>("/food/m/orders", params),
  };
}
