import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { NotificationService } from '../notification/notification.service'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
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
@ApiResponse({ status: 401, description: '未授权' })
@UseGuards(JwtAuthGuard)
@Controller('application')
export class ApplicationController {
  constructor(private readonly service: ApplicationService,
    private readonly notificationService: NotificationService) {}

  @ApiResponse({ status: 200, description: '成功' })
  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: ApplicationQueryDto) {
    return this.service.getList(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('flow-list')
  @ApiOperation({ summary: '按流程节点状态查询订单' })
  flowList(@Query() query: ApplicationQueryDto) {
    return this.service.getFlowList(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('order-list')
  @ApiOperation({ summary: '订单列表查询：支持节点、状态、姓名、车牌号、手机号、订单号筛选' })
  orderList(@Query() query: OrderListQueryDto) {
    return this.service.getOrderList(query)
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
  create(@Body() dto: CreateApplicationDto) {
    return this.service.create(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto) {
    return this.service.update(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/submit')
  @ApiOperation({ summary: '提交进件' })
  submit(@Param('id') id: string) {
    return this.service.submit(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/precheck-pass')
  @ApiOperation({ summary: '资料校验/预审通过' })
  precheckPass(@Param('id') id: string, @Body() dto: PrecheckActionDto) {
    return this.service.precheckPass(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/risk-pre-pass')
  @ApiOperation({ summary: '风控预审通过' })
  riskPrePass(@Param('id') id: string, @Body() dto: PrecheckActionDto) {
    return this.service.riskPrePass(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/risk-pre-reject')
  @ApiOperation({ summary: '风控预审拒绝' })
  riskPreReject(@Param('id') id: string, @Body() dto: PrecheckActionDto) {
    return this.service.riskPreReject(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/risk-pre-return')
  @ApiOperation({ summary: '风控预审驳回上一节点' })
  riskPreReturn(@Param('id') id: string, @Body() dto: PrecheckActionDto) {
    return this.service.riskPreReturn(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/funder-pre-pass')
  @ApiOperation({ summary: '资方预审通过' })
  funderPrePass(@Param('id') id: string, @Body() dto: FunderReviewDto) {
    return this.service.funderPrePass(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/funder-pre-reject')
  @ApiOperation({ summary: '资方预审拒绝' })
  funderPreReject(@Param('id') id: string, @Body() dto: FunderReviewDto) {
    return this.service.funderPreReject(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/complete-supplement')
  @ApiOperation({ summary: '资料补充完成，进入风控初审' })
  completeSupplement(@Param('id') id: string, @Body() dto: CompleteSupplementDto) {
    return this.service.completeSupplement(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/approve')
  @ApiOperation({ summary: '审批通过' })
  async approve(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    const result = await this.service.approve(Number(id), dto)
    this.notificationService.pushApprovalStatus(0, {
      applicationId: Number(id), status: '审批通过', title: '审批结果通知'
    }).catch(() => {})
    return result
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/reject')
  @ApiOperation({ summary: '审批驳回' })
  async reject(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    const result = await this.service.reject(Number(id), dto)
    this.notificationService.pushApprovalStatus(0, {
      applicationId: Number(id), status: '审批拒绝', title: '审批结果通知'
    }).catch(() => {})
    return result
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/supplement')
  @ApiOperation({ summary: '要求补件' })
  async requestSupplement(@Param('id') id: string, @Body() dto: SupplementActionDto) {
    const result = await this.service.requestSupplement(Number(id), dto)
    this.notificationService.pushSupplement(0, {
      applicationId: Number(id), title: '补件通知'
    }).catch(() => {})
    return result
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/submit-funder-review')
  @ApiOperation({ summary: '提交资方审批' })
  submitFunderReview(@Param('id') id: string) {
    return this.service.submitFunderReview(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/funder-pass')
  @ApiOperation({ summary: '资方审批通过' })
  funderPass(@Param('id') id: string, @Body() dto: FunderReviewDto) {
    return this.service.funderPass(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/funder-reject')
  @ApiOperation({ summary: '资方审批拒绝' })
  funderReject(@Param('id') id: string, @Body() dto: FunderReviewDto) {
    return this.service.funderReject(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/start-signing')
  @ApiOperation({ summary: '发起签约' })
  startSigning(@Param('id') id: string, @Body() dto: StartSigningDto) {
    return this.service.startSigning(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/complete-signing')
  @ApiOperation({ summary: '签约完成' })
  async completeSigning(@Param('id') id: string, @Body() dto: CompleteSigningDto) {
    const result = await this.service.completeSigning(Number(id), dto)
    this.notificationService.pushSigning(0, {
      applicationId: Number(id), title: '签约完成通知'
    }).catch(() => {})
    return result
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/gps-installed')
  @ApiOperation({ summary: 'GPS安装完成' })
  completeGpsInstall(@Param('id') id: string, @Body() dto: GpsInstalledDto) {
    return this.service.completeGpsInstall(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/mortgage-done')
  @ApiOperation({ summary: '抵押完成' })
  completeMortgage(@Param('id') id: string, @Body() dto: MortgageDoneDto) {
    return this.service.completeMortgage(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/request-disbursement')
  @ApiOperation({ summary: '出账申请' })
  requestDisbursement(@Param('id') id: string, @Body() dto: RequestDisbursementDto) {
    return this.service.requestDisbursement(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/submit-loan-request')
  @ApiOperation({ summary: '提交请款资料' })
  submitLoanRequest(@Param('id') id: string, @Body() dto: RequestDisbursementDto) {
    return this.service.submitLoanRequest(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/approve-loan-request')
  @ApiOperation({ summary: '请款审核通过' })
  approveLoanRequest(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.service.approveLoanRequest(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/reject-loan-request')
  @ApiOperation({ summary: '请款审核拒绝' })
  rejectLoanRequest(@Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.service.rejectLoanRequest(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/confirm-disbursement')
  @ApiOperation({ summary: '放款确认' })
  async confirmDisbursement(@Param('id') id: string, @Body() dto: ConfirmDisbursementDto) {
    const result = await this.service.confirmDisbursement(Number(id), dto)
    this.notificationService.pushLoan(0, {
      applicationId: Number(id), amount: dto.disburseAmount || 0
    }).catch(() => {})
    return result
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('repayment-plan/:planId/register')
  @ApiOperation({ summary: '登记还款' })
  registerRepayment(@Param('planId') planId: string, @Body() dto: RegisterRepaymentDto) {
    return this.service.registerRepayment(Number(planId), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/register-repayment')
  @ApiOperation({ summary: '按订单登记还款（自动选择第一个未还清计划）' })
  registerRepaymentByApplication(@Param('id') id: string, @Body() dto: RegisterRepaymentDto) {
    return this.service.registerRepaymentByApplication(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/settle')
  @ApiOperation({ summary: '结清/归档' })
  settle(@Param('id') id: string, @Body() dto: SettleApplicationDto) {
    return this.service.settle(Number(id), dto)
  }

  // ==================== 还款计划 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Get('repayment-plans/:id')
  @ApiOperation({ summary: '获取还款计划列表' })
  getRepaymentPlans(@Param('id') id: string) {
    return this.service.getRepaymentPlans(Number(id))
  }

  // ==================== 逾期催收 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Get('overdue-list')
  @ApiOperation({ summary: '获取逾期订单列表' })
  getOverdueList(@Query() query: { page?: number; pageSize?: number }) {
    return this.service.getOverduePlans(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/collection-record')
  @ApiOperation({ summary: '添加催收记录' })
  addCollectionRecord(@Param('id') id: string, @Body() dto: { collectorId?: number; collectType?: string; content: string; result?: string; nextAction?: string; nextDate?: string }) {
    return this.service.addCollectionRecord(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get(':id/collection-records')
  @ApiOperation({ summary: '获取催收记录列表' })
  getCollectionRecords(@Param('id') id: string) {
    return this.service.getCollectionRecords(Number(id))
  }

  // ==================== 提前还款 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/early-repayment')
  @ApiOperation({ summary: '提前还款申请' })
  applyEarlyRepayment(@Param('id') id: string, @Body() dto: { repayType?: string; amount: number; principal: number; interest: number; penalty?: number; reason?: string }) {
    return this.service.applyEarlyRepayment(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('early-repayment/:id/approve')
  @ApiOperation({ summary: '审批提前还款' })
  approveEarlyRepayment(@Param('id') id: string, @Body() dto: { approvedBy: number; remark?: string }) {
    return this.service.approveEarlyRepayment(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('early-repayment/:id/complete')
  @ApiOperation({ summary: '完成提前还款' })
  completeEarlyRepayment(@Param('id') id: string) {
    return this.service.completeEarlyRepayment(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get(':id/early-repayments')
  @ApiOperation({ summary: '获取提前还款列表' })
  getEarlyRepayments(@Param('id') id: string) {
    return this.service.getEarlyRepayments(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('lifecycle/:id')
  @ApiOperation({ summary: '获取订单生命周期节点列表，用于时间轴展示' })
  getLifecycle(@Param('id') id: string) {
    return this.service.getLifecycle(Number(id))
  }
}
