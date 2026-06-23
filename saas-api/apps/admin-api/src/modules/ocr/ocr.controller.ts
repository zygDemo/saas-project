import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { OcrObjectKeyDto } from './dto/ocr.dto'
import { OcrImageFile, OcrService } from './ocr.service'

const OCR_IMAGE_UPLOAD_LIMIT = 8 * 1024 * 1024
const ALLOWED_OCR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/bmp'])

function ocrUploadInterceptor() {
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

const OCR_FILE_BODY = {
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary' }
    },
    required: ['file']
  }
}

@ApiTags('OCR')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Get('health')
  @ApiOperation({ summary: 'OCR 服务健康检查' })
  health() {
    return this.ocrService.health()
  }

  @Post('upload')
  @ApiOperation({ summary: '上传图片 OCR 识别' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(OCR_FILE_BODY)
  @UseInterceptors(ocrUploadInterceptor())
  upload(@UploadedFile() file: OcrImageFile) {
    return this.ocrService.recognize(file)
  }

  @Post('by-object-key')
  @ApiOperation({ summary: '按已上传文件 objectKey 进行 OCR 识别' })
  @ApiBody({ type: OcrObjectKeyDto })
  byObjectKey(@Body() dto: OcrObjectKeyDto) {
    return this.ocrService.recognizeByObjectKey(dto)
  }

  @Post('vehicle')
  @ApiOperation({ summary: '行驶证 OCR 识别' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(OCR_FILE_BODY)
  @UseInterceptors(ocrUploadInterceptor())
  vehicle(@UploadedFile() file: OcrImageFile) {
    return this.ocrService.recognizeVehicle(file)
  }

  @Post('id-card')
  @ApiOperation({ summary: '身份证 OCR 识别' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        side: { type: 'string', enum: ['front', 'back'] }
      },
      required: ['file']
    }
  })
  @UseInterceptors(ocrUploadInterceptor())
  idCard(@UploadedFile() file: OcrImageFile, @Body() body: Pick<OcrObjectKeyDto, 'side'>) {
    return this.ocrService.recognizeIdCard(file, body.side)
  }
}
