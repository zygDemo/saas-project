import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const GetCurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest<{ user: { userId: number } }>()
    return Number(request.user.userId)
  }
)
