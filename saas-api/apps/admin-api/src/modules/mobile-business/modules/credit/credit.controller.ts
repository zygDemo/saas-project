
import { Body, Controller, Get, Param, Post, Query, UseGuards, Public } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../common/guards/roles.guard'
import { Roles } from '../../../../common/decorators/roles.decorator'
import { RequestUser } from '../../../../common/types/request-user'
import {
  MobileCreditApplyDto,
  MobileCreditListQueryDto,
  MobileCreditUpdateDto
} from '../../dto/mobile-business.dto'
import { MobileCreditService } from '../../mobile-credit.service'

@ApiTags('移动端授信')
@Controller('m/credit')
export class MobileCreditController {
  constructor(private readonly creditService: MobileCreditService) {}

  @Post('apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '提交授信申请' })
  apply(@Body() dto: MobileCreditApplyDto, @CurrentUser() user: RequestUser) {
    return this.creditService.creditApply(dto, user)
  }

  @Post('update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '修改授信申请' })
  update(@Body() dto: MobileCreditUpdateDto) {
    return this.creditService.updateCredit(dto)
  }

  @Post('updateSupplementStatus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '更新补件子节点状态' })
  updateSupplementStatus(@Body() dto: { creditOrderId: string; field: string; value: number }) {
    return this.creditService.updateSupplementStatus(dto.creditOrderId, dto.field, dto.value)
  }

  @Get('getCreditList')
  @Public()
  @ApiOperation({ summary: '授信申请列表' })
  getCreditList(@Query() query: MobileCreditListQueryDto) {
    return this.creditService.getCreditList(query)
  }

  @Get('getCreditDetail/:id')
  @Public()
  @ApiOperation({ summary: '授信申请详情' })
  getCreditDetail(@Param('id') id: string) {
    return this.creditService.getCreditDetail(id)
  }

  @Get('getCreditDetailByOrderId/:creditOrderId')
  @Public()
  @ApiOperation({ summary: '按订单号获取授信申请详情' })
  getCreditDetailByOrderId(@Param('creditOrderId') creditOrderId: string) {
    return this.creditService.getCreditDetailByOrderId(creditOrderId)
  }
}

@ApiTags('移动端枚举')
@Controller('m/enum')
export class MobileEnumController {
  constructor(private readonly creditService: MobileCreditService) {}

  @Get('loanBusinessNodes')
  @Public()
  @ApiOperation({ summary: '贷款业务节点枚举' })
  getLoanBusinessNodes() {
    return this.creditService.getLoanBusinessNodes()
  }

  @Get('flow-steps/:nodeCode')
  @Public()
  @ApiOperation({ summary: '获取流程节点步骤' })
  getFlowSteps(@Param('nodeCode') nodeCode: string, @Query('businessType') businessType?: string) {
    return this.creditService.getFlowSteps(nodeCode, businessType)
  }

  @Get('flow-config/:nodeCode')
  @Public()
  @ApiOperation({ summary: '获取流程节点配置' })
  getFlowConfig(@Param('nodeCode') nodeCode: string, @Query('businessType') businessType?: string) {
    return this.creditService.getFlowConfigByNodeCode(nodeCode, businessType)
  }

  @Get('flow-nodes')
  @Public()
  @ApiOperation({ summary: '获取全部流程节点列表' })
  getFlowNodes(@Query('businessType') businessType?: string) {
    return this.creditService.getFlowNodes(businessType)
  }
}

@ApiTags('移动端统计')
@Controller('m/statistics')
export class MobileStatisticsController {
  constructor(private readonly creditService: MobileCreditService) {}

  @Get('overview')
  @Public()
  @ApiOperation({ summary: '业务统计概览' })
  overview() {
    return this.creditService.getStatisticsOverview()
  }
}
