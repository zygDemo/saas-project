
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { DeptService } from './dept.service'
import { DeptQueryDto, CreateDeptDto, UpdateDeptDto } from './dto/dept.dto'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('部门管理')
@Controller('dept')
export class DeptController {
  constructor(private readonly service: DeptService) {}

  @Get('list')
  @Public()
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: DeptQueryDto) {
    return this.service.getList(query)
  }

  @Get('tree')
  @Public()
  @ApiOperation({ summary: '部门树', description: '获取部门树形结构，用于数据权限配置选择部门' })
  tree() {
    return this.service.getTree()
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateDeptDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateDeptDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
