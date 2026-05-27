import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common'
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
  @ApiOperation({ summary: '获取菜单树', description: '根据当前用户角色获取菜单树结构，用于前端动态路由和菜单展示' })
  findAll(@CurrentUser() user: RequestUser) {
    return this.menusService.getMenuTree(user.roles)
  }

  @Post()
  @ApiOperation({ summary: 'Create menu' })
  create(@Body() dto: CreateMenuDto) {
    return this.menusService.createMenu(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update menu' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMenuDto) {
    return this.menusService.updateMenu(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete menu' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.deleteMenu(id)
  }

  @Post(':menuId/permissions')
  @ApiOperation({ summary: 'Create menu permission' })
  createPermission(
    @Param('menuId', ParseIntPipe) menuId: number,
    @Body() dto: CreatePermissionDto
  ) {
    return this.menusService.createPermission(menuId, dto)
  }

  @Put('permissions/:id')
  @ApiOperation({ summary: 'Update menu permission' })
  updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto
  ) {
    return this.menusService.updatePermission(id, dto)
  }

  @Delete('permissions/:id')
  @ApiOperation({ summary: 'Delete menu permission' })
  deletePermission(@Param('id', ParseIntPipe) id: number) {
    return this.menusService.deletePermission(id)
  }
}
