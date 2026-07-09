<template>
  <view
    class="app-page"
    :class="{ 'has-tabbar': showTabbar }"
    :style="$u.toStyle(customStyle)"
  >
    <!-- #ifndef MP-ALIPAY -->
    <u-navbar
      v-if="!hideNav"
      :is-back="showNavBack && !showTabbar"
      :title="navTitle"
      :background="background"
      :is-fixed="true"
      :immersive="false"
      back-icon-name="arrow-leftward"
      title-width="350"
      title-color="#ffffff"
      back-icon-color="#ffffff"
      :custom-back="handleBack"
    />
    <!-- #endif -->
    <view class="app-page__body">
      <u-transition name="slide-left" :appear="true">
        <slot />
      </u-transition>
    </view>
    <!-- 注意：使用自定义 layout 组件的 TabBar，不使用系统 TabBar -->
    <app-tabbar
      v-if="showTabbar"
      :active-tab="activeTab"
      :scope="tabbarScope"
    />
  </view>
</template>

<script setup lang="ts">
import { navigateBackOrFallback, TABBAR_SCOPES } from "@/common/navigation";
import type { TabbarScope } from "@/common/navigation";
import type { PropType } from "vue";
import { $u } from "uview-pro";
import { reactive } from "vue";

const props = defineProps({
  navTitle: {
    type: String,
    default: "uView Pro",
  },
  backUrl: {
    type: String,
    default: "",
  },
  showNavBack: {
    type: Boolean,
    default: true,
  },
  hideNav: {
    type: Boolean,
    default: false,
  },
  showTabbar: {
    type: Boolean,
    default: false,
  },
  activeTab: {
    type: Number,
    default: 0,
  },
  tabbarScope: {
    type: String as PropType<TabbarScope>,
    default: TABBAR_SCOPES.portal,
  },
  customStyle: {
    type: [String, Object] as PropType<string | Record<string, unknown>>,
    default: "",
  },
  customClass: {
    type: [String, Object] as PropType<string | Record<string, unknown>>,
    default: "",
  },
});

const background = reactive({
  backgroundColor: "var(--u-type-primary)",
  // 渐变色
  backgroundImage:
    "linear-gradient(90deg, var(--u-type-primary-dark), var(--u-type-primary-disabled))",
});

const handleBack = () => {
  if (props.backUrl) {
    uni.redirectTo({ url: props.backUrl });
    return;
  }

  navigateBackOrFallback();
};
</script>

<style lang="scss" scoped>
.app-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: $u-bg-white;
  -webkit-font-smoothing: antialiased;
  color: $u-main-color;
  transition: background 0.3s ease;

  &.has-tabbar {
    background-image: linear-gradient(
      135deg,
      rgba(var(--u-type-primary-rgb, 41, 121, 255), 0.04) 0%,
      rgba(var(--u-type-success-rgb, 25, 190, 107), 0.04) 40%,
      rgba(var(--u-type-warning-rgb, 255, 153, 0), 0.04) 100%
    );
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>
