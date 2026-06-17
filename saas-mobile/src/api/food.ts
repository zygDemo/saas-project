import { http } from "uview-pro";

export interface FoodStoreQuery {
  keyword?: string;
  categoryId?: number | string;
}

export interface FoodGoodsQuery {
  storeId?: number | string;
  categoryId?: number | string;
  keyword?: string;
}

export interface FoodOrderSubmitData {
  storeId: number | string;
  items: Array<{
    goodsId: number | string;
    count: number;
  }>;
  remark?: string;
}

export function useFoodApi() {
  return {
    getStoreList: (params?: FoodStoreQuery) => http.get("/m/food/stores", params),
    getStoreDetail: (storeId: number | string) => http.get("/m/food/stores/" + storeId),
    getGoodsList: (params?: FoodGoodsQuery) => http.get("/m/food/goods", params),
    submitOrder: (data: FoodOrderSubmitData) => http.post("/m/food/orders", data),
    getOrderList: (params?: Record<string, unknown>) => http.get("/m/food/orders", params),
    getOrderDetail: (orderId: number | string) => http.get("/m/food/orders/" + orderId),
  };
}
