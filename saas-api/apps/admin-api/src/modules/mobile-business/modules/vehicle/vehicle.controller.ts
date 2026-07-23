
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Public
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../../../common/guards/roles.guard'
import { RequestUser } from '../../../../common/types/request-user'
import { OcrService } from '../../../ocr/ocr.service'
import { UploadedImageFile } from '../../../file/file.service'
import { ocrImageUploadInterceptor } from '../../common/mobile-upload.interceptor'
import { MobileVehicleInfoDto, MobileUuidQueryDto, OcrObjectKeyDto } from '../../dto/mobile-business.dto'
import { MobileVehicleService } from '../../mobile-vehicle.service'

@ApiTags('移动端车辆')
@Controller('m/vehicle')
export class MobileVehicleController {
  constructor(
    private readonly vehicleService: MobileVehicleService,
    private readonly ocrService: OcrService
  ) {}

  @Post('addOrUpdateVehicle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '保存车辆信息' })
  addOrUpdateVehicle(@Body() dto: MobileVehicleInfoDto, @CurrentUser() user: RequestUser) {
    return this.vehicleService.addOrUpdateVehicle(dto, user)
  }

  @Get('getVehicleInfo')
  @Public()
  @ApiOperation({ summary: '获取车辆信息' })
  getVehicleInfo(@Query() query: MobileUuidQueryDto) {
    return this.vehicleService.getVehicleInfo(query.uuid)
  }

  @Post('getVehicleOcr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
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
  async getVehicleOcr(
    @UploadedFile() file: UploadedImageFile | undefined,
    @Body() body: OcrObjectKeyDto
  ) {
    if (file) {
      return this.ocrService.recognizeVehicle(file)
    }
    return this.ocrService.recognizeVehicleByObjectKey(body)
  }
}
