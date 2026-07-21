import request from '@/utils/http'

export interface OcrResult {
  success: boolean
  text?: string
  data?: Record<string, unknown>
  confidence?: number
  error?: string
}

export interface OcrObjectKeyDto {
  objectKey?: string
  fileKey?: string
  url?: string
  fileUrl?: string
  side?: 'front' | 'back'
}

/** OCR 健康检查 */
export function fetchOcrHealth() {
  return request.get<{ status: string }>({ url: '/ocr/health' })
}

/** 上传文件并识别 */
export function fetchOcrUpload(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<OcrResult>({ url: '/ocr/upload', data: formData })
}

/** 通过 objectKey 识别 */
export function fetchOcrByObjectKey(data: OcrObjectKeyDto) {
  return request.post<OcrResult>({ url: '/ocr/by-object-key', data })
}

/** 车辆行驶证识别 */
export function fetchOcrVehicle(data: OcrObjectKeyDto) {
  return request.post<OcrResult>({ url: '/ocr/vehicle', data })
}

/** 身份证识别 */
export function fetchOcrIdCard(data: OcrObjectKeyDto) {
  return request.post<OcrResult>({ url: '/ocr/id-card', data })
}
