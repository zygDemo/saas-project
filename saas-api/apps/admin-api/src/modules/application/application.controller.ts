import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ApplicationService } from './application.service'
import { ApplicationQueryDto, CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto'
import {
  ApprovalActionDto,
  CompleteSigningDto,
  ConfirmDisbursementDto,
  GpsInstalledDto,
  MortgageDoneDto,
  RegisterRepaymentDto,
  StartSigningDto,
  SupplementActionDto
} from './dto/business-action.dto'

@ApiTags('进件管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('application')
export class ApplicationController {
  constructor(private readonly service: ApplicationService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: ApplicationQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateApplicationDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交进件' })
  submit(@Param('id') id: string) {
    return this.service.submit(Number(id))
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审批通过' })
  approve(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.service.approve(Number(id), dto)
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '审批驳回' })
  reject(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.service.reject(Number(id), dto)
  }

  @Post(':id/supplement')
  @ApiOperation({ summary: '要求补件' })
  requestSupplement(@Param('id') id: string, @Body() dto: SupplementActionDto) {
    return this.service.requestSupplement(Number(id), dto)
  }

  @Post(':id/start-signing')
  @ApiOperation({ summary: '发起签约' })
  startSigning(@Param('id') id: string, @Body() dto: StartSigningDto) {
    return this.service.startSigning(Number(id), dto)
  }

  @Post(':id/complete-signing')
  @ApiOperation({ summary: '签约完成' })
  completeSigning(@Param('id') id: string, @Body() dto: CompleteSigningDto) {
    return this.service.completeSigning(Number(id), dto)
  }

  @Post(':id/gps-installed')
  @ApiOperation({ summary: 'GPS安装完成' })
  completeGpsInstall(@Param('id') id: string, @Body() dto: GpsInstalledDto) {
    return this.service.completeGpsInstall(Number(id), dto)
  }

  @Post(':id/mortgage-done')
  @ApiOperation({ summary: '抵押完成' })
  completeMortgage(@Param('id') id: string, @Body() dto: MortgageDoneDto) {
    return this.service.completeMortgage(Number(id), dto)
  }

  @Post(':id/confirm-disbursement')
  @ApiOperation({ summary: '放款确认' })
  confirmDisbursement(@Param('id') id: string, @Body() dto: ConfirmDisbursementDto) {
    return this.service.confirmDisbursement(Number(id), dto)
  }

  @Post('repayment-plan/:planId/register')
  @ApiOperation({ summary: '登记还款' })
  registerRepayment(@Param('planId') planId: string, @Body() dto: RegisterRepaymentDto) {
    return this.service.registerRepayment(Number(planId), dto)
  }
}
