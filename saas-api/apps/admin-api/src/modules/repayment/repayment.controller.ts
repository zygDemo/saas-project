import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RepaymentService } from './repayment.service'
import {
  RepaymentQueryDto, CreateRepaymentDto, UpdateRepaymentDto,
  RegisterRepaymentDto, OverdueQueryDto, AddCollectionRecordDto,
  ApplyEarlyRepaymentDto, ApproveEarlyRepaymentDto
} from './dto/repayment.dto'

@ApiTags('还款管理')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: '未授权' })
@UseGuards(JwtAuthGuard)
@Controller('repayment')
export class RepaymentController {
  constructor(private readonly service: RepaymentService) {}

  // ==================== 基础 CRUD ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: RepaymentQueryDto) {
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
  create(@Body() dto: CreateRepaymentDto) {
    return this.service.create(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateRepaymentDto) {
    return this.service.update(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }

  // ==================== 还款计划查询 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Get('plans/:applicationId')
  @ApiOperation({ summary: '获取进件还款计划列表' })
  getRepaymentPlans(@Param('applicationId') applicationId: string) {
    return this.service.getRepaymentPlans(Number(applicationId))
  }

  // ==================== 还款登记 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Post('register/:applicationId')
  @ApiOperation({ summary: '按进件还款登记（自动选择第一个未还清计划）' })
  registerRepaymentByApplication(
    @Param('applicationId') applicationId: string,
    @Body() dto: RegisterRepaymentDto
  ) {
    return this.service.registerRepaymentByApplication(Number(applicationId), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('register-plan/:planId')
  @ApiOperation({ summary: '按计划ID还款登记' })
  registerRepayment(
    @Param('planId') planId: string,
    @Body() dto: RegisterRepaymentDto
  ) {
    return this.service.registerRepayment(Number(planId), dto)
  }

  // ==================== 逾期催收 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Get('overdue/list')
  @ApiOperation({ summary: '逾期还款计划列表' })
  getOverduePlans(@Query() query: OverdueQueryDto) {
    return this.service.getOverduePlans(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('collection/:applicationId')
  @ApiOperation({ summary: '添加催收记录' })
  addCollectionRecord(
    @Param('applicationId') applicationId: string,
    @Body() dto: AddCollectionRecordDto
  ) {
    return this.service.addCollectionRecord(Number(applicationId), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('collection/:applicationId')
  @ApiOperation({ summary: '获取催收记录列表' })
  getCollectionRecords(@Param('applicationId') applicationId: string) {
    return this.service.getCollectionRecords(Number(applicationId))
  }

  // ==================== 提前还款 ====================

  @ApiResponse({ status: 200, description: '成功' })
  @Post('early-repayment/apply/:applicationId')
  @ApiOperation({ summary: '申请提前还款' })
  applyEarlyRepayment(
    @Param('applicationId') applicationId: string,
    @Body() dto: ApplyEarlyRepaymentDto
  ) {
    return this.service.applyEarlyRepayment(Number(applicationId), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('early-repayment/:id/approve')
  @ApiOperation({ summary: '审批提前还款' })
  approveEarlyRepayment(
    @Param('id') id: string,
    @Body() dto: ApproveEarlyRepaymentDto
  ) {
    return this.service.approveEarlyRepayment(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('early-repayment/:id/complete')
  @ApiOperation({ summary: '完成提前还款' })
  completeEarlyRepayment(@Param('id') id: string) {
    return this.service.completeEarlyRepayment(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('early-repayment/list/:applicationId')
  @ApiOperation({ summary: '获取提前还款记录列表' })
  getEarlyRepayments(@Param('applicationId') applicationId: string) {
    return this.service.getEarlyRepayments(Number(applicationId))
  }
}
