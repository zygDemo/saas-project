
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { OrganizationService } from './org.service'
import { OrganizationQueryDto, CreateOrganizationDto, UpdateOrganizationDto } from './dto/org.dto'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('机构管理')
@Controller('org')
export class OrganizationController {
  constructor(private readonly service: OrganizationService) {}

  @ApiResponse({ status: 200, description: '成功' })
  @Get('list')
  @Public()
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: OrganizationQueryDto) {
    return this.service.getList(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get(':id')
  @Public()
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.service.create(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.service.update(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '启用机构' })
  enable(@Param('id') id: string) {
    return this.service.enable(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '停用机构' })
  disable(@Param('id') id: string) {
    return this.service.disable(Number(id))
  }
}
