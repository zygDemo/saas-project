import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { ApiStatus } from '../constants/api-status'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const body = exception instanceof HttpException ? exception.getResponse() : null

    response.status(status).json({
      code: statusToApiCode(status),
      msg: extractMessage(body) ?? 'Internal server error',
      data: null
    })
  }
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
