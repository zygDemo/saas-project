const FRONTEND_BASE_PREFIX = '/saas/mobile'
const FILE_OBJECT_KEY_PREFIX_RE = /^(?:images|files|documents|videos|audio)\//i

export function normalizeApiPrefix(apiPrefix?: string | null) {
  return String(apiPrefix || 'saas/api').replace(/^\/+|\/+$/g, '')
}

export function buildUploadUrl(objectKey: string, apiPrefix?: string | null) {
  const prefix = normalizeApiPrefix(apiPrefix)
  return normalizeFileUrl(objectKey, prefix)
}

export function normalizeFileUrl(reference?: string | null, apiPrefix?: string | null) {
  const raw = String(reference || '').trim()
  if (!raw) return ''

  const prefix = normalizeApiPrefix(apiPrefix)
  const apiBase = `/${prefix}`
  const absoluteMatch = raw.match(/^(https?:\/\/[^/]+)(\/.*)$/i)
  if (absoluteMatch) {
    const normalizedPath = normalizeFilePath(absoluteMatch[2], prefix)
    return normalizedPath ? `${absoluteMatch[1]}${normalizedPath}` : raw
  }

  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(raw)) {
    return raw
  }

  const normalizedPath = normalizeFilePath(raw, prefix)
  if (normalizedPath) return normalizedPath

  return raw.startsWith('/') ? raw : `${apiBase}/uploads/${raw.replace(/^\/+/, '')}`
}

export function resolveObjectKeyFromFileUrl(reference?: string | null, apiPrefix?: string | null) {
  const raw = String(reference || '').trim()
  if (!raw) return undefined

  const prefix = normalizeApiPrefix(apiPrefix)
  const normalizedUrl = normalizeFileUrl(raw, prefix)
  const marker = `/${prefix}/uploads/`
  const path = normalizedUrl.replace(/^https?:\/\/[^/]+/i, '')

  if (path.startsWith(marker)) return path.slice(marker.length)
  if (FILE_OBJECT_KEY_PREFIX_RE.test(raw)) return raw.replace(/^\/+/, '')
  return undefined
}

function normalizeFilePath(reference: string, apiPrefix: string) {
  const apiBase = `/${apiPrefix}`
  const raw = reference.trim()
  const path = raw.startsWith('/') ? raw : `/${raw}`

  if (path.startsWith(`${FRONTEND_BASE_PREFIX}${apiBase}/`)) {
    return path.replace(FRONTEND_BASE_PREFIX, '')
  }

  if (path.startsWith(`${apiBase}/`)) return path

  if (path.startsWith('/api/uploads/') && apiPrefix !== 'api') {
    return `${apiBase}${path.slice('/api'.length)}`
  }

  if (path.startsWith('/uploads/')) return `${apiBase}${path}`

  const withoutSlash = raw.replace(/^\/+/, '')
  if (FILE_OBJECT_KEY_PREFIX_RE.test(withoutSlash)) {
    return `${apiBase}/uploads/${withoutSlash}`
  }

  return ''
}
