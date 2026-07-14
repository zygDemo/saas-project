import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CreateRoleDto, SaveRolePermissionDto, UpdateRoleDto, RoleQueryDto } from './dto/role.dto'
import { RolesService } from './roles.service'

@ApiTags('角色管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('role')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('list')
  @ApiOperation({ summary: '获取角色列表', description: '分页查询角色列表，支持关键字搜索' })
  list(@Query() query: RoleQueryDto) {
    return this.rolesService.getRoleList(query)
  }

  @Post('create')
  @ApiOperation({ summary: '新增角色', description: '创建角色基础信息' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑角色', description: '根据角色 ID 更新角色信息' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除角色', description: '根据角色 ID 删除角色' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id)
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: '获取角色权限', description: '获取角色已绑定的菜单和权限标识' })
  getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRolePermission(id)
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: '保存角色权限', description: '保存角色菜单和按钮权限配置' })
  savePermissions(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveRolePermissionDto) {
    return this.rolesService.saveRolePermission(id, dto)
  }

  @Get(':id/data-scope')
  @ApiOperation({ summary: '获取角色数据权限', description: '获取角色的数据范围配置和自定义部门列表' })
  getDataScope(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRoleDataScope(id)
  }

  @Post(':id/data-scope')
  @ApiOperation({ summary: '保存角色数据权限', description: '保存角色数据范围配置（ALL/DEPT/SELF/CUSTOM）和自定义部门列表' })
  saveDataScope(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { dataScope: string; departmentIds?: number[] }
  ) {
    return this.rolesService.saveRoleDataScope(id, dto)
  }
}