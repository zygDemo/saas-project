import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { DisbursementService } from './disbursement.service'
import {
  DisbursementQueryDto, CreateDisbursementDto, UpdateDisbursementDto,
  GpsInstallDto, MortgageDto, RequestDisbursementDto, ConfirmDisbursementDto
} from './dto/disbursement.dto'

@ApiTags('放款管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('disbursement')
export class DisbursementController {
  constructor(private readonly service: DisbursementService) {}

  // ==================== 基础 CRUD ====================

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

  // ==================== GPS安装 ====================

  @Post(':applicationId/gps-install')
  @ApiOperation({ summary: '登记GPS安装完成' })
  completeGpsInstall(
    @Param('applicationId') applicationId: string,
    @Body() dto: GpsInstallDto
  ) {
    return this.service.completeGpsInstall(Number(applicationId), dto)
  }

  // ==================== 抵押登记 ====================

  @Post(':applicationId/mortgage')
  @ApiOperation({ summary: '登记抵押完成' })
  completeMortgage(
    @Param('applicationId') applicationId: string,
    @Body() dto: MortgageDto
  ) {
    return this.service.completeMortgage(Number(applicationId), dto)
  }

  // ==================== 出账申请 ====================

  @Post(':applicationId/request')
  @ApiOperation({ summary: '提交出账申请' })
  requestDisbursement(
    @Param('applicationId') applicationId: string,
    @Body() dto: RequestDisbursementDto
  ) {
    return this.service.requestDisbursement(Number(applicationId), dto)
  }

  // ==================== 放款确认 ====================

  @Post(':applicationId/confirm')
  @ApiOperation({ summary: '放款确认（含GPS+抵押强校验）' })
  confirmDisbursement(
    @Param('applicationId') applicationId: string,
    @Body() dto: ConfirmDisbursementDto
  ) {
    return this.service.confirmDisbursement(Number(applicationId), dto)
  }
}
