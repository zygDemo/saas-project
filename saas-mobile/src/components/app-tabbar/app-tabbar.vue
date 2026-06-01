<script lang="ts">
</script>

<script setup lang="ts">
import { $u } from 'uview-pro'
import { ref } from 'vue'
import { useTabbarStore } from '@/stores'

defineOptions({
  options: {
    addGlobalClass: true,
    // #ifndef MP-TOUTIAO
    virtualHost: true,
    // #endif
    styleIsolation: 'shared',
  },
})

const { tabbarList } = useTabbarStore()

const current = ref<number>(0)
</script>

<template>
  <u-tabbar v-model="current" :list="tabbarList" :active-color="$u.color.primary" />
</template>

<style lang="scss" scoped>
/* 防止tabbar文字换行 */
:deep(.u-tabbar__content__item__text) {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* 鸿蒙平台特殊处理 - 防止文字换行显示2行 */
// #ifdef APP-HARMONY
:deep(.u-tabbar) {
  height: 120rpx !important;
  padding-bottom: env(safe-area-inset-bottom) !important;
}

:deep(.u-tabbar__content) {
  height: 120rpx !important;
  padding-bottom: 0 !important;
  flex-wrap: nowrap !important;
}

:deep(.u-tabbar__content__item) {
  flex-shrink: 0 !important;
  flex-wrap: nowrap !important;
  height: 120rpx !important;
  justify-content: center !important;
  align-items: center !important;
}

:deep(.u-tabbar__content__item__text) {
  font-size: 20rpx !important;
  line-height: 1.2 !important;
  margin-top: 4rpx !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-width: 100% !important;
  width: 100% !important;
  text-align: center !important;
}

:deep(.u-tabbar__content__item__icon) {
  width: 48rpx !important;
  height: 48rpx !important;
  flex-shrink: 0 !important;
}
// #endif
</style>
