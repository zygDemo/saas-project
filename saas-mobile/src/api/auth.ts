import { http } from "uview-pro";

const LOGIN_URL = "/auth/login";

export function useAuthApi() {
  return {
    // 登录
    login: (data: LoginData) => http.post<LoginResult>(LOGIN_URL, data),
    getUserInfo: () => http.get<UserInfoResult>("/user/info"),
    logout: () => http.post("/auth/logout"),
    sendSmsCode: (phone: string, type: "login" | "register" = "login") =>
      http.post("/auth/sms/send", { phone, type }),
    // 根据业务员ID从Redis缓存中获取token
    getToken: (salesmanId: string | number) =>
      http.get<GetTokenResult>("/m/getToken", { salesmanid: salesmanId }),
    // 发送邮箱验证码
    sendEmailCode: (email: string, type: 'login' | 'register' = 'login') =>
      http.post('/auth/email/send-code', { email, type }),
    // 邮箱验证码登录
    emailLogin: (email: string, code: string) =>
      http.post<LoginResult>('/auth/email/login', { email, code }),
  };
}

export interface GetTokenResult {
  msg?: string;
  code?: number;
  data?: string;
  token?: string;
}

export interface LoginData {
  userName: string;
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

export interface UserInfoResult {
  userId: number | string;
  userName: string;
  email?: string;
  avatar?: string;
  roles?: string[];
  buttons?: string[];
}
