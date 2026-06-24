import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { RequestUser } from '../types/request-user'

/**
 * 角色守卫 - 检查当前用户是否拥有所需角色
 * 配合 @Roles('admin') 装饰器使用
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    // 没有设置角色要求则放行
    if (!requiredRoles || requiredRoles.length === 0) return true

    const request = context.switchToHttp().getRequest()
    const user = request.user as RequestUser

    if (!user || !user.roles) {
      throw new ForbiddenException('无法获取用户角色信息')
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role))
    if (!hasRole) {
      throw new ForbiddenException(`需要 [${requiredRoles.join(', ')}] 角色权限`)
    }

    return true
  }
}
