import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { LeadService } from './lead.service'
import { AssignLeadDto, CreateLeadDto, CreateLeadFollowUpDto, LeadQueryDto, UpdateLeadDto } from './dto/lead.dto'

@ApiTags('线索管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lead')
export class LeadController {
  constructor(private readonly service: LeadService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: LeadQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }

  @Post(':id/assign')
  @ApiOperation({ summary: '分配线索' })
  assign(@Param('id') id: string, @Body() dto: AssignLeadDto) {
    return this.service.assign(Number(id), dto)
  }

  @Post(':id/follow-up')
  @ApiOperation({ summary: '记录跟进' })
  addFollowUp(@Param('id') id: string, @Body() dto: CreateLeadFollowUpDto) {
    return this.service.addFollowUp(Number(id), dto)
  }
}
