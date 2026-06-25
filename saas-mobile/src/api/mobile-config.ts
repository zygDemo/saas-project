import { http } from "uview-pro";

export interface MobileModuleItem {
  key: string;
  name: string;
  icon: string;
  desc: string;
}

export interface MobileConfigData {
  available: MobileModuleItem[];
  enabled: string[];
  defaultModule: string | null;
  isMultiModule: boolean;
}

/** 获取当前租户的移动端模块配置 */
export const fetchMobileConfig = () => http.get<MobileConfigData>("/mobile-config");
