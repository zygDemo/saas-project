import { IMAGE_BASE_URL } from "./env";

const ABSOLUTE_URL_RE = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

type FileRecord = Record<string, any>;

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
  if (/^(?:images|files|documents|videos|audio)\//i.test(path)) {
    return `/uploads/${path}`;
  }

  return path;
}

export function toFilePreviewUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (ABSOLUTE_URL_RE.test(raw)) return raw;

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

export function normalizeFileRecord<T extends FileRecord>(file: T) {
  const rawUrl = String(file?.fileUrl || file?.url || file?.objectKey || file?.fileKey || "");
  const rawPreviewUrl = String(file?.previewUrl || file?.fullUrl || "");
  const previewUrl = toFilePreviewUrl(rawPreviewUrl || rawUrl);

  return {
    ...file,
    rawUrl,
    previewUrl,
    url: previewUrl || rawUrl,
    fileUrl: file?.fileUrl || rawUrl,
    objectKey: file?.objectKey || file?.fileKey,
    fileKey: file?.fileKey || file?.objectKey,
  };
}

export function normalizeUploadResponse<T extends FileRecord>(response: T) {
  const responseData =
    response?.data && typeof response.data === "object" ? response.data : response;
  if (!hasFileReference(responseData || {})) return response;

  const normalizedData = normalizeFileRecord(responseData || {});

  return {
    ...response,
    ...normalizedData,
    data: normalizedData,
  };
}

function hasFileReference(file: FileRecord) {
  return Boolean(file?.fileUrl || file?.url || file?.objectKey || file?.fileKey);
}
