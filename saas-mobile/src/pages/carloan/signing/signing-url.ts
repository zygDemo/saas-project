export function safeDecode(value: string | number | null | undefined) {
  let decoded = String(value ?? "").replace(/\+/g, " ");
  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    } catch {
      break;
    }
  }
  return decoded;
}

/** 从 window.location.hash 解析所有查询参数（H5） */
export function getHashQuery(): Record<string, string> {
  const result: Record<string, string> = {};
  // #ifdef H5
  try {
    const hash = window.location.hash || "";
    const idx = hash.indexOf("?");
    if (idx === -1) return result;
    hash
      .slice(idx + 1)
      .split("&")
      .forEach((pair) => {
        const eq = pair.indexOf("=");
        if (eq > -1) {
          result[safeDecode(pair.slice(0, eq))] = safeDecode(pair.slice(eq + 1));
        }
      });
  } catch {
    // ignore
  }
  // #endif
  return result;
}

/** 获取三方追加的额外参数（H5 从 hash 提取，非 H5 返回空） */
export function getExtraParams(): Record<string, string> {
  // #ifdef H5
  try {
    const hash = window.location.hash;
    if (!hash) return {};
    const parts = hash.split("?");
    if (parts.length < 3) return {};
    const qs = parts.slice(2).join("?");
    const params: Record<string, string> = {};
    qs.split("&").forEach((pair) => {
      const i = pair.indexOf("=");
      if (i > -1) params[safeDecode(pair.slice(0, i))] = safeDecode(pair.slice(i + 1));
    });
    return params;
  } catch {
    return {};
  }
  // #endif
  return {};
}

/** 获取当前环境的基础 URL */
export function getBaseUrl() {
  // #ifdef H5
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}`;
  // #endif
  return "";
}

export function getNowTime() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
}
