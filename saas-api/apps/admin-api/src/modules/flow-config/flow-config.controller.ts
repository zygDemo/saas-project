
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import {
  CreateFlowConfigDto,
  FlowConfigQueryDto,
  InitDefaultFlowConfigDto,
  UpdateFlowConfigDto
} from './dto/flow-config.dto'
import { FlowConfigService } from './flow-config.service'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('流程与规则')
@Controller('flow-config')
export class FlowConfigController {
  constructor(private readonly service: FlowConfigService) {}

  @Get('list')
  @Public()
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: FlowConfigQueryDto) {
    return this.service.getList(query)
  }

  @Get('meta')
  @Public()
  @ApiOperation({ summary: '流程节点元数据' })
  meta() {
    return this.service.getMeta()
  }

  @Post('init-default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '初始化默认流程' })
  initDefault(@Body() dto: InitDefaultFlowConfigDto) {
    return this.service.initDefault(dto)
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
  create(@Body() dto: CreateFlowConfigDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateFlowConfigDto) {
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
