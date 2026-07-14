import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RepaymentService } from './repayment.service'
import {
  RepaymentQueryDto, CreateRepaymentDto, UpdateRepaymentDto,
  RegisterRepaymentDto, OverdueQueryDto, AddCollectionRecordDto,
  ApplyEarlyRepaymentDto, ApproveEarlyRepaymentDto
} from './dto/repayment.dto'

@ApiTags('还款管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('repayment')
export class RepaymentController {
  constructor(private readonly service: RepaymentService) {}

  // ==================== 基础 CRUD ====================

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

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateRepaymentDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }

  // ==================== 还款计划查询 ====================

  @Get('plans/:applicationId')
  @ApiOperation({ summary: '获取进件还款计划列表' })
  getRepaymentPlans(@Param('applicationId') applicationId: string) {
    return this.service.getRepaymentPlans(Number(applicationId))
  }

  // ==================== 还款登记 ====================

  @Post('register/:applicationId')
  @ApiOperation({ summary: '按进件还款登记（自动选择第一个未还清计划）' })
  registerRepaymentByApplication(
    @Param('applicationId') applicationId: string,
    @Body() dto: RegisterRepaymentDto
  ) {
    return this.service.registerRepaymentByApplication(Number(applicationId), dto)
  }

  @Post('register-plan/:planId')
  @ApiOperation({ summary: '按计划ID还款登记' })
  registerRepayment(
    @Param('planId') planId: string,
    @Body() dto: RegisterRepaymentDto
  ) {
    return this.service.registerRepayment(Number(planId), dto)
  }

  // ==================== 逾期催收 ====================

  @Get('overdue/list')
  @ApiOperation({ summary: '逾期还款计划列表' })
  getOverduePlans(@Query() query: OverdueQueryDto) {
    return this.service.getOverduePlans(query)
  }

  @Post('collection/:applicationId')
  @ApiOperation({ summary: '添加催收记录' })
  addCollectionRecord(
    @Param('applicationId') applicationId: string,
    @Body() dto: AddCollectionRecordDto
  ) {
    return this.service.addCollectionRecord(Number(applicationId), dto)
  }

  @Get('collection/:applicationId')
  @ApiOperation({ summary: '获取催收记录列表' })
  getCollectionRecords(@Param('applicationId') applicationId: string) {
    return this.service.getCollectionRecords(Number(applicationId))
  }

  // ==================== 提前还款 ====================

  @Post('early-repayment/apply/:applicationId')
  @ApiOperation({ summary: '申请提前还款' })
  applyEarlyRepayment(
    @Param('applicationId') applicationId: string,
    @Body() dto: ApplyEarlyRepaymentDto
  ) {
    return this.service.applyEarlyRepayment(Number(applicationId), dto)
  }

  @Post('early-repayment/:id/approve')
  @ApiOperation({ summary: '审批提前还款' })
  approveEarlyRepayment(
    @Param('id') id: string,
    @Body() dto: ApproveEarlyRepaymentDto
  ) {
    return this.service.approveEarlyRepayment(Number(id), dto)
  }

  @Post('early-repayment/:id/complete')
  @ApiOperation({ summary: '完成提前还款' })
  completeEarlyRepayment(@Param('id') id: string) {
    return this.service.completeEarlyRepayment(Number(id))
  }

  @Get('early-repayment/list/:applicationId')
  @ApiOperation({ summary: '获取提前还款记录列表' })
  getEarlyRepayments(@Param('applicationId') applicationId: string) {
    return this.service.getEarlyRepayments(Number(applicationId))
  }
}
