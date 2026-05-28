import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RequestUser } from '../../common/types/request-user'
import { CreateMenuDto, CreatePermissionDto, UpdateMenuDto, UpdatePermissionDto } from './dto/menu.dto'
import { MenusService } from './menus.service'

@ApiTags('菜单管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v3/system/menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get()
  @ApiOperation({ summary: '获取菜单树', description: '获取当前用户可访问的菜单树' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.menusService.getMenuTree(user.roles.includes('R_SUPER') ? undefined : user.roles)
  }

  @Post()
  @ApiOperation({ summary: '新增菜单', description: '创建目录、菜单或按钮权限' })
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.createMenu(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑菜单', description: '根据菜单 ID 更新菜单信息' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return this.menusService.updateMenu(id, dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除菜单', description: '根据菜单 ID 删除菜单' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.deleteMenu(id)
  }

  @Post(':menuId/permissions')
  @ApiOperation({ summary: '新增菜单权限', description: '为指定菜单新增按钮权限标识' })
  createPermission(@Param('menuId', ParseIntPipe) menuId: number, @Body() dto: CreatePermissionDto) {
    return this.menusService.createPermission(menuId, dto)
  }

  @Post('permissions/:id')
  @ApiOperation({ summary: '编辑菜单权限', description: '根据权限 ID 更新按钮权限信息' })
  updatePermission(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePermissionDto) {
    return this.menusService.updatePermission(id, dto)
  }

  @Post('permissions/:id/delete')
  @ApiOperation({ summary: '删除菜单权限', description: '根据权限 ID 删除按钮权限' })
  deletePermission(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.deletePermission(id)
  }
}
