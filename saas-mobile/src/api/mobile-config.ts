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

/** 获取当前用户的移动端模块配置（用户→角色→租户三级优先级） */
export const fetchMobileConfig = () => http.get<MobileConfigData>("/mobile-config/resolved");

