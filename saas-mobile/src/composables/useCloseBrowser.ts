import { navigateBackOrFallback } from "@/common/navigation";

export function closeBrowser() {
  // #ifdef H5
  const win = window as unknown as {
    WeixinJSBridge?: { call: (action: string) => void };
    AlipayJSBridge?: { call: (action: string) => void };
    close: () => void;
    closed: boolean;
  };
  if (win.WeixinJSBridge?.call) {
    win.WeixinJSBridge.call("closeWindow");
    return;
  }
  if (win.AlipayJSBridge?.call) {
    win.AlipayJSBridge.call("closeWebview");
    return;
  }

  win.close();
  setTimeout(() => {
    if (!win.closed) {
      uni.showToast({ title: "请手动关闭当前页面", icon: "none" });
    }
  }, 300);
  // #endif

  // #ifndef H5
  navigateBackOrFallback();
  // #endif
}
