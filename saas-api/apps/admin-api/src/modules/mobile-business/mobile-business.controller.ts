import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RequestUser } from '../../common/types/request-user'
import { UploadedImageFile } from '../file/file.service'
import {
  MobileCreditApplyDto,
  MobileCreditListQueryDto,
  MobileCreditUpdateDto,
  MobileIdCardInfoDto,
  MobileUserListQueryDto,
  MobileUuidQueryDto,
  MobileVehicleInfoDto
} from './dto/mobile-business.dto'
import { MobileBusinessService } from './mobile-business.service'

const IMAGE_UPLOAD_LIMIT = 10 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
])

function imageUploadInterceptor() {
  return FileInterceptor('file', {
    limits: { fileSize: IMAGE_UPLOAD_LIMIT },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
        callback(new BadRequestException('仅支持 jpg、png、gif、webp、bmp 图片'), false)
        return
      }
      callback(null, true)
    }
  })
}

@ApiTags('移动端文件')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/file')
export class MobileFileController {
  constructor(private readonly service: MobileBusinessService) {}

  @Post('upload')
  @ApiOperation({ summary: '移动端图片上传' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' }
      }
    }
  })
  @UseInterceptors(imageUploadInterceptor())
  upload(
    @UploadedFile() file: UploadedImageFile,
    @CurrentUser() user: RequestUser,
    @Headers('x-org-id') orgId?: string
  ) {
    return this.service.upload(file, user, orgId ? Number(orgId) : undefined)
  }

  @Post('uploadWithType')
  @ApiOperation({ summary: '移动端带业务类型图片上传' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(imageUploadInterceptor())
  uploadWithType(
    @UploadedFile() file: UploadedImageFile,
    @Body() body: Record<string, string>,
    @CurrentUser() user: RequestUser,
    @Headers('x-org-id') orgId?: string
  ) {
    return this.service.uploadWithType(file, body, user, orgId ? Number(orgId) : undefined)
  }

  @Get('getFileList')
  @ApiOperation({ summary: '移动端文件列表' })
  getFileList(@Query() query: Record<string, string>, @CurrentUser() user: RequestUser) {
    return this.service.getFileList(query, user)
  }

  @Get('getFileListByType')
  @ApiOperation({ summary: '移动端按类型文件列表' })
  getFileListByType(@Query() query: Record<string, string>, @CurrentUser() user: RequestUser) {
    return this.service.getFileListByType(query, user)
  }

  @Delete('deleteFile/:id')
  @ApiOperation({ summary: '移动端删除文件' })
  deleteFile(@Param('id') id: string) {
    return this.service.deleteFile(Number(id))
  }

  @Get('getProductFileList')
  @ApiOperation({ summary: '移动端产品资料清单' })
  getProductFileList() {
    return this.service.getProductFileList()
  }
}

@ApiTags('移动端客户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/user')
export class MobileUserController {
  constructor(private readonly service: MobileBusinessService) {}

  @Post('addOrUpdateUserBasic')
  @ApiOperation({ summary: '保存身份证信息' })
  addOrUpdateUserBasic(
    @Body() dto: MobileIdCardInfoDto,
    @CurrentUser() user: RequestUser,
    @Headers('x-org-id') orgId?: string
  ) {
    return this.service.addOrUpdateUserBasic(dto, user, orgId ? Number(orgId) : undefined)
  }

  @Post('addOrUpdateIdCardInfo')
  @ApiOperation({ summary: '保存身份证信息别名' })
  addOrUpdateIdCardInfo(
    @Body() dto: MobileIdCardInfoDto,
    @CurrentUser() user: RequestUser,
    @Headers('x-org-id') orgId?: string
  ) {
    return this.service.addOrUpdateUserBasic(dto, user, orgId ? Number(orgId) : undefined)
  }

  @Get('getUserBasic')
  @ApiOperation({ summary: '获取身份证信息' })
  getUserBasic(@Query() query: MobileUuidQueryDto) {
    return this.service.getUserBasic(query.uuid)
  }

  @Post('getIdCardInfo')
  @ApiOperation({ summary: '获取当前身份证信息占位' })
  getIdCardInfo() {
    return null
  }

  @Get('getUserList')
  @ApiOperation({ summary: '客户列表' })
  getUserList(@Query() query: MobileUserListQueryDto) {
    return this.service.getUserList(query)
  }
}

@ApiTags('移动端车辆')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/vehicle')
export class MobileVehicleController {
  constructor(private readonly service: MobileBusinessService) {}

  @Post('addOrUpdateVehicle')
  @ApiOperation({ summary: '保存车辆信息' })
  addOrUpdateVehicle(@Body() dto: MobileVehicleInfoDto, @CurrentUser() user: RequestUser) {
    return this.service.addOrUpdateVehicle(dto, user)
  }

  @Get('getVehicleInfo')
  @ApiOperation({ summary: '获取车辆信息' })
  getVehicleInfo(@Query() query: MobileUuidQueryDto) {
    return this.service.getVehicleInfo(query.uuid)
  }

  @Post('getVehicleOcr')
  @ApiOperation({ summary: '行驶证 OCR 占位' })
  getVehicleOcr() {
    return null
  }
}

@ApiTags('移动端授信')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/credit')
export class MobileCreditController {
  constructor(private readonly service: MobileBusinessService) {}

  @Post('apply')
  @ApiOperation({ summary: '提交授信申请' })
  apply(@Body() dto: MobileCreditApplyDto, @CurrentUser() user: RequestUser) {
    return this.service.creditApply(dto, user)
  }

  @Post('update')
  @ApiOperation({ summary: '修改授信申请' })
  update(@Body() dto: MobileCreditUpdateDto) {
    return this.service.updateCredit(dto)
  }

  @Get('getCreditList')
  @ApiOperation({ summary: '授信申请列表' })
  getCreditList(@Query() query: MobileCreditListQueryDto) {
    return this.service.getCreditList(query)
  }

  @Get('getCreditDetail/:id')
  @ApiOperation({ summary: '授信申请详情' })
  getCreditDetail(@Param('id') id: string) {
    return this.service.getCreditDetail(id)
  }

  @Get('getCreditDetailByOrderId/:creditOrderId')
  @ApiOperation({ summary: '按订单号获取授信申请详情' })
  getCreditDetailByOrderId(@Param('creditOrderId') creditOrderId: string) {
    return this.service.getCreditDetailByOrderId(creditOrderId)
  }
}

@ApiTags('移动端枚举')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/enum')
export class MobileEnumController {
  constructor(private readonly service: MobileBusinessService) {}

  @Get('loanBusinessNodes')
  @ApiOperation({ summary: '贷款业务节点枚举' })
  getLoanBusinessNodes() {
    return this.service.getLoanBusinessNodes()
  }
}

@ApiTags('移动端统计')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/statistics')
export class MobileStatisticsController {
  constructor(private readonly service: MobileBusinessService) {}

  @Get('overview')
  @ApiOperation({ summary: '业务统计概览' })
  overview() {
    return this.service.getStatisticsOverview()
  }
}
