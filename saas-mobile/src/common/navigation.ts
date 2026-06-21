import type { TabbarItem } from "uview-pro/types/global";

export const APP_ROUTES = {
  portal: {
    home: "/pages/index/index",
  },
  carloan: {
    home: "/pages/carloan/portal/workbench",
    orders: "/pages/carloan/precheck/orderList",
    legacyWorkbench: "/pages/carloan/workbench",
    portal: {
      workbench: "/pages/carloan/portal/workbench",
      messageCenter: "/pages/carloan/portal/messageCenter",
      todoCenter: "/pages/carloan/portal/todoCenter",
    },
    precheck: {
      leadAdd: "/pages/carloan/precheck/leadAdd",
      leadList: "/pages/carloan/precheck/leadList",
      entryList: "/pages/carloan/precheck/entryList",
      entryDetail: "/pages/carloan/precheck/entryDetail",
      idInfo: "/pages/carloan/precheck/idInfo",
      carInfo: "/pages/carloan/precheck/carInfo",
      applyInfo: "/pages/carloan/precheck/applyInfo",
      applyResult: "/pages/carloan/precheck/applyResult",
      applyListPage: "/pages/carloan/precheck/applyListPage",
      applyDetail: "/pages/carloan/precheck/applyDetail",
      applyProgress: "/pages/carloan/precheck/applyProgress",
      orderList: "/pages/carloan/precheck/orderList",
    },
    supplement: {
      supplementList: "/pages/carloan/supplement/supplementList",
      supplementDetail: "/pages/carloan/supplement/supplementDetail",
      idInfoSupplement: "/pages/carloan/supplement/idInfoSupplement",
      carInfoSupplement: "/pages/carloan/supplement/carInfoSupplement",
      orderInfoSupplement: "/pages/carloan/supplement/orderInfoSupplement",
      fileInfoSupplement: "/pages/carloan/supplement/fileInfoSupplement",
    },
    approval: {
      approvalList: "/pages/carloan/approval/approvalList",
      pawnApprovalList: "/pages/carloan/approval/pawnApprovalList",
      pawnApprovalDetail: "/pages/carloan/approval/pawnApprovalDetail",
      pawnMaterials: "/pages/carloan/approval/pawnMaterials",
      pawnLoanInfo: "/pages/carloan/approval/pawnLoanInfo",
    },
    signing: {
      signCenter: "/pages/carloan/signing/signCenter",
      signConfirmAmount: "/pages/carloan/signing/signConfirmAmount",
      signBindCard: "/pages/carloan/signing/signBindCard",
      videoFaceSign: "/pages/carloan/signing/videoFaceSign",
      faceSignList: "/pages/carloan/signing/faceSignList",
      faceSignResult: "/pages/carloan/signing/faceSignResult",
      signGpsAppointment: "/pages/carloan/signing/signGpsAppointment",
      signMortgage: "/pages/carloan/signing/signMortgage",
    },
  },
  food: {
    home: "/pages/food/index/index",
    orders: "/pages/food/order/list",
    cart: "/pages/food/order/cart",
  },
  reading: {
    home: "/pages/reading/index/index",
    store: "/pages/reading/store/index",
    detail: "/pages/reading/store/detail",
    reader: "/pages/reading/reader/index",
    download: "/pages/reading/download/list",
  },
  credit: {
    home: "/pages/credit/index/index",
  },
  my: {
    home: "/pages/my/my",
  },
  auth: {
    login: "/pages/auth/login",
  },
} as const;

export const TABBAR_SCOPES = {
  portal: "portal",
  carloan: "carloan",
  food: "food",
} as const;

export type TabbarScope = (typeof TABBAR_SCOPES)[keyof typeof TABBAR_SCOPES];
type NavigationMode = "switchTab" | "redirectTo" | "reLaunch";

export interface LayoutTabbarItem extends TabbarItem {
  route: string;
  navMode: NavigationMode;
}


export {
  buildDetailRouteQuery,
  buildEntryRouteQuery,
  buildRouteQuery,
  buildSignRouteQuery,
  buildSupplementRouteQuery,
} from "./carloan-route-query";
export type {
  CarloanDetailRouteQueryInput,
  CarloanEntryRouteQueryInput,
  CarloanSignRouteQueryInput,
  CarloanSupplementRouteQueryInput,
  RouteQueryRecord,
  RouteQueryValue,
} from "./carloan-route-query";

export function buildRoute(route: string, query?: string | RouteQueryRecord): string {
  const normalizedRoute = normalizeRoute(route);
  const queryString = toRouteQueryString(query);
  return queryString ? `${normalizedRoute}?${queryString}` : normalizedRoute;
}

export function buildHashRoute(route: string, query?: string | RouteQueryRecord): string {
  return `#${buildRoute(route, query)}`;
}

const SYSTEM_TABBAR_ROUTES = new Set([
  APP_ROUTES.portal.home,
  APP_ROUTES.carloan.home,
  APP_ROUTES.my.home,
]);

const PORTAL_TABBAR_ITEMS: LayoutTabbarItem[] = [
  {
    text: "首页",
    iconPath: "home",
    selectedIconPath: "home-fill",
    route: APP_ROUTES.portal.home,
    navMode: "switchTab",
    customIcon: false,
    count: 0,
  },
  {
    text: "我的",
    iconPath: "account",
    selectedIconPath: "account-fill",
    route: APP_ROUTES.my.home,
    navMode: "switchTab",
    customIcon: false,
    count: 0,
  },
];

const CARLOAN_TABBAR_ITEMS: LayoutTabbarItem[] = [
  {
    text: "首页",
    iconPath: "home",
    selectedIconPath: "home-fill",
    route: APP_ROUTES.carloan.home,
    navMode: "switchTab",
    customIcon: false,
    count: 0,
  },
  {
    text: "订单",
    iconPath: "list",
    selectedIconPath: "list-fill",
    route: APP_ROUTES.carloan.orders,
    navMode: "redirectTo",
    customIcon: false,
    count: 0,
  },
  {
    text: "我的",
    iconPath: "account",
    selectedIconPath: "account-fill",
    route: APP_ROUTES.my.home,
    navMode: "switchTab",
    customIcon: false,
    count: 0,
  },
];

const FOOD_TABBAR_ITEMS: LayoutTabbarItem[] = [
  {
    text: "首页",
    iconPath: "shopping",
    selectedIconPath: "shopping-fill",
    route: APP_ROUTES.food.home,
    navMode: "reLaunch",
    customIcon: false,
    count: 0,
  },
  {
    text: "订单",
    iconPath: "list",
    selectedIconPath: "list-fill",
    route: APP_ROUTES.food.orders,
    navMode: "redirectTo",
    customIcon: false,
    count: 0,
  },
  {
    text: "我的",
    iconPath: "account",
    selectedIconPath: "account-fill",
    route: APP_ROUTES.my.home,
    navMode: "switchTab",
    customIcon: false,
    count: 0,
  },
];

export function getLayoutTabbar(scope: TabbarScope = TABBAR_SCOPES.portal): LayoutTabbarItem[] {
  const source =
    scope === TABBAR_SCOPES.carloan
      ? CARLOAN_TABBAR_ITEMS
      : scope === TABBAR_SCOPES.food
        ? FOOD_TABBAR_ITEMS
        : PORTAL_TABBAR_ITEMS;

  return source.map((item) => ({ ...item }));
}

export function getCurrentPageRoute(): string {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return normalizeRoute(currentPage?.route || "");
}

export function isSystemTabbarRoute(route: string): boolean {
  return SYSTEM_TABBAR_ROUTES.has(normalizeRoute(route));
}

export function navigateFromTabbar(
  item?: Pick<LayoutTabbarItem, "route" | "navMode"> | null,
): Promise<void> {
  if (!item?.route) return Promise.resolve();

  const route = normalizeRoute(item.route);
  if (!route || route === getCurrentPageRoute()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const options = {
      url: route,
      success: () => resolve(),
      fail: reject,
    };

    if (item.navMode === "switchTab") {
      uni.switchTab(options);
      return;
    }

    if (item.navMode === "reLaunch") {
      uni.reLaunch(options);
      return;
    }

    if (getCurrentPages().length > 1) {
      uni.redirectTo(options);
      return;
    }

    uni.reLaunch(options);
  });
}

export function getFallbackRouteByPage(route = getCurrentPageRoute()): string {
  const currentRoute = normalizeRoute(route);

  if (currentRoute.startsWith("/pages/carloan/")) {
    return APP_ROUTES.carloan.home;
  }

  if (currentRoute.startsWith("/pages/food/")) {
    return APP_ROUTES.food.home;
  }

  if (currentRoute.startsWith("/pages/credit/")) {
    return APP_ROUTES.credit.home;
  }

  if (currentRoute.startsWith("/pages/my/")) {
    return APP_ROUTES.my.home;
  }

  return APP_ROUTES.portal.home;
}

export function navigateBackOrFallback() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 });
    return;
  }

  const fallbackRoute = getFallbackRouteByPage();
  if (isSystemTabbarRoute(fallbackRoute)) {
    uni.switchTab({ url: fallbackRoute });
    return;
  }

  uni.reLaunch({ url: fallbackRoute });
}

function normalizeRoute(route: string): string {
  if (!route) return "";
  return route.startsWith("/") ? route : `/${route}`;
}

function toRouteQueryString(query?: string | RouteQueryRecord): string {
  if (!query) return "";
  if (typeof query === "string") {
    return query.startsWith("?") ? query.slice(1) : query;
  }

  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
}
