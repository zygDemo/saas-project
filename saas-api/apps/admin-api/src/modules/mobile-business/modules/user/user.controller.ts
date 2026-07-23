
import { Body, Controller, Get, Headers, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../../../common/decorators/roles.decorator'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../common/guards/roles.guard'
import { RequestUser } from '../../../../common/types/request-user'
import { OcrService } from '../../../ocr/ocr.service'
import { UploadedImageFile } from '../../../file/file.service'
import { ocrImageUploadInterceptor } from '../../common/mobile-upload.interceptor'
import {
  MobileIdCardInfoDto,
  MobileUserListQueryDto,
  MobileUuidQueryDto,
  OcrObjectKeyDto
} from '../../dto/mobile-business.dto'
import { MobileCustomerService } from '../../mobile-customer.service'
import { Public } from '../../../../common/decorators/public.decorator'

@ApiTags('移动端客户')
@Controller('m/user')
export class MobileUserController {
  constructor(
    private readonly customerService: MobileCustomerService,
    private readonly ocrService: OcrService
  ) {}

  @Post('addOrUpdateUserBasic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '保存身份证信息' })
  addOrUpdateUserBasic(
    @Body() dto: MobileIdCardInfoDto,
    @CurrentUser() user: RequestUser,
    @Headers('x-org-id') orgId?: string
  ) {
    return this.customerService.addOrUpdateUserBasic(dto, user, orgId ? Number(orgId) : undefined)
  }

  @Get('getUserBasic')
  @Public()
  @ApiOperation({ summary: '获取身份证信息' })
  getUserBasic(@Query() query: MobileUuidQueryDto) {
    return this.customerService.getUserBasic(query.uuid)
  }

  @Post('getIdCardInfo')
  @ApiOperation({ summary: '获取当前身份证信息占位' })
  getIdCardInfo() {
    return null
  }

  @Post('getIdCardOcr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '身份证 OCR 识别' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        objectKey: { type: 'string' },
        side: { type: 'string', enum: ['front', 'back'] }
      }
    }
  })
  @UseInterceptors(ocrImageUploadInterceptor())
  async getIdCardOcr(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body() body: OcrObjectKeyDto
  ) {
    if (file) {
      return this.ocrService.recognizeIdCard(file, body.side)
    }
    return this.ocrService.recognizeIdCardByObjectKey(body)
  }

  @Get('getUserList')
  @Public()
  @ApiOperation({ summary: '客户列表' })
  getUserList(@Query() query: MobileUserListQueryDto) {
    return this.customerService.getUserList(query)
  }
}
