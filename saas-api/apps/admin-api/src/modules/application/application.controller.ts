import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ApplicationService } from './application.service'
import {
  ApplicationQueryDto,
  CreateApplicationDto,
  OrderListQueryDto,
  UpdateApplicationDto
} from './dto/application.dto'
import {
  ApprovalActionDto,
  CompleteSigningDto,
  CompleteSupplementDto,
  ConfirmDisbursementDto,
  FunderReviewDto,
  GpsInstalledDto,
  MortgageDoneDto,
  PrecheckActionDto,
  RegisterRepaymentDto,
  RequestDisbursementDto,
  SettleApplicationDto,
  StartSigningDto,
  SupplementActionDto
} from './dto/business-action.dto'

@ApiTags('订单管理')
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

  @Get('flow-list')
  @ApiOperation({ summary: '按流程节点状态查询订单' })
  flowList(@Query() query: ApplicationQueryDto) {
    return this.service.getFlowList(query)
  }

  @Get('order-list')
  @ApiOperation({ summary: '订单列表查询：支持节点、状态、姓名、车牌号、手机号、订单号筛选' })
  orderList(@Query() query: OrderListQueryDto) {
    return this.service.getOrderList(query)
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

  @Post(':id/precheck-pass')
  @ApiOperation({ summary: '资料校验/预审通过' })
  precheckPass(@Param('id') id: string, @Body() dto: PrecheckActionDto) {
    return this.service.precheckPass(Number(id), dto)
  }

  @Post(':id/risk-pre-pass')
  @ApiOperation({ summary: '风控预审通过' })
  riskPrePass(@Param('id') id: string, @Body() dto: PrecheckActionDto) {
    return this.service.riskPrePass(Number(id), dto)
  }

  @Post(':id/risk-pre-reject')
  @ApiOperation({ summary: '风控预审拒绝' })
  riskPreReject(@Param('id') id: string, @Body() dto: PrecheckActionDto) {
    return this.service.riskPreReject(Number(id), dto)
  }

  @Post(':id/funder-pre-pass')
  @ApiOperation({ summary: '资方预审通过' })
  funderPrePass(@Param('id') id: string, @Body() dto: FunderReviewDto) {
    return this.service.funderPrePass(Number(id), dto)
  }

  @Post(':id/funder-pre-reject')
  @ApiOperation({ summary: '资方预审拒绝' })
  funderPreReject(@Param('id') id: string, @Body() dto: FunderReviewDto) {
    return this.service.funderPreReject(Number(id), dto)
  }

  @Post(':id/complete-supplement')
  @ApiOperation({ summary: '资料补充完成，进入风控初审' })
  completeSupplement(@Param('id') id: string, @Body() dto: CompleteSupplementDto) {
    return this.service.completeSupplement(Number(id), dto)
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

  @Post(':id/submit-funder-review')
  @ApiOperation({ summary: '提交资方审批' })
  submitFunderReview(@Param('id') id: string) {
    return this.service.submitFunderReview(Number(id))
  }

  @Post(':id/funder-pass')
  @ApiOperation({ summary: '资方审批通过' })
  funderPass(@Param('id') id: string, @Body() dto: FunderReviewDto) {
    return this.service.funderPass(Number(id), dto)
  }

  @Post(':id/funder-reject')
  @ApiOperation({ summary: '资方审批拒绝' })
  funderReject(@Param('id') id: string, @Body() dto: FunderReviewDto) {
    return this.service.funderReject(Number(id), dto)
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

  @Post(':id/request-disbursement')
  @ApiOperation({ summary: '出账申请' })
  requestDisbursement(@Param('id') id: string, @Body() dto: RequestDisbursementDto) {
    return this.service.requestDisbursement(Number(id), dto)
  }

  @Post(':id/submit-loan-request')
  @ApiOperation({ summary: '提交请款资料' })
  submitLoanRequest(@Param('id') id: string, @Body() dto: RequestDisbursementDto) {
    return this.service.submitLoanRequest(Number(id), dto)
  }

  @Post(':id/approve-loan-request')
  @ApiOperation({ summary: '请款审核通过' })
  approveLoanRequest(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.service.approveLoanRequest(Number(id), dto)
  }

  @Post(':id/reject-loan-request')
  @ApiOperation({ summary: '请款审核拒绝' })
  rejectLoanRequest(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.service.rejectLoanRequest(Number(id), dto)
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

  @Post(':id/settle')
  @ApiOperation({ summary: '结清/归档' })
  settle(@Param('id') id: string, @Body() dto: SettleApplicationDto) {
    return this.service.settle(Number(id), dto)
  }
}
