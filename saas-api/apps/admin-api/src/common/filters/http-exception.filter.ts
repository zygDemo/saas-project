import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { ThrottlerException } from '@nestjs/throttler'
import { WsException } from '@nestjs/websockets'
import { Prisma } from '@prisma/client'
import { Request, Response } from 'express'
import { ApiStatus } from '../constants/api-status'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    // WebSocket 异常单独处理
    if (host.getType() === 'ws') {
      this.handleWsException(exception, host)
      return
    }

    this.handleHttpException(exception, host)
  }

  // ─── WebSocket 错误 ─────────────────────────────────────────────
  private handleWsException(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient()

    let message = 'WebSocket 错误'
    let code = 1000

    if (exception instanceof WsException) {
      const error = exception.getError()
      message = typeof error === 'string' ? error : (error as any)?.message || message
      code = (error as any)?.code ?? 1000
    } else if (exception instanceof HttpException) {
      message = extractMessage(exception.getResponse())
      code = exception.getStatus()
    } else if (exception instanceof Error) {
      message = exception.message
    }

    this.logger.error(`[WS] ${message}`, exception instanceof Error ? exception.stack : '')

    client.emit('exception', { status: 'error', message, code })
  }

  // ─── HTTP 错误 ──────────────────────────────────────────────────
  private handleHttpException(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<Request>()
    const response = host.switchToHttp().getResponse<Response>()
    const traceId = (request.headers['x-request-id'] as string) || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    const status = getStatus(exception)
    const message =
      extractMessage(exception instanceof HttpException ? exception.getResponse() : null) ??
      extractPrismaMessage(exception) ??
      extractMulterMessage(exception) ??
      extractThrottlerMessage(exception) ??
      '服务器内部错误'

    // 5xx 记录完整堆栈
    if (status >= 500) {
      this.logger.error(`[${request.method}] ${request.url} → ${status} ${message}`, exception instanceof Error ? exception.stack : '')
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${status} ${message}`)
    }

    const body: Record<string, unknown> = {
      code: statusToApiCode(status),
      data: null,
      msg: message,
    }

    // 开发模式返回完整堆栈
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      body.traceId = exception.stack
    } else {
      body.traceId = traceId
    }

    response.status(200).json(body)
  }
}

// ─── 状态码解析 ────────────────────────────────────────────────────
function getStatus(exception: unknown) {
  if (exception instanceof ThrottlerException) return HttpStatus.TOO_MANY_REQUESTS
  if (exception instanceof HttpException) return exception.getStatus()
  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    if (exception.code === 'P2002') return HttpStatus.CONFLICT
    if (exception.code === 'P2003') return HttpStatus.BAD_REQUEST
    if (exception.code === 'P2025') return HttpStatus.NOT_FOUND
  }
  if (isMulterError(exception)) return HttpStatus.BAD_REQUEST
  return HttpStatus.INTERNAL_SERVER_ERROR
}

function extractThrottlerMessage(exception: unknown) {
  if (exception instanceof ThrottlerException) return '请求过于频繁，请稍后再试'
  return undefined
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
  if (status === HttpStatus.UNAUTHORIZED) return ApiStatus.UNAUTHORIZED
  if (status === HttpStatus.FORBIDDEN) return ApiStatus.FORBIDDEN
  if (status === HttpStatus.NOT_FOUND) return ApiStatus.NOT_FOUND
  if (status === HttpStatus.TOO_MANY_REQUESTS) return ApiStatus.TOO_MANY_REQUESTS
  if (status >= 500) return ApiStatus.INTERNAL_SERVER_ERROR
  return ApiStatus.BAD_REQUEST
}
