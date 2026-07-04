import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { WorkOrderService } from './work-order.service'
import { WorkOrderQueryDto, CreateWorkOrderDto, UpdateWorkOrderDto } from './dto/work-order.dto'

@ApiTags('运营工单')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-order')
export class WorkOrderController {
  constructor(private readonly service: WorkOrderService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: WorkOrderQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateWorkOrderDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
