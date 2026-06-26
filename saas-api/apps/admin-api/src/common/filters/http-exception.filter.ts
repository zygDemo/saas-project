import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { Response } from 'express'
import { ApiStatus } from '../constants/api-status'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()
    const status = getStatus(exception)
    const body = exception instanceof HttpException ? exception.getResponse() : null
    const message =
      extractMessage(body) ??
      extractPrismaMessage(exception) ??
      extractMulterMessage(exception) ??
      '服务器内部错误'

    response.status(200).json({
      code: statusToApiCode(status),
      msg: message,
      data: null,
    })
  }
}

function getStatus(exception: unknown) {
  if (exception instanceof HttpException) return exception.getStatus()
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    if (exception.code === 'P2002') return HttpStatus.CONFLICT
    if (exception.code === 'P2003') return HttpStatus.BAD_REQUEST
    if (exception.code === 'P2025') return HttpStatus.NOT_FOUND
  }
  if (isMulterError(exception)) return HttpStatus.BAD_REQUEST
  return HttpStatus.INTERNAL_SERVER_ERROR
}

/** 检测 Multer 相关错误（包括 NestJS 包装后的 BadRequestException） */
function isMulterError(exception: unknown) {
  if (exception instanceof BadRequestException) {
    const res = exception.getResponse()
    const msg = typeof res === 'string' ? res : (res as { message?: string })?.message
    if (typeof msg === 'string' && /Multer|file|upload|multipart|boundary/i.test(msg)) {
      return true
    }
  }
  // 也检测原生 MulterError（MulterError 有 code 和 field 属性）
  const err = exception as { code?: string; field?: string; message?: string }
  if (err?.code && err?.field && err?.message) {
    return true
  }
  return false
}

function extractMulterMessage(exception: unknown) {
  if (exception instanceof BadRequestException) {
    const res = exception.getResponse()
    const msg = typeof res === 'string' ? res : (res as { message?: string })?.message
    if (typeof msg === 'string' && /Multer|file|upload|multipart|boundary/i.test(msg)) {
      return `文件上传失败：${msg}`
    }
  }
  const err = exception as { code?: string; field?: string; message?: string }
  if (err?.code && err?.field && err?.message) {
    return `文件上传失败 [${err.code}]: ${err.message}`
  }
  return undefined
}

function extractPrismaMessage(exception: unknown) {
  if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) return undefined
  if (exception.code === 'P2002') return `唯一约束冲突：${formatPrismaMeta(exception.meta?.target)}`
  if (exception.code === 'P2003') return '关联数据约束校验失败'
  if (exception.code === 'P2025') return '记录不存在'
  return undefined
}

function formatPrismaMeta(value: unknown) {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'string') return value
  return '未知字段'
}

function extractMessage(body: unknown) {
  if (typeof body === 'string') return body
  if (!body || typeof body !== 'object') return undefined
  const message = (body as { message?: string | string[] }).message
  if (Array.isArray(message)) return message[0]
  return message
}

function statusToApiCode(status: number) {
  if (status === HttpStatus.UNAUTHORIZED) return ApiStatus.unauthorized
  if (status === HttpStatus.FORBIDDEN) return ApiStatus.forbidden
  if (status === HttpStatus.NOT_FOUND) return ApiStatus.notFound
  if (status >= 500) return ApiStatus.internalServerError
  return ApiStatus.error
}
