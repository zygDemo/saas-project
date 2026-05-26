import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Observable, catchError, tap, throwError } from 'rxjs'

const MAX_PAYLOAD_LENGTH = 2000
const SENSITIVE_KEYS = ['authorization', 'password', 'token', 'refreshtoken', 'accessToken']

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp()
    const request = http.getRequest<Request>()
    const response = http.getResponse<Response>()
    const startedAt = Date.now()

    return next.handle().pipe(
      tap((data) => {
        this.logRequest(request, response.statusCode, Date.now() - startedAt, data)
      }),
      catchError((error) => {
        const statusCode = error?.status ?? error?.response?.statusCode ?? response.statusCode
        this.logRequest(request, statusCode, Date.now() - startedAt, error?.response)
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
      return
    }

    if (statusCode >= 400) {
      this.logger.warn(message)
      return
    }

    this.logger.log(message)
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
