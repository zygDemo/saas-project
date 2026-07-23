import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RequestUser } from '../../../../common/types/request-user'
import { MobileFollowUpDto, MobileSalesLeadDto } from '../../dto/mobile-business.dto'
import { MobileLeadService } from '../../mobile-lead.service'

@ApiTags('移动端线索')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/salesLead')
export class MobileSalesLeadController {
  constructor(private readonly leadService: MobileLeadService) {}

  @Post('add')
  @ApiOperation({ summary: '新增销售线索' })
  add(
    @Body() dto: MobileSalesLeadDto,
    @CurrentUser() user: RequestUser,
    @Headers('x-org-id') orgId?: string
  ) {
    return this.leadService.addSalesLead(dto, user, orgId ? Number(orgId) : undefined)
  }
}

@ApiTags('移动端跟进')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/clueFollowUp')
export class MobileFollowUpController {
  constructor(private readonly leadService: MobileLeadService) {}

  @Post('add')
  @ApiOperation({ summary: '新增跟进记录' })
  add(@Body() dto: MobileFollowUpDto, @CurrentUser() user: RequestUser) {
    return this.leadService.addFollowUp(dto, user)
  }

  @Get('list/:uuid')
  @ApiOperation({ summary: '获取跟进列表' })
  list(@Param('uuid') uuid: string) {
    return this.leadService.getFollowUpList(uuid)
  }
}
