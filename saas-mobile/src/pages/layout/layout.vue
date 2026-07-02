<template>
  <view class="layout">
    <u-navbar
      :title="navTitle || currentNavTitle"
      :background="navBackground"
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
      :hide-tab-bar="shouldHideNativeTabbar"
      :before-switch="beforeSwitch"
      @change="onTabChange"
    />
  </view>
</template>

<script setup lang="ts">
import {
  getCurrentPageRoute,
  getLayoutTabbar,
  isSystemTabbarRoute,
  navigateFromTabbar,
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

const themeColor = computed(() => currentTheme.value?.color?.primary || "#4f7cff");

const navBackground = computed(() => ({
  backgroundImage:
    "linear-gradient(90deg, var(--u-type-primary-dark), var(--u-type-primary-disabled))",
}));

const shouldHideNativeTabbar = computed(() => {
  return isSystemTabbarRoute(getCurrentPageRoute());
});

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

  switchingTab.value = true;

  navigateFromTabbar(targetItem)
    .catch(() => {
      // 导航失败不跳转，syncTabbar 会在 onShow 中恢复
    })
    .finally(() => {
      setTimeout(() => {
        switchingTab.value = false;
      }, 180);
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

<style lang="scss">
page {
  overflow: hidden;
}
</style>

<style lang="scss" scoped>
.layout {
  position: relative;
  width: 100%;
  height: 100vh;
  background-color: #f5f7fa;
  overflow: hidden;
}

.layout-content {
  position: absolute;
  top: calc(var(--status-bar-height) + 44px);
  right: 0;
  bottom: 0;
  left: 0;
  overflow: hidden;

  &--with-tabbar {
    bottom: calc(50px + env(safe-area-inset-bottom));
  }

  .content-page {
    height: 100%;
  }
}

:deep(.u-tabbar) {
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.04);
}
</style>
