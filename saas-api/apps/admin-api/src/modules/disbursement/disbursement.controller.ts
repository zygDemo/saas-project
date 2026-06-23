import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { DisbursementService } from './disbursement.service'
import { DisbursementQueryDto, CreateDisbursementDto, UpdateDisbursementDto } from './dto/disbursement.dto'

@ApiTags('放款管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disbursement')
export class DisbursementController {
  constructor(private readonly service: DisbursementService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: DisbursementQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateDisbursementDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateDisbursementDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
