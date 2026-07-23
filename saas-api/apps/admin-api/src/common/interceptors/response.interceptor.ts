import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, map } from 'rxjs'
import { ApiStatus } from '../constants/api-status'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { code: number; data: T; msg: string }> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<{ code: number; data: T; msg: string }> {
    const response = context.switchToHttp().getResponse()

    return next.handle().pipe(
      map((value) => {
        if (response?.statusCode !== 200) {
          response.status(200)
        }

        // 如果服务层已经包装过响应，统一字段顺序后返回
        if (value && typeof value === 'object' && 'code' in value && 'data' in value) {
          const { code, data, msg = 'success' } = value as Record<string, unknown>
          return { code, data, msg } as { code: number; data: T; msg: string }
        }

        return {
          code: ApiStatus.SUCCESS,
          data: value as T,
          msg: 'success'
        }
      })
    )
  }
}
