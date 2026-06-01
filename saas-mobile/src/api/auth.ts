import { http } from "uview-pro";

export function useAuthApi() {
  return {
    // 登录
    login: (data: LoginData) => http.post<LoginResult>("/m/login", data),
    logout: () => http.post("/auth/logout"),
    sendSmsCode: (phone: string, type: "login" | "register" = "login") =>
      http.post("/auth/sms/send", { phone, type }),
    // 根据业务员ID从Redis缓存中获取token
    getToken: (salesmanId: string | number) =>
      http.get<GetTokenResult>("/m/getToken", { salesmanid: salesmanId }),
  };
}

export interface GetTokenResult {
  msg?: string;
  code?: number;
  data?: string;
  token?: string;
}

export interface LoginData {
  username?: string;
  phone?: string;
  password: string;
  code?: string;
  uuid?: string;
}

export interface LoginResult {
  token: string;
  refreshToken: string;
  expires: number;
  userInfo: Record<string, unknown>;
}
