import { IMAGE_BASE_URL } from "./env";

const ABSOLUTE_URL_RE = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;
const API_PREFIX = "/saas/api";
const FRONTEND_BASE_PREFIX = "/saas/mobile";

export interface FileRecord {
  [key: string]: unknown;
}

const EMPTY_FILE_RECORD: FileRecord = {};

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function trimLeadingSlash(value: string) {
  return value.replace(/^\/+/, "");
}

function hasPathPrefix(path: string, prefix: string) {
  const normalizedPath = trimLeadingSlash(path);
  const normalizedPrefix = trimLeadingSlash(prefix);
  return Boolean(
    normalizedPrefix &&
      (normalizedPath === normalizedPrefix ||
        normalizedPath.startsWith(`${normalizedPrefix}/`)),
  );
}

function parseAbsoluteBase(base: string) {
  const match = base.match(/^(https?:\/\/[^/]+)(\/.*)?$/i);
  if (!match) return null;

  return {
    origin: match[1],
    path: trimTrailingSlash(match[2] || ""),
  };
}

function normalizeRelativeFilePath(value: string) {
  const raw = value.trim();
  if (!raw || raw.startsWith("/") || ABSOLUTE_URL_RE.test(raw)) return raw;

  const path = trimLeadingSlash(raw);
  if (/^(?:saas\/api|api)\/uploads\//i.test(path)) {
    return `/${path}`;
  }

  if (/^(?:images|files|documents|videos|audio)\//i.test(path)) {
    return `/uploads/${path}`;
  }

  return path;
}

function normalizeApiFilePath(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  const path = raw.startsWith("/") ? raw : `/${raw}`;
  if (path.startsWith(`${FRONTEND_BASE_PREFIX}${API_PREFIX}/`)) {
    return path.replace(FRONTEND_BASE_PREFIX, "");
  }

  if (path.startsWith(`${API_PREFIX}/`)) return path;
  if (path.startsWith("/api/uploads/")) return `${API_PREFIX}${path.slice("/api".length)}`;
  if (path.startsWith("/uploads/")) return `${API_PREFIX}${path}`;

  const withoutSlash = trimLeadingSlash(raw);
  if (/^(?:images|files|documents|videos|audio)\//i.test(withoutSlash)) {
    return `${API_PREFIX}/uploads/${withoutSlash}`;
  }

  return "";
}

function toApiPreviewUrl(apiPath: string) {
  const absoluteBase = parseAbsoluteBase(trimTrailingSlash(IMAGE_BASE_URL || ""));
  if (absoluteBase) return `${absoluteBase.origin}${apiPath}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${apiPath}`;
  }
  return apiPath;
}

function logPreviewUrl(raw: string, normalized: string, source: string) {
  console.log("[file-url] image src before render:", {
    source,
    raw,
    normalized,
    imageBaseUrl: IMAGE_BASE_URL,
  });
  return normalized;
}

export function toFilePreviewUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const absoluteMatch = raw.match(/^(https?:\/\/[^/]+)(\/.*)$/i);
  if (absoluteMatch) {
    const apiPath = normalizeApiFilePath(absoluteMatch[2]);
    return apiPath ? logPreviewUrl(raw, `${absoluteMatch[1]}${apiPath}`, "absolute-api") : raw;
  }

  if (ABSOLUTE_URL_RE.test(raw)) return raw;

  const apiPath = normalizeApiFilePath(raw);
  if (apiPath) return logPreviewUrl(raw, toApiPreviewUrl(apiPath), "api-path");

  const base = trimTrailingSlash(IMAGE_BASE_URL || "");
  const filePath = normalizeRelativeFilePath(raw);
  if (!base) return filePath;

  const absoluteBase = parseAbsoluteBase(base);
  if (absoluteBase) {
    const basePath = absoluteBase.path;
    const basePathWithoutSlash = trimLeadingSlash(basePath);

    if (filePath.startsWith("/")) {
      if (basePath && filePath.startsWith(`${basePath}/`)) {
        return `${absoluteBase.origin}${filePath}`;
      }
      return `${absoluteBase.origin}${basePath}${filePath}`;
    }

    const path = trimLeadingSlash(filePath);
    if (basePathWithoutSlash && path.startsWith(`${basePathWithoutSlash}/`)) {
      return `${absoluteBase.origin}/${path}`;
    }

    return `${absoluteBase.origin}${basePath}/${path}`;
  }

  if (filePath.startsWith("/")) {
    if (base.startsWith("/") && !filePath.startsWith(`${base}/`) && filePath.startsWith("/uploads/")) {
      return `${base}${filePath}`;
    }
    return filePath;
  }

  if (base.startsWith("/") && hasPathPrefix(filePath, base)) {
    return `/${trimLeadingSlash(filePath)}`;
  }

  return `${base}/${trimLeadingSlash(filePath)}`;
}

function toFileRecord(value: unknown): FileRecord {
  return (value || EMPTY_FILE_RECORD) as FileRecord;
}

export function normalizeFileRecord(file: unknown): FileRecord {
  const record = toFileRecord(file);
  const rawUrl = String((record?.fileUrl || record?.url || record?.objectKey || record?.fileKey || "") as string);
  const rawPreviewUrl = String((record?.previewUrl || record?.fullUrl || "") as string);
  const previewUrl = toFilePreviewUrl(rawPreviewUrl || rawUrl);
  const fileUrl = toFilePreviewUrl((record?.fileUrl || rawUrl) as string);

  return {
    ...record,
    rawUrl,
    previewUrl,
    url: previewUrl || rawUrl,
    fileUrl: fileUrl || rawUrl,
    objectKey: record?.objectKey || record?.fileKey,
    fileKey: record?.fileKey || record?.objectKey,
  };
}

export function normalizeUploadItem(file: unknown): FileRecord {
  const record = toFileRecord(file);
  const normalizedResponse = normalizeFileRecord(record?.response || EMPTY_FILE_RECORD);
  const previewUrl = toFilePreviewUrl(
    (record?.previewUrl ||
      normalizedResponse.previewUrl ||
      record?.url ||
      record?.path ||
      record?.thumb ||
      "") as string,
  );

  return {
    ...record,
    previewUrl,
    url: previewUrl || record?.url || "",
    path: previewUrl || record?.path || "",
    thumb: toFilePreviewUrl((record?.thumb || previewUrl) as string),
    response: record?.response ? normalizeFileRecord(record.response) : normalizedResponse,
  };
}

export function normalizeUploadResponse(response: unknown): FileRecord {
  const record = toFileRecord(response);
  const responseData = ((record?.data && typeof record.data === "object" ? record.data : record) || EMPTY_FILE_RECORD) as FileRecord;
  if (!hasFileReference(responseData)) return record;

  const normalizedData = normalizeFileRecord(responseData as unknown as FileRecord);

  return {
    ...record,
    ...normalizedData,
    data: normalizedData,
  };
}

function hasFileReference(file: FileRecord) {
  return Boolean(file?.fileUrl || file?.url || file?.objectKey || file?.fileKey);
}
