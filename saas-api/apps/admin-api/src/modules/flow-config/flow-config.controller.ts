import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CreateFlowConfigDto, FlowConfigQueryDto, UpdateFlowConfigDto } from './dto/flow-config.dto'
import { FlowConfigService } from './flow-config.service'

@ApiTags('流程与规则')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('flow-config')
export class FlowConfigController {
  constructor(private readonly service: FlowConfigService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: FlowConfigQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateFlowConfigDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateFlowConfigDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
