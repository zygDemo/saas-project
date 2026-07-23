import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
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

@ApiTags('移动端客户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/user')
export class MobileUserController {
  constructor(
    private readonly customerService: MobileCustomerService,
    private readonly ocrService: OcrService
  ) {}

  @Post('addOrUpdateUserBasic')
  @ApiOperation({ summary: '保存身份证信息' })
  addOrUpdateUserBasic(
    @Body() dto: MobileIdCardInfoDto,
    @CurrentUser() user: RequestUser,
    @Headers('x-org-id') orgId?: string
  ) {
    return this.customerService.addOrUpdateUserBasic(dto, user, orgId ? Number(orgId) : undefined)
  }

  @Get('getUserBasic')
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
  @ApiOperation({ summary: '客户列表' })
  getUserList(@Query() query: MobileUserListQueryDto) {
    return this.customerService.getUserList(query)
  }
}
