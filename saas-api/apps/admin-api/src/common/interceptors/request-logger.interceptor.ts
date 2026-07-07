import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable, catchError, tap, throwError } from 'rxjs'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../modules/prisma/prisma.service'

const MAX_PAYLOAD_LENGTH = 2000
const AUDIT_LOG_RETENTION_DAYS = 3
const AUDIT_LOG_RETENTION_MS = AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000
const AUDIT_LOG_CLEANUP_INTERVAL_MS = 60 * 60 * 1000
const SENSITIVE_KEYS = ['authorization', 'password', 'token', 'refreshtoken', 'accessToken']
const SKIP_AUDIT_PATHS = ['/data-center/audit-logs', '/health']

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')
  private lastAuditCleanupAt = 0

  constructor(private readonly prisma?: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()
    const startedAt = Date.now()

    return next.handle().pipe(
      tap((data) => {
        // 从响应体的 code 字段判断状态，而非 HTTP 状态码
        const apiCode = (data && typeof data === 'object' && 'code' in data)
          ? (data as { code: number }).code
          : response.statusCode
        this.logRequest(request, apiCode, Date.now() - startedAt, data)
      }),
      catchError((error) => {
        // 正确识别非 HttpException 的错误状态码，并保留可排查的异常信息
        const statusCode = resolveErrorStatus(error)
        this.logRequest(request, statusCode, Date.now() - startedAt, normalizeErrorPayload(error))
        return throwError(() => error)
      })
    )
  }

  private logRequest(request: Request, statusCode: number, duration: number, responseBody?: unknown) {
    const method = request.method
    const url = request.originalUrl || request.url
    const ip = request.ip || request.socket.remoteAddress || '-'
    const input = this.formatPayload({
      params: request.params,
      query: request.query,
      body: request.body
    })
    const output = this.formatPayload(responseBody)
    const message = `${method} ${url} ${statusCode} ${duration}ms - ${ip} | in=${input} | out=${output}`

    if (statusCode >= 500) {
      this.logger.error(message)
      this.writeAuditLog(request, statusCode, duration, responseBody)
      return
    }

    if (statusCode >= 400) {
      this.logger.warn(message)
      this.writeAuditLog(request, statusCode, duration, responseBody)
      return
    }

    this.logger.log(message)
    this.writeAuditLog(request, statusCode, duration, responseBody)
  }

  private writeAuditLog(
    request: Request,
    statusCode: number,
    duration: number,
    responseBody?: unknown
  ) {
    if (!this.prisma) return

    this.cleanupExpiredAuditLogs()

    const url = request.originalUrl || request.url
    if (SKIP_AUDIT_PATHS.some((path) => url.includes(path))) return

    const user = (request as unknown as { user?: { sub?: number; userName?: string } }).user
    const moduleName = this.resolveModuleName(url)
    const action = request.method
    const requestData = this.maskSensitiveData({
      params: request.params,
      query: request.query,
      body: request.body
    })
    const responseData = this.maskSensitiveData(responseBody)

    void this.prisma.operationLog
      .create({
        data: {
          orgId: undefined,
          userId: user?.sub,
          userName: user?.userName,
          module: moduleName,
          action,
          statusCode: statusCode,
          description: `${request.method} ${url} ${statusCode} ${duration}ms`,
          requestData: requestData as object,
          responseData: this.limitJsonPayload(responseData) as object,
          ip: request.ip || request.socket.remoteAddress,
          userAgent: request.headers['user-agent']
        } as Prisma.OperationLogCreateInput
      })
      .catch((error) => this.logger.warn(`Audit log write failed: ${error?.message || error}`))
  }


  private cleanupExpiredAuditLogs() {
    if (!this.prisma) return

    const now = Date.now()
    if (now - this.lastAuditCleanupAt < AUDIT_LOG_CLEANUP_INTERVAL_MS) return
    this.lastAuditCleanupAt = now

    const cutoff = new Date(now - AUDIT_LOG_RETENTION_MS)
    void this.prisma.operationLog
      .deleteMany({
        where: {
          createdAt: { lt: cutoff }
        }
      })
      .then((result: { count: number }) => {
        if (result.count > 0) {
          this.logger.log(
            `Audit log retention cleaned ${result.count} records older than ${AUDIT_LOG_RETENTION_DAYS} days`
          )
        }
      })
      .catch((error) => this.logger.warn(`Audit log cleanup failed: ${error?.message || error}`))
  }

  private resolveModuleName(url: string) {
    const normalized = url.replace(/^\/+/, '')
    const parts = normalized.split('/').filter(Boolean)
    const apiIndex = parts.findIndex((part) => part === 'api')
    const moduleParts = parts.slice(apiIndex >= 0 ? apiIndex + 1 : 0)
    return moduleParts[0] || 'unknown'
  }

  private limitJsonPayload(value: unknown) {
    if (value === undefined) return undefined
    const text = JSON.stringify(value)
    if (!text || text.length <= MAX_PAYLOAD_LENGTH) return value
    return { truncated: true, preview: text.slice(0, MAX_PAYLOAD_LENGTH) }
  }

  private formatPayload(payload: unknown) {
    if (payload === undefined) return '-'

    const json = JSON.stringify(this.maskSensitiveData(payload))
    if (!json || json.length <= MAX_PAYLOAD_LENGTH) return json || '-'

    return `${json.slice(0, MAX_PAYLOAD_LENGTH)}...<truncated>`
  }

  private maskSensitiveData(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.maskSensitiveData(item))
    }

    if (!value || typeof value !== 'object') {
      return value
    }

    // Convert Prisma Decimal objects to plain numbers
    const valueAsRecord = value as Record<string, unknown>
    if (
      typeof valueAsRecord.toNumber === 'function' &&
      typeof valueAsRecord.toFixed === 'function' &&
      valueAsRecord.s !== undefined
    ) {
      return Number(String(valueAsRecord.toString()))
    }

    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>(
      (masked, [key, fieldValue]) => {
        masked[key] = this.isSensitiveKey(key) ? '***' : this.maskSensitiveData(fieldValue)
        return masked
      },
      {}
    )
  }

  private isSensitiveKey(key: string) {
    const normalizedKey = key.toLowerCase()
    return SENSITIVE_KEYS.some((sensitiveKey) => normalizedKey.includes(sensitiveKey.toLowerCase()))
  }
}

/** 保留异常关键信息，避免日志审计中的 500 响应为空 */
function normalizeErrorPayload(error: unknown) {
  const err = error as {
    name?: string
    message?: string
    stack?: string
    code?: string
    response?: unknown
  }

  if (err?.response) return err.response

  return {
    name: err?.name || 'Error',
    message: err?.message || String(error),
    code: err?.code,
    stack: err?.stack?.split('\n').slice(0, 6).join('\n')
  }
}

/** 解析错误的 HTTP 状态码 */
function resolveErrorStatus(error: unknown): number {
  // API 业务状态码
  if ((error as { response?: { code?: number } })?.response?.code) {
    return (error as { response: { code: number } }).response.code
  }
  // Multer 错误（原生 MulterError 有 code/field 属性）
  const multerErr = error as { code?: string; field?: string }
  if (multerErr?.code && multerErr?.field) {
    return HttpStatus.BAD_REQUEST
  }
  // 验证错误（class-validator）
  if (Array.isArray((error as { response?: { message?: unknown } })?.response?.message)) {
    return HttpStatus.BAD_REQUEST
  }
  // HttpException
  if (error instanceof HttpException) {
    return error.getStatus()
  }
  // 其他未识别错误
  return HttpStatus.INTERNAL_SERVER_ERROR
}
