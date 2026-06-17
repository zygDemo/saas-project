import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, map } from 'rxjs'
import { ApiStatus } from '../constants/api-status'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { code: number; msg: string; data: T }> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<{ code: number; msg: string; data: T }> {
    const response = context.switchToHttp().getResponse()

    return next.handle().pipe(
      map((value) => {
        if (response?.statusCode === 201) {
          response.status(200)
        }

        if (value && typeof value === 'object' && 'code' in value && 'data' in value) {
          return value as { code: number; msg: string; data: T }
        }

        return {
          code: ApiStatus.success,
          msg: 'success',
          data: value as T
        }
      })
    )
  }
}
