import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
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
}
