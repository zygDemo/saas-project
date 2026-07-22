import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { LeadService } from './lead.service'
import { AssignLeadDto, CreateLeadDto, CreateLeadFollowUpDto, LeadQueryDto, UpdateLeadDto } from './dto/lead.dto'

@ApiTags('线索管理')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: '未授权' })
@UseGuards(JwtAuthGuard)
@Controller('lead')
export class LeadController {
  constructor(private readonly service: LeadService) {}

  @ApiResponse({ status: 200, description: '成功' })
  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: LeadQueryDto) {
    return this.service.getList(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.service.update(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/assign')
  @ApiOperation({ summary: '分配线索' })
  assign(@Param('id') id: string, @Body() dto: AssignLeadDto) {
    return this.service.assign(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/follow-up')
  @ApiOperation({ summary: '记录跟进' })
  addFollowUp(@Param('id') id: string, @Body() dto: CreateLeadFollowUpDto) {
    return this.service.addFollowUp(Number(id), dto)
  }
}
