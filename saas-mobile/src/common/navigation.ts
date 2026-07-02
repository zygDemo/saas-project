import type { TabbarItem } from "uview-pro/types/global";
import type { RouteQueryRecord } from "./carloan-route-query";

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
  reading: "reading",
  portal: "portal",
  carloan: "carloan",
  food: "food",
  credit: "credit",
} as const;

export type TabbarScope = (typeof TABBAR_SCOPES)[keyof typeof TABBAR_SCOPES];
export type MobileModuleKey = "carloan" | "food" | "credit" | "reading";

export interface MobileModuleConfigLike {
  enabled?: string[];
  defaultModule?: string | null;
  isMultiModule?: boolean;
}

const MOBILE_MODULE_KEYS: MobileModuleKey[] = [
  "carloan",
  "food",
  "credit",
  "reading",
];

const MODULE_HOME_ROUTE_MAP: Record<MobileModuleKey, string> = {
  carloan: APP_ROUTES.carloan.home,
  food: APP_ROUTES.food.home,
  credit: APP_ROUTES.credit.home,
  reading: APP_ROUTES.reading.home,
};

const MODULE_SYSTEM_MAP: Record<MobileModuleKey, string> = {
  carloan: "carloan",
  food: "food",
  credit: "credit",
  reading: "reading",
};

export function isMobileModuleKey(key?: string | null): key is MobileModuleKey {
  return Boolean(key && MOBILE_MODULE_KEYS.includes(key as MobileModuleKey));
}

export function getEnabledMobileModules(
  config?: MobileModuleConfigLike | null,
): MobileModuleKey[] {
  const enabled = Array.isArray(config?.enabled) ? config.enabled : [];
  return enabled.filter(isMobileModuleKey);
}

export function getModuleHomeRoute(key?: string | null): string | null {
  return isMobileModuleKey(key) ? MODULE_HOME_ROUTE_MAP[key] : null;
}

export function getModuleSystem(key?: string | null): string | null {
  return isMobileModuleKey(key) ? MODULE_SYSTEM_MAP[key] : null;
}

export function getActiveModuleKeyBySystem(
  system?: string | null,
): MobileModuleKey | null {
  return isMobileModuleKey(system) ? system : null;
}

export function canSwitchMobileModule(
  config?: MobileModuleConfigLike | null,
): boolean {
  return Boolean(config?.isMultiModule && getEnabledMobileModules(config).length > 1);
}

export function getInitialMobileEntry(
  config?: MobileModuleConfigLike | null,
): { route: string; system: string; moduleKey: MobileModuleKey | null } {
  const enabledModules = getEnabledMobileModules(config);

  if (canSwitchMobileModule(config)) {
    return {
      route: APP_ROUTES.portal.home,
      system: "portal",
      moduleKey: null,
    };
  }

  const preferredModule = isMobileModuleKey(config?.defaultModule)
    && enabledModules.includes(config.defaultModule)
    ? config.defaultModule
    : enabledModules[0];

  if (preferredModule) {
    return {
      route: MODULE_HOME_ROUTE_MAP[preferredModule],
      system: MODULE_SYSTEM_MAP[preferredModule],
      moduleKey: preferredModule,
    };
  }

  return {
    route: APP_ROUTES.portal.home,
    system: "portal",
    moduleKey: null,
  };
}

// ─── 角色 → 默认模块映射 ───
// key = roleKey，value = 跳转目标模块的首页路由
// 未命中任何角色的用户留在 portal 门户页
const ROLE_MODULE_MAP: Record<string, string> = {
  R_USER: APP_ROUTES.carloan.home,
  R_SALES_MANAGER: APP_ROUTES.carloan.home,
  // 按需扩展：
  // R_FOOD_USER: APP_ROUTES.food.home,
  // R_CREDIT_USER: APP_ROUTES.credit.home,
};

/** 路由前缀 → CurrentSystem 映射 */
const ROUTE_SYSTEM_MAP: Record<string, string> = {
  "/pages/carloan/": "carloan",
  "/pages/food/": "food",
  "/pages/credit/": "credit",
  "/pages/reading/": "reading",
};

/** 根据路由路径推断所属模块系统 */
export function getSystemByRoute(route: string): string {
  for (const [prefix, system] of Object.entries(ROUTE_SYSTEM_MAP)) {
    if (route.startsWith(prefix)) return system;
  }
  return "portal";
}

/** 根据用户角色返回应进入的模块首页路由，null 表示留在门户 */
export function getDefaultModuleRoute(roleKeys: string[]): string | null {
  for (const key of roleKeys) {
    if (ROLE_MODULE_MAP[key]) return ROLE_MODULE_MAP[key];
  }
  return null;
}
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

export function buildRoute(
  route: string,
  query?: string | RouteQueryRecord,
): string {
  const normalizedRoute = normalizeRoute(route);
  const queryString = toRouteQueryString(query);
  return queryString ? `${normalizedRoute}?${queryString}` : normalizedRoute;
}

export function buildHashRoute(
  route: string,
  query?: string | RouteQueryRecord,
): string {
  return `#${buildRoute(route, query)}`;
}

const SYSTEM_TABBAR_ROUTES: Set<string> = new Set([
  APP_ROUTES.portal.home,
  APP_ROUTES.carloan.home,
  APP_ROUTES.carloan.orders,
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
    navMode: "reLaunch",
    customIcon: false,
    count: 0,
  },
  {
    text: "订单",
    iconPath: "order",
    selectedIconPath: "order",
    route: APP_ROUTES.carloan.orders,
    navMode: "reLaunch",
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
    iconPath: "shopping-cart",
    selectedIconPath: "shopping-cart-fill",
    route: APP_ROUTES.food.home,
    navMode: "reLaunch",
    customIcon: false,
    count: 0,
  },
  {
    text: "订单",
    iconPath: "list",
    selectedIconPath: "list",
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

const CREDIT_TABBAR_ITEMS: LayoutTabbarItem[] = [
  {
    text: "首页",
    iconPath: "home",
    selectedIconPath: "home-fill",
    route: APP_ROUTES.credit.home,
    navMode: "reLaunch",
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

const READING_TABBAR_ITEMS: LayoutTabbarItem[] = [
  {
    text: "书架",
    iconPath: "file-text",
    selectedIconPath: "file-text-fill",
    route: APP_ROUTES.reading.home,
    navMode: "redirectTo",
    customIcon: false,
    count: 0,
  },
  {
    text: "书城",
    iconPath: "shopping-cart",
    selectedIconPath: "shopping-cart-fill",
    route: APP_ROUTES.reading.store,
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

export function getLayoutTabbar(
  scope: TabbarScope = TABBAR_SCOPES.portal,
): LayoutTabbarItem[] {
  const source =
    scope === TABBAR_SCOPES.carloan
      ? CARLOAN_TABBAR_ITEMS
      : scope === TABBAR_SCOPES.reading
        ? READING_TABBAR_ITEMS
        : scope === TABBAR_SCOPES.food
          ? FOOD_TABBAR_ITEMS
          : scope === TABBAR_SCOPES.credit
            ? CREDIT_TABBAR_ITEMS
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
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join("&");
}
