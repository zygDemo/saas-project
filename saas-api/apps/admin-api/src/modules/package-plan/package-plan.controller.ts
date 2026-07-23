
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { PackagePlanService } from './package-plan.service'
import { PackagePlanQueryDto, CreatePackagePlanDto, UpdatePackagePlanDto } from './dto/package-plan.dto'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('套餐管理')
@Controller('package-plan')
export class PackagePlanController {
  constructor(private readonly service: PackagePlanService) {}

  @Get('list')
  @Public()
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: PackagePlanQueryDto) {
    return this.service.getList(query)
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
  create(@Body() dto: CreatePackagePlanDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdatePackagePlanDto) {
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
