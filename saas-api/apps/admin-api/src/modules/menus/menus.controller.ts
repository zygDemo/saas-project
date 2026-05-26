import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RequestUser } from '../../common/types/request-user'
import { MenusService } from './menus.service'

@ApiTags('菜单管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v3/system/menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get()
  @ApiOperation({ summary: '获取菜单树', description: '根据当前用户角色获取菜单树结构，用于前端动态路由和菜单展示' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.menusService.getMenuTree(user.roles)
  }
}
