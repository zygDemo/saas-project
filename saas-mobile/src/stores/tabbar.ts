import {
  getLayoutTabbar,
  TABBAR_SCOPES,
} from "@/common/navigation";
import type { TabbarScope } from "@/common/navigation";
import type { TabbarItem } from "uview-pro/types/global";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useTabbarStore = defineStore("tabbar", () => {
  const activeIndex = ref(0);
  const scope = ref<TabbarScope>(TABBAR_SCOPES.portal);
  const badgeMap = ref<Record<number, number>>({});
  const dotMap = ref<Record<number, boolean>>({});

  const tabbarList = computed<TabbarItem[]>(() =>
    getLayoutTabbar(scope.value).map((item, index) => ({
      text: item.text,
      iconPath: item.iconPath,
      selectedIconPath: item.selectedIconPath,
      pagePath: item.route,
      customIcon: item.customIcon,
      count: badgeMap.value[index] ?? item.count,
      isDot: dotMap.value[index] ?? item.isDot,
    })),
  );

  const setActiveIndex = (index: number) => {
    activeIndex.value = index;
  };

  const setScope = (nextScope: TabbarScope) => {
    scope.value = nextScope;
    activeIndex.value = 0;
  };

  const updateBadge = (index: number, count: number) => {
    badgeMap.value[index] = count;
  };

  const updateIsDot = (index: number, isDot: boolean) => {
    dotMap.value[index] = isDot;
  };

  return {
    activeIndex,
    scope,
    tabbarList,
    setActiveIndex,
    setScope,
    updateBadge,
    updateIsDot,
  };
}, {
  persist: true,
});
