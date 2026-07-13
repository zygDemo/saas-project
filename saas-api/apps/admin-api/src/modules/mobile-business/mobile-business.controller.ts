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
import { OcrObjectKeyDto } from '../ocr/dto/ocr.dto'
import {
  MobileCreditApplyDto,
  MobileCreditListQueryDto,
  MobileCreditUpdateDto,
  MobileIdCardInfoDto,
  MobileUserListQueryDto,
  MobileUuidQueryDto,
  MobileVehicleInfoDto,
  MobileContactDto,
  MobileSalesLeadDto,
  MobileFollowUpDto,
  MobileSigningStartDto
} from './dto/mobile-business.dto'
import { MobileBusinessService } from './mobile-business.service'
import { MobileFileService } from './mobile-file.service'
import { MobileCustomerService } from './mobile-customer.service'
import { MobileVehicleService } from './mobile-vehicle.service'
import { MobileCreditService } from './mobile-credit.service'
import { MobileContactService } from './mobile-contact.service'
import { MobileLeadService } from './mobile-lead.service'
import { MobileSigningService } from './mobile-signing.service'
import { MobileBankCardService } from './mobile-bank-card.service'
import { MobilePostLoanService } from './mobile-post-loan.service'

const IMAGE_UPLOAD_LIMIT = 10 * 1024 * 1024
const OCR_IMAGE_UPLOAD_LIMIT = 8 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
])
const ALLOWED_OCR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/bmp'])

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

function ocrImageUploadInterceptor() {
  return FileInterceptor('file', {
    limits: { fileSize: OCR_IMAGE_UPLOAD_LIMIT },
    fileFilter: (_req, file, callback) => {
      if (!ALLOWED_OCR_MIME_TYPES.has(file.mimetype)) {
        callback(new BadRequestException('OCR 仅支持 jpg、png、webp、bmp 图片'), false)
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
  constructor(
    private readonly service: MobileBusinessService,
    private readonly fileService: MobileFileService
  ) {}

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
    return this.fileService.upload(file, user, orgId ? Number(orgId) : undefined)
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
    return this.fileService.uploadWithType(file, body, user, orgId ? Number(orgId) : undefined)
  }

  @Get('getFileList')
  @ApiOperation({ summary: '移动端文件列表' })
  getFileList(@Query() query: Record<string, string>, @CurrentUser() user: RequestUser) {
    return this.fileService.getFileList(query, user)
  }

  @Get('getFileListByType')
  @ApiOperation({ summary: '移动端按类型文件列表' })
  getFileListByType(@Query() query: Record<string, string>, @CurrentUser() user: RequestUser) {
    return this.fileService.getFileListByType(query, user)
  }

  @Delete('deleteFile/:id')
  @ApiOperation({ summary: '移动端删除文件' })
  deleteFile(@Param('id') id: string) {
    return this.fileService.deleteFile(Number(id))
  }

  @Get('getProductFileList')
  @ApiOperation({ summary: '移动端产品资料清单' })
  getProductFileList(@Query('creditOrderId') creditOrderId?: string) {
    return this.fileService.getProductFileList(creditOrderId)
  }
}

@ApiTags('移动端客户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/user')
export class MobileUserController {
  constructor(
    private readonly service: MobileBusinessService,
    private readonly customerService: MobileCustomerService
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

  @Post('addOrUpdateIdCardInfo')
  @ApiOperation({ summary: '保存身份证信息别名' })
  addOrUpdateIdCardInfo(
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
  getIdCardOcr(@UploadedFile() file: UploadedImageFile | undefined, @Body() body: OcrObjectKeyDto) {
    return this.service.getIdCardOcr(body, file)
  }

  @Get('getUserList')
  @ApiOperation({ summary: '客户列表' })
  getUserList(@Query() query: MobileUserListQueryDto) {
    return this.customerService.getUserList(query)
  }
}

@ApiTags('移动端车辆')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/vehicle')
export class MobileVehicleController {
  constructor(
    private readonly service: MobileBusinessService,
    private readonly vehicleService: MobileVehicleService
  ) {}

  @Post('addOrUpdateVehicle')
  @ApiOperation({ summary: '保存车辆信息' })
  addOrUpdateVehicle(@Body() dto: MobileVehicleInfoDto, @CurrentUser() user: RequestUser) {
    return this.vehicleService.addOrUpdateVehicle(dto, user)
  }

  @Get('getVehicleInfo')
  @ApiOperation({ summary: '获取车辆信息' })
  getVehicleInfo(@Query() query: MobileUuidQueryDto) {
    return this.vehicleService.getVehicleInfo(query.uuid)
  }

  @Post('getVehicleOcr')
  @ApiOperation({ summary: '行驶证 OCR 识别' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        objectKey: { type: 'string' }
      }
    }
  })
  @UseInterceptors(ocrImageUploadInterceptor())
  getVehicleOcr(@UploadedFile() file: UploadedImageFile | undefined, @Body() body: OcrObjectKeyDto) {
    return this.service.getVehicleOcr(body, file)
  }
}

@ApiTags('移动端授信')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/credit')
export class MobileCreditController {
  constructor(private readonly creditService: MobileCreditService) {}

  @Post('apply')
  @ApiOperation({ summary: '提交授信申请' })
  apply(@Body() dto: MobileCreditApplyDto, @CurrentUser() user: RequestUser) {
    return this.creditService.creditApply(dto, user)
  }

  @Post('update')
  @ApiOperation({ summary: '修改授信申请' })
  update(@Body() dto: MobileCreditUpdateDto) {
    return this.creditService.updateCredit(dto)
  }

  @Post('updateSupplementStatus')
  @ApiOperation({ summary: '更新补件子节点状态' })
  updateSupplementStatus(@Body() dto: { creditOrderId: string; field: string; value: number }) {
    return this.creditService.updateSupplementStatus(dto.creditOrderId, dto.field, dto.value)
  }

  @Get('getCreditList')
  @ApiOperation({ summary: '授信申请列表' })
  getCreditList(@Query() query: MobileCreditListQueryDto) {
    return this.creditService.getCreditList(query)
  }

  @Get('getCreditDetail/:id')
  @ApiOperation({ summary: '授信申请详情' })
  getCreditDetail(@Param('id') id: string) {
    return this.creditService.getCreditDetail(id)
  }

  @Get('getCreditDetailByOrderId/:creditOrderId')
  @ApiOperation({ summary: '按订单号获取授信申请详情' })
  getCreditDetailByOrderId(@Param('creditOrderId') creditOrderId: string) {
    return this.creditService.getCreditDetailByOrderId(creditOrderId)
  }
}

@ApiTags('移动端枚举')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/enum')
export class MobileEnumController {
  constructor(private readonly creditService: MobileCreditService) {}

  @Get('loanBusinessNodes')
  @ApiOperation({ summary: '贷款业务节点枚举' })
  getLoanBusinessNodes() {
    return this.creditService.getLoanBusinessNodes()
  }

  @Get('flow-steps/:nodeCode')
  @ApiOperation({ summary: '获取流程节点步骤' })
  getFlowSteps(@Param('nodeCode') nodeCode: string, @Query('businessType') businessType?: string) {
    return this.creditService.getFlowSteps(nodeCode, businessType)
  }

  @Get('flow-config/:nodeCode')
  @ApiOperation({ summary: '获取流程节点配置' })
  getFlowConfig(@Param('nodeCode') nodeCode: string, @Query('businessType') businessType?: string) {
    return this.creditService.getFlowConfigByNodeCode(nodeCode, businessType)
  }

  @Get('flow-nodes')
  @ApiOperation({ summary: '获取全部流程节点列表' })
  getFlowNodes(@Query('businessType') businessType?: string) {
    return this.creditService.getFlowNodes(businessType)
  }
}

@ApiTags('移动端统计')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/statistics')
export class MobileStatisticsController {
  constructor(private readonly creditService: MobileCreditService) {}

  @Get('overview')
  @ApiOperation({ summary: '业务统计概览' })
  overview() {
    return this.creditService.getStatisticsOverview()
  }
}

@ApiTags('移动端联系人')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/contact')
export class MobileContactController {
  constructor(private readonly contactService: MobileContactService) {}

  @Post('addOrUpdateContact')
  @ApiOperation({ summary: '新增/更新联系人' })
  addOrUpdateContact(@Body() dto: MobileContactDto) {
    return this.contactService.addOrUpdateContact(dto)
  }

  @Get('getContacts')
  @ApiOperation({ summary: '获取联系人列表' })
  getContacts(@Query('userUuid') userUuid: string) {
    return this.contactService.getContacts(userUuid)
  }

  @Delete('deleteContact/:id')
  @ApiOperation({ summary: '删除联系人' })
  deleteContact(@Param('id') id: string) {
    return this.contactService.deleteContact(Number(id))
  }
}

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

@ApiTags('移动端签约')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)

@Controller('m/bank-card')
@ApiTags('移动端-银行卡')
export class MobileBankCardController {
  constructor(private readonly bankCardService: MobileBankCardService) {}

  @Get('list')
  @ApiOperation({ summary: '获取客户银行卡列表' })
  getList(@Query('customerId') customerId: string) {
    return this.bankCardService.getBankCards(Number(customerId))
  }

  @Post('add')
  @ApiOperation({ summary: '添加银行卡' })
  add(@Body() dto: { customerId: number; bankName: string; cardNo: string; cardType?: string; isDefault?: boolean }) {
    return this.bankCardService.addBankCard(dto.customerId, dto)
  }

  @Post('delete/:id')
  @ApiOperation({ summary: '删除银行卡' })
  remove(@Param('id') id: string) {
    return this.bankCardService.deleteBankCard(Number(id))
  }
}

@Controller('m/post-loan')
@ApiTags('移动端-贷后管理')
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
  applyEarlyRepayment(@Body() dto: { applicationId: number; repayType?: string; amount: number; principal: number; interest: number; penalty?: number; reason?: string }) {
    return this.postLoanService.applyEarlyRepaymentMobile(dto.applicationId, dto)
  }

  @Get('detail/:id')
  @ApiOperation({ summary: '获取订单详情' })
  getDetail(@Param('id') id: string) {
    return this.postLoanService.getApplicationDetailMobile(Number(id))
  }

  @Post('register-repayment')
  @ApiOperation({ summary: '登记还款' })
  registerRepayment(@Body() dto: { applicationId: number; amount: number; principal?: number; interest?: number; penalty?: number; paymentMethod: string; transactionNo?: string; remark?: string }) {
    return this.postLoanService.registerRepaymentMobile(dto.applicationId, dto)
  }
}

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
