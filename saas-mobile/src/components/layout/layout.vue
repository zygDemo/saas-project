<template>
  <view class="layout">
    <u-navbar
      :title="navTitle || currentNavTitle"
      :background="(navBackground as any)"
      title-color="#ffffff"
      title-bold
      :is-back="showBack"
      :is-fixed="true"
      :immersive="false"
      :border-bottom="false"
      :z-index="980"
      @left-click="handleBack"
    />

    <view
      class="layout-content"
      :class="{ 'layout-content--with-tabbar': showTabbar }"
    >
      <view class="content-page"><slot /></view>
    </view>

    <u-tabbar
      v-if="showTabbar"
      v-model="currentTab"
      :list="tabbarList"
      :active-color="themeColor"
      inactive-color="#999999"
        :hide-tab-bar="true"
        :before-switch="beforeSwitch"
      @change="onTabChange"
    />
  </view>
</template>

<script setup lang="ts">
import {
  getCurrentPageRoute,
  getLayoutTabbar,
  TABBAR_SCOPES,
} from "@/common/navigation";
import type { LayoutTabbarItem, TabbarScope } from "@/common/navigation";
import { onShow } from "@dcloudio/uni-app";
import { useTheme } from "uview-pro";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  navTitle?: string;
  activeTab?: number;
  showTabbar?: boolean;
  tabbarScope?: TabbarScope;
  back?: boolean;
  backUrl?: string;
}>();

const currentTab = ref(props.activeTab ?? 0);
const tabConfig = ref<LayoutTabbarItem[]>([]);
const switchingTab = ref(false);
const { currentTheme } = useTheme();

const currentScope = computed<TabbarScope>(
  () => props.tabbarScope || TABBAR_SCOPES.portal,
);
const showBack = computed(() => Boolean(props.back));

function handleBack() {
  if (props.backUrl) {
    uni.reLaunch({ url: props.backUrl });
    return;
  }

  if (getCurrentPages().length > 1) {
    uni.navigateBack({ delta: 1 });
    return;
  }

  uni.reLaunch({ url: "/pages/index/index" });
}

const themeColor = computed(
  () => currentTheme.value?.color?.primary || "#4f7cff",
);

const navBackground = computed(() => ({
  backgroundImage:
    "linear-gradient(90deg, var(--u-type-primary-dark), var(--u-type-primary-disabled))",
}));

const tabbarList = computed(() =>
  tabConfig.value.map(({ route: _route, navMode: _navMode, ...item }) => item),
);

const currentNavTitle = computed(() => {
  const currentTabItem = tabConfig.value[currentTab.value];
  return props.navTitle || currentTabItem?.text || "SaaS助手";
});

const syncTabbar = () => {
  const nextConfig = getLayoutTabbar(currentScope.value);
  const currentRoute = getCurrentPageRoute();
  const matchedIndex = nextConfig.findIndex(
    (item) => item.route === currentRoute,
  );

  tabConfig.value = nextConfig;
  currentTab.value = matchedIndex >= 0 ? matchedIndex : (props.activeTab ?? 0);
};

function beforeSwitch(index: number): boolean {
  return !switchingTab.value && index >= 0 && index < tabConfig.value.length;
}

function onTabChange(index: number) {
  const targetItem = tabConfig.value[index];
  if (!targetItem || switchingTab.value) {
    return;
  }

  const targetRoute = targetItem.route;
  const currentRoute = getCurrentPageRoute();

  // 已在目标页面，无需跳转
  if (targetRoute === currentRoute) {
    return;
  }

  switchingTab.value = true;

  const navFn =
    targetItem.navMode === "reLaunch"
      ? uni.reLaunch
      : targetItem.navMode === "redirectTo"
        ? uni.redirectTo
        : uni.switchTab;

  navFn({
    url: targetRoute,
    success: () => {
      console.log("[layout] tabbar 跳转成功:", targetRoute);
    },
    fail: (err: any) => {
      console.error("[layout] tabbar 跳转失败:", targetRoute, err);
      // 跳转失败恢复当前 tab 高亮
      syncTabbar();
    },
    complete: () => {
      switchingTab.value = false;
    },
  });
}

function updateBadge(index: number, count: number) {
  if (index < 0 || index >= tabConfig.value.length) {
    return;
  }

  tabConfig.value[index] = {
    ...tabConfig.value[index],
    count,
  };
}

defineExpose({
  updateBadge,
});

watch(
  () => [props.tabbarScope, props.activeTab] as const,
  () => {
    syncTabbar();
  },
  { immediate: true },
);

// 页面重新显示时同步 tabbar（switchTab 页面缓存场景）
onShow(() => {
  syncTabbar();
});
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  background-color: #f5f7fa;
  overflow: hidden;
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  // &--with-tabbar {
  //   padding-bottom: calc(50px + env(safe-area-inset-bottom));
  // }

  .content-page {
    min-height: 100%;
  }
}

:deep(.u-tabbar) {
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.04);
}
</style>
