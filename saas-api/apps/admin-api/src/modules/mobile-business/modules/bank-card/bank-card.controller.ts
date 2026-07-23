
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../common/guards/roles.guard'
import { Roles } from '../../../../common/decorators/roles.decorator'
import { MobileBankCardService } from '../../mobile-bank-card.service'
import { Public } from '../../../../common/decorators/public.decorator'

@ApiTags('移动端-银行卡')
@Controller('m/bank-card')
export class MobileBankCardController {
  constructor(private readonly bankCardService: MobileBankCardService) {}

  @Get('list')
  @Public()
  @ApiOperation({ summary: '获取客户银行卡列表' })
  getList(@Query('customerId') customerId: string) {
    return this.bankCardService.getBankCards(Number(customerId))
  }

  @Post('add')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '添加银行卡' })
  add(@Body() dto: { customerId: number; bankName: string; cardNo: string; cardType?: string; isDefault?: boolean }) {
    return this.bankCardService.addBankCard(dto.customerId, dto)
  }

  @Post('delete/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除银行卡' })
  remove(@Param('id') id: string) {
    return this.bankCardService.deleteBankCard(Number(id))
  }
}
