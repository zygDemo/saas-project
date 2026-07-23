import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { MobilePostLoanService } from '../../mobile-post-loan.service'

@ApiTags('移动端-贷后管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/post-loan')
export class MobilePostLoanController {
  constructor(private readonly postLoanService: MobilePostLoanService) {}

  @Post('confirm-amount')
  @ApiOperation({ summary: '确认额度' })
  confirmAmount(@Body() dto: { applicationId: number; approvedAmount: number; term?: number; rate?: number }) {
    return this.postLoanService.confirmAmount(Number(dto.applicationId), dto)
  }

  @Get('repayment-plans/:applicationId')
  @ApiOperation({ summary: '获取还款计划' })
  getRepaymentPlans(@Param('applicationId') applicationId: string) {
    return this.postLoanService.getRepaymentPlansMobile(Number(applicationId))
  }

  @Post('early-repayment')
  @ApiOperation({ summary: '申请提前还款' })
  applyEarlyRepayment(
    @Body() dto: { applicationId: number; repayType?: string; amount: number; principal: number; interest: number; penalty?: number; reason?: string }
  ) {
    return this.postLoanService.applyEarlyRepaymentMobile(dto.applicationId, dto)
  }

  @Get('detail/:id')
  @ApiOperation({ summary: '获取订单详情' })
  getDetail(@Param('id') id: string) {
    return this.postLoanService.getApplicationDetailMobile(Number(id))
  }

  @Post('register-repayment')
  @ApiOperation({ summary: '登记还款' })
  registerRepayment(
    @Body() dto: { applicationId: number; amount: number; principal?: number; interest?: number; penalty?: number; paymentMethod: string; transactionNo?: string; remark?: string }
  ) {
    return this.postLoanService.registerRepaymentMobile(dto.applicationId, dto)
  }
}
