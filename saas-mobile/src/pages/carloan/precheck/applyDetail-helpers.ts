/**
 * applyDetail 页面辅助函数（从原 script 中提取）
 */

export function safeDecode(str: string) {
  try { return decodeURIComponent(str); } catch { return str; }
}

export function normalizeRouteQuery(options: Record<string, any>) {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(options)) {
    if (v !== undefined && v !== null) query[k] = safeDecode(String(v));
  }
  return query;
}

export function buildRouteFallbackDetail() {
  return null;
}

export function hasDetailPayload(data: any) {
  return data && (data.uuid || data.id || data.creditOrderId || data.orderNo);
}

export function pickDetailUuid(data: any) {
  return data?.uuid || data?.detailUuid || "";
}

export function normalizeDetailPayload(data: any) {
  if (!data) return null;
  return { ...data };
}
