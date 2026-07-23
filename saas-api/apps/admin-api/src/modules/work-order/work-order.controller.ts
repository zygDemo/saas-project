
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { WorkOrderService } from './work-order.service'
import { WorkOrderQueryDto, CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('运营工单')
@Controller('work-order')
export class WorkOrderController {
  constructor(private readonly service: WorkOrderService) {}

  @ApiResponse({ status: 200, description: '成功' })
  @Get('list')
  @Public()
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: WorkOrderQueryDto) {
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
  create(@Body() dto: CreateWorkOrderDto) {
    return this.service.create(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
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
}
