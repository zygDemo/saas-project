import { BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

const IMAGE_UPLOAD_LIMIT = 10 * 1024 * 1024
const OCR_IMAGE_UPLOAD_LIMIT = 8 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
])
const ALLOWED_OCR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/bmp'])

export function imageUploadInterceptor() {
  return FileInterceptor('file', {
    limits: { fileSize: IMAGE_UPLOAD_LIMIT },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
        callback(new BadRequestException('仅支持 jpg、png、gif、webp、bmp 图片'), false)
        return
      }
      callback(null, true)
    }
  })
}

export function ocrImageUploadInterceptor() {
  return FileInterceptor('file', {
    limits: { fileSize: OCR_IMAGE_UPLOAD_LIMIT },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_OCR_MIME_TYPES.has(file.mimetype)) {
        callback(new BadRequestException('OCR 仅支持 jpg、png、webp、bmp 图片'), false)
        return
      }
      callback(null, true)
    }
  })
}
