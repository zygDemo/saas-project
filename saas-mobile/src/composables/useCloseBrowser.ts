export function closeBrowser() {
  // #ifdef H5
  const win = window as any;
  if (win.WeixinJSBridge?.call) {
    win.WeixinJSBridge.call("closeWindow");
    return;
  }
  if (win.AlipayJSBridge?.call) {
    win.AlipayJSBridge.call("closeWebview");
    return;
  }

  window.close();
  setTimeout(() => {
    if (!window.closed) {
      uni.showToast({ title: "请手动关闭当前页面", icon: "none" });
    }
  }, 300);
  // #endif

  // #ifndef H5
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.reLaunch({ url: "/pages/business/workbench" });
    },
  });
  // #endif
}
