<script lang="ts">
</script>

<script setup lang="ts">
import {
  getCurrentPageRoute,
  getLayoutTabbar,
  navigateFromTabbar,
  TABBAR_SCOPES,
} from "@/common/navigation";
import type { LayoutTabbarItem, TabbarScope } from "@/common/navigation";
import { onShow } from "@dcloudio/uni-app";
import { $u } from "uview-pro";
import { computed, ref, watch } from "vue";

defineOptions({
  options: {
    addGlobalClass: true,
    // #ifndef MP-TOUTIAO
    virtualHost: true,
    // #endif
    styleIsolation: "shared",
  },
});

const props = withDefaults(defineProps<{
  activeTab?: number;
  scope?: TabbarScope;
}>(), {
  activeTab: 0,
  scope: TABBAR_SCOPES.portal,
});

const current = ref(props.activeTab);
const tabConfig = ref<LayoutTabbarItem[]>([]);
const switchingTab = ref(false);

const tabbarList = computed(() =>
  tabConfig.value.map(({ route: _route, navMode: _navMode, ...item }) => item),
);

const syncTabbar = () => {
  const nextConfig = getLayoutTabbar(props.scope);
  const currentRoute = getCurrentPageRoute();
  const matchedIndex = nextConfig.findIndex((item) => item.route === currentRoute);

  tabConfig.value = nextConfig;
  current.value = matchedIndex >= 0 ? matchedIndex : props.activeTab;
};

function beforeSwitch(index: number): boolean {
  return !switchingTab.value && index >= 0 && index < tabConfig.value.length;
}

function onTabChange(index: number) {
  const targetItem = tabConfig.value[index];
  if (!targetItem || switchingTab.value) {
    return;
  }

  switchingTab.value = true;
  navigateFromTabbar(targetItem)
    .catch(() => {
      syncTabbar();
    })
    .finally(() => {
      setTimeout(() => {
        switchingTab.value = false;
      }, 180);
    });
}

watch(
  () => [props.scope, props.activeTab] as const,
  () => {
    syncTabbar();
  },
  { immediate: true },
);

onShow(() => {
  syncTabbar();
});
</script>

<template>
  <u-tabbar
    v-model="current"
    :list="tabbarList"
    :active-color="$u.color.primary"
    :before-switch="beforeSwitch"
    @change="onTabChange"
  />
</template>

<style lang="scss" scoped>
/* 闃叉tabbar鏂囧瓧鎹㈣ */
:deep(.u-tabbar__content__item__text) {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* 楦胯挋骞冲彴鐗规畩澶勭悊 - 闃叉鏂囧瓧鎹㈣鏄剧ず2琛?*/
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
