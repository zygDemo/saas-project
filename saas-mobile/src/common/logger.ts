/**
 * 生产环境日志工具
 *
 * 在开发环境输出完整日志，生产环境自动降级：
 * - log/info/debug：生产环境静默
 * - warn：生产环境保留（截断长参数）
 * - error：生产环境保留（用于错误监控）
 */
type LogLevel = "log" | "info" | "debug" | "warn" | "error";

const isProd = import.meta.env.PROD;

/** 安全的 JSON 序列化（处理循环引用） */
function safeStringify(obj: unknown): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      (_key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) return "[Circular]";
          seen.add(value);
        }
        return value;
      },
      0,
    );
  } catch {
    return String(obj);
  }
}

/** 截断过长的日志参数 */
function truncateArg(arg: unknown, maxLen = 500): unknown {
  if (typeof arg === "string" && arg.length > maxLen) {
    return `${arg.slice(0, maxLen)}...[truncated]`;
  }
  if (typeof arg === "object" && arg !== null) {
    const str = safeStringify(arg);
    if (str.length > maxLen) {
      return `${str.slice(0, maxLen)}...[truncated]`;
    }
  }
  return arg;
}

function createLogFn(level: LogLevel) {
  return (...args: unknown[]) => {
    // 生产环境：log/info/debug 静默
    if (isProd && (level === "log" || level === "info" || level === "debug")) {
      return;
    }

    // 生产环境：warn/error 截断长参数
    const processedArgs = isProd ? args.map((arg) => truncateArg(arg)) : args;

    // eslint-disable-next-line no-console
    console[level](...processedArgs);
  };
}

export const logger = {
  log: createLogFn("log"),
  info: createLogFn("info"),
  debug: createLogFn("debug"),
  warn: createLogFn("warn"),
  error: createLogFn("error"),
};

/** 条件性日志：仅在指定条件成立时输出 */
export function logIf(condition: boolean, level: LogLevel, ...args: unknown[]) {
  if (condition) {
    logger[level](...args);
  }
}
