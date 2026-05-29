import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RepaymentService } from './repayment.service'
import { RepaymentQueryDto, CreateRepaymentDto, UpdateRepaymentDto } from './dto/repayment.dto'

@ApiTags('还款管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repayment')
export class RepaymentController {
  constructor(private readonly service: RepaymentService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: RepaymentQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateRepaymentDto) {
    return this.service.create(dto)
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateRepaymentDto) {
    return this.service.update(Number(id), dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}

