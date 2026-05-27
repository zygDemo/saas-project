import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CreateRoleDto, SaveRolePermissionDto, UpdateRoleDto } from './dto/role.dto'
import { RolesService } from './roles.service'

@ApiTags('角色管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('role')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('list')
  @ApiOperation({ summary: '获取角色列表', description: '分页查询角色列表，支持关键字搜索' })
  @ApiQuery({ name: 'page', description: '页码', required: false, example: '1' })
  @ApiQuery({ name: 'pageSize', description: '每页条数', required: false, example: '10' })
  @ApiQuery({ name: 'keyword', description: '搜索关键字（角色名称）', required: false })
  list(@Query() query: Record<string, string | undefined>) {
    return this.rolesService.getRoleList(query)
  }

  @Post('create')
  @ApiOperation({ summary: 'Create role' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update role' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete role' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.deleteRole(id)
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get role permissions' })
  getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.getRolePermission(id)
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Save role permissions' })
  savePermissions(@Param('id', ParseIntPipe) id: number, @Body() dto: SaveRolePermissionDto) {
    return this.rolesService.saveRolePermission(id, dto)
  }
}
