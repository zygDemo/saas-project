<template>
  <view class="goods-list-page">
    <view class="store-card">
      <image class="store-bg" :src="storeInfo.logo" mode="aspectFill"></image>
      <view class="store-info">
        <view class="store-name">{{ storeInfo.name }}</view>
        <view class="store-desc">{{ storeInfo.desc }}</view>
      </view>
    </view>

    <view class="goods-list">
      <view v-for="goods in goodsList" :key="goods.id" class="goods-item">
        <image class="goods-img" :src="goods.image" mode="aspectFill"></image>
        <view class="goods-info">
          <view class="goods-name">{{ goods.name }}</view>
          <view v-if="goods.desc" class="goods-desc">{{ goods.desc }}</view>
          <view class="goods-bottom">
            <view class="goods-price">
              <text class="symbol">¥</text>
              <text class="price">{{ goods.price.toFixed(2) }}</text>
              <text v-if="goods.originalPrice" class="original-price">¥{{ goods.originalPrice.toFixed(2) }}</text>
            </view>
            <u-button
              type="primary"
              size="small"
              text="加入购物车"
              @click="addToCart(goods)"
            ></u-button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useFoodStore, type FoodGoods } from "@/stores/food";

interface StoreInfo {
  id: number;
  name: string;
  desc: string;
  logo: string;
}

const storeInfo = ref<StoreInfo>({
  id: 1,
  name: "李家厨房",
  desc: "精品家常菜 · 营业时间 10:00-21:00",
  logo: "https://via.placeholder.com/160x160/FF6B6B/ffffff?text=餐馆",
});

const goodsList = ref<FoodGoods[]>([
  {
    id: 1,
    storeId: 1,
    name: "宫保鸡丁",
    price: 38,
    originalPrice: 48,
    image: "https://via.placeholder.com/160x160/FF6B6B/ffffff?text=宫保鸡丁",
    sales: 120,
    stock: 999,
    desc: "招牌菜品 · 麻辣鲜香",
  },
  {
    id: 2,
    storeId: 1,
    name: "鱼香肉丝",
    price: 32,
    image: "https://via.placeholder.com/160x160/4ECDC4/ffffff?text=鱼香肉丝",
    sales: 86,
    stock: 999,
    desc: "经典川菜 · 酸甜适口",
  },
  {
    id: 3,
    storeId: 1,
    name: "麻婆豆腐",
    price: 18,
    image: "https://via.placeholder.com/160x160/FFA62B/ffffff?text=麻婆豆腐",
    sales: 158,
    stock: 999,
    desc: "麻辣开胃 · 下饭神器",
  },
  {
    id: 4,
    storeId: 1,
    name: "水煮肉片",
    price: 48,
    originalPrice: 58,
    image: "https://via.placeholder.com/160x160/f5576c/ffffff?text=水煮肉片",
    sales: 92,
    stock: 999,
    desc: "麻辣鲜香 · 肉嫩入味",
  },
]);

const foodStore = useFoodStore();

onLoad((options?: Record<string, string>) => {
  if (options?.storeId) {
    storeInfo.value.id = Number(options.storeId) || storeInfo.value.id;
  }
  if (options?.storeName) {
    storeInfo.value.name = options.storeName;
  }
});

const addToCart = (goods: FoodGoods) => {
  foodStore.addToCart(goods);
  uni.showToast({ title: "已加入购物车", icon: "success" });
};
</script>

<style scoped lang="scss">
.goods-list-page {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 100rpx;
}

.store-card {
  position: relative;
  margin-bottom: 20rpx;
}

.store-bg {
  width: 100%;
  height: 280rpx;
}

.store-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  padding: 40rpx 30rpx 30rpx;
  color: #fff;
}

.store-name {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.store-desc {
  font-size: 26rpx;
  opacity: 0.9;
}

.goods-list {
  padding: 0 20rpx;
}

.goods-item {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.goods-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goods-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8rpx;
}

.goods-desc {
  font-size: 24rpx;
  color: #909399;
  margin-bottom: 16rpx;
}

.goods-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.goods-price {
  display: flex;
  align-items: flex-end;
}

.symbol {
  font-size: 24rpx;
  color: #f5576c;
}

.price {
  font-size: 32rpx;
  font-weight: 600;
  color: #f5576c;
}

.original-price {
  margin-left: 12rpx;
  font-size: 24rpx;
  color: #c0c4cc;
  text-decoration: line-through;
}
</style>
