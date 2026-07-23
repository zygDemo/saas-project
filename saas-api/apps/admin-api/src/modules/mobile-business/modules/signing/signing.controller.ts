import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { MobileSigningStartDto } from '../../dto/mobile-business.dto'
import { MobileSigningService } from '../../mobile-signing.service'

@ApiTags('移动端签约')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/signing')
export class MobileSigningController {
  constructor(private readonly signingService: MobileSigningService) {}

  @Post('face/start')
  @ApiOperation({ summary: '发起人脸识别' })
  startFaceSign(@Body() dto: MobileSigningStartDto) {
    return this.signingService.startFaceSign(dto)
  }

  @Post('contract/start')
  @ApiOperation({ summary: '发起授权书签署' })
  startAuthContractSign(@Body() dto: MobileSigningStartDto) {
    return this.signingService.startAuthContractSign(dto)
  }

  @Post('loan/start')
  @ApiOperation({ summary: '发起合同签署' })
  startContractSign(@Body() dto: MobileSigningStartDto) {
    return this.signingService.startContractSign(dto)
  }

  @Get('face/detail/:creditOrderId')
  @ApiOperation({ summary: '获取人脸识别结果' })
  getFaceSignDetail(@Param('creditOrderId') creditOrderId: string) {
    return this.signingService.getFaceSignDetail(creditOrderId)
  }

  @Get('contract/detail/:creditOrderId')
  @ApiOperation({ summary: '获取授权书签约详情' })
  getAuthContractDetail(@Param('creditOrderId') creditOrderId: string) {
    return this.signingService.getAuthContractDetail(creditOrderId)
  }

  @Get('loan/detail/:creditOrderId')
  @ApiOperation({ summary: '获取合同签约详情' })
  getContractDetail(@Param('creditOrderId') creditOrderId: string) {
    return this.signingService.getContractDetail(creditOrderId)
  }
}
