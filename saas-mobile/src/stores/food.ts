import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface FoodGoods {
  id: number | string;
  storeId: number | string;
  storeName?: string;
  categoryId?: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  sales: number;
  stock: number;
  desc?: string;
}

export interface CartItem {
  goods: FoodGoods;
  count: number;
}

export interface FoodOrder {
  id: number;
  no: string;
  storeName: string;
  storeId?: number | string;
  status: 0 | 1 | 2; // 0=待支付 1=制作中 2=已完成
  goodsTotal: number;
  deliveryFee: number;
  packageFee: number;
  total: number;
  remark?: string;
  items: CartItem[];
  createdAt: string;
  paidAt?: string;
  finishedAt?: string;
}

export interface SubmitFoodOrderInput {
  storeName?: string;
  storeId?: number | string;
  deliveryFee?: number;
  packageFee?: number;
  remark?: string;
}

export const useFoodStore = defineStore("food", () => {
  const cartList = ref<CartItem[]>([]);
  const orders = ref<FoodOrder[]>([]);

  const cartTotalCount = computed(() => {
    return cartList.value.reduce((total, item) => total + item.count, 0);
  });

  const cartTotalPrice = computed(() => {
    return cartList.value.reduce(
      (total, item) => total + item.count * item.goods.price,
      0,
    );
  });

  const addToCart = (goods: FoodGoods) => {
    const existing = cartList.value.find((item) => item.goods.id === goods.id);
    if (existing) {
      existing.count += 1;
      return;
    }
    cartList.value.push({ goods, count: 1 });
  };

  const decreaseCart = (goodsId: string | number) => {
    const index = cartList.value.findIndex((item) => item.goods.id === goodsId);
    if (index < 0) return;

    cartList.value[index].count -= 1;
    if (cartList.value[index].count <= 0) {
      cartList.value.splice(index, 1);
    }
  };

  const removeFromCart = (goodsId: string | number) => {
    const index = cartList.value.findIndex((item) => item.goods.id === goodsId);
    if (index >= 0) {
      cartList.value.splice(index, 1);
    }
  };

  const clearCart = () => {
    cartList.value = [];
  };

  const getGoodsCount = (goodsId: string | number): number => {
    const item = cartList.value.find((item) => item.goods.id === goodsId);
    return item?.count ?? 0;
  };

  const createTimeText = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  // 订单管理
  const submitOrder = (input: SubmitFoodOrderInput | string = {}): FoodOrder => {
    const options = typeof input === "string" ? { storeName: input } : input;
    const now = new Date();
    const orderNo = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;
    const firstGoods = cartList.value[0]?.goods;
    const goodsTotal = cartTotalPrice.value;
    const deliveryFee = options.deliveryFee ?? 0;
    const packageFee = options.packageFee ?? 0;

    const order: FoodOrder = {
      id: Date.now(),
      no: orderNo,
      storeName: options.storeName || firstGoods?.storeName || "点餐门店",
      storeId: options.storeId || firstGoods?.storeId,
      status: 0,
      goodsTotal,
      deliveryFee,
      packageFee,
      total: goodsTotal + deliveryFee + packageFee,
      remark: options.remark?.trim(),
      items: cartList.value.map((item) => ({
        goods: { ...item.goods },
        count: item.count,
      })),
      createdAt: createTimeText(now),
    };

    orders.value.unshift(order);
    clearCart();
    return order;
  };

  const updateOrderStatus = (orderId: number, status: 0 | 1 | 2) => {
    const order = orders.value.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      const now = createTimeText(new Date());
      if (status === 1) order.paidAt = now;
      if (status === 2) order.finishedAt = now;
    }
  };

  const payOrder = (orderId: number) => {
    updateOrderStatus(orderId, 1);
  };

  const finishOrder = (orderId: number) => {
    updateOrderStatus(orderId, 2);
  };

  return {
    cartList,
    orders,
    cartTotalCount,
    cartTotalPrice,
    addToCart,
    decreaseCart,
    removeFromCart,
    clearCart,
    getGoodsCount,
    submitOrder,
    updateOrderStatus,
    payOrder,
    finishOrder,
  };
});
