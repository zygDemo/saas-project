import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const GetCurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest<{ user: { sub: number } }>()
    return request.user.sub
  }
)
