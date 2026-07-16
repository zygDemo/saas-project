import * as Pinia from "pinia";
import uViewPro, { httpPlugin } from "uview-pro";
import { createSSRApp } from "vue";
import themes from "@/common/uview-pro.theme";
import i18n from "@/locale";
import store from "@/stores";
import App from "./App.vue";
import { httpInterceptor, httpRequestConfig } from "./common/http.interceptor";

// 微信小程序子包页面 require 主包非页面文件时，需要该文件已在主包模块系统中注册
// 使用实际引用防止 Vite tree-shaking 移除无副作用的模块导入
import { useFoodApi } from "@/api/food";
import { useReadingApi } from "@/api/reading";
globalThis.__registeredApis = { useFoodApi, useReadingApi };

// 根据 URL 参数决定是否启用 vConsole
// #ifdef H5
if (
  typeof window !== "undefined" &&
  (window.location.search.includes("vConsole=1") ||
    window.location.hash.includes("vConsole=1"))
) {
  import("vconsole").then(({ default: VConsole }) => {
    new VConsole();
  });
}
// #endif

export function createApp() {
  const app = createSSRApp(App);
  app.use(i18n);
  app.use(uViewPro, {
    theme: {
      themes,
      defaultTheme: "nebula",
      defaultDarkMode: "light",
    },
    locale: "zh-CN",
  });
  app.use(httpPlugin, {
    requestConfig: httpRequestConfig,
    interceptor: httpInterceptor,
  });
  app.use(store);
  return {
    app,
    Pinia,
  };
}
