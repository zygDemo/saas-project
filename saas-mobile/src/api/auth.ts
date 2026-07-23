import { http } from "uview-pro";

const LOGIN_URL = "/auth/login";

export function useAuthApi() {
  return {
    // 登录
    login: (data: LoginData) => http.post<LoginResult>(LOGIN_URL, data, { loadingText: '登录中...' }),
    getUserInfo: () => http.get<UserInfoResult>("/user/info"),
    logout: () => http.post('/auth/logout', undefined, { loadingText: '退出中...' }),
    sendSmsCode: (phone: string, type: 'login' | 'register' = 'login') =>
      http.post('/auth/sms/send', { phone, type }, { loadingText: '发送中...' }),
    // 根据业务员ID从Redis缓存中获取token
    getToken: (salesmanId: string | number) =>
      http.get<GetTokenResult>("/m/getToken", { salesmanid: salesmanId }),
    // 发送邮箱验证码
    sendEmailCode: (email: string, type: 'login' | 'register' = 'login') =>
      http.post('/auth/email/send-code', { email, type }, { loadingText: '发送中...' }),
    // 邮箱验证码登录
    emailLogin: (email: string, code: string) =>
      http.post<LoginResult>('/auth/email/login', { email, code }, { loadingText: '登录中...' }),
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
