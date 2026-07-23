import { http } from "uview-pro";

export interface CreditQuerySubmitData {
  name: string;
  idcard: string;
  phone: string;
  code?: string;
}

export function useCreditApi() {
  return {
    sendVerifyCode: (phone: string) => http.post('/m/credit-query/send-code', { phone }, { loadingText: '发送中...' }),
    submitQuery: (data: CreditQuerySubmitData) => http.post('/m/credit-query/submit', data, { loadingText: '查询中...' }),
    getQueryResult: (queryId: number | string) => http.get("/m/credit-query/result/" + queryId),
    getQueryList: (params?: Record<string, unknown>) => http.get("/m/credit-query/list", params),
  };
}
