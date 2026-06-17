import type { TabbarItem } from 'uview-pro/types/global'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTabbarStore = defineStore('tabbar', () => {
  const activeIndex = ref(0)
  const tabbarList = ref<TabbarItem[]>([
    {
      text: '首页',
      iconPath: 'home',
      selectedIconPath: 'home-fill',
      pagePath: '/pages/carloan/portal/workbench',
      isDot: true,
    },
    {
      text: '订单',
      iconPath: 'order',
      selectedIconPath: 'order-fill',
      pagePath: '/pages/carloan/precheck/orderList',
      isDot: true,
    },
    {
      text: '我的',
      iconPath: 'account',
      selectedIconPath: 'account-fill',
      pagePath: '/pages/my/my',
      count: 3,
    },
  ])

  const setActiveIndex = (index: number) => {
    activeIndex.value = index
  }

  const updateBadge = (index: number, count: number) => {
    tabbarList.value[index].count = count
  }

  const updateIsDot = (index: number, isDot: boolean) => {
    tabbarList.value[index].isDot = isDot
  }

  return {
    activeIndex,
    tabbarList,
    setActiveIndex,
    updateBadge,
    updateIsDot,
  }
}, {
  persist: true,
})
