import { defineStore } from "pinia";
import { computed, ref } from "vue";

export interface FoodGoods {
  id: number | string;
  storeId: number | string;
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

export const useFoodStore = defineStore("food", () => {
  const cartList = ref<CartItem[]>([]);

  const cartTotalCount = computed(() => {
    return cartList.value.reduce((total, item) => total + item.count, 0);
  });

  const cartTotalPrice = computed(() => {
    return cartList.value.reduce((total, item) => total + item.count * item.goods.price, 0);
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

  return {
    cartList,
    cartTotalCount,
    cartTotalPrice,
    addToCart,
    decreaseCart,
    removeFromCart,
    clearCart,
  };
});
