import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ApprovalService } from './approval.service'
import { ApprovalQueryDto, CreateApprovalDto, UpdateApprovalDto } from './dto/approval.dto'

@ApiTags('审批管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('approval')
export class ApprovalController {
  constructor(private readonly service: ApprovalService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: ApprovalQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateApprovalDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateApprovalDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
