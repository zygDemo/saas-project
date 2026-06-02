import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { CreateFileAssetDto, FileQueryDto, UpdateFileAssetDto } from './dto/file.dto'
import { FileService, UploadedImageFile } from './file.service'

const IMAGE_UPLOAD_LIMIT = 10 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
])

@ApiTags('文件管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('list')
  @ApiOperation({ summary: '文件列表' })
  list(@Query() query: FileQueryDto) {
    return this.fileService.getList(query)
  }

  @Get('business/list')
  @ApiOperation({ summary: '按业务单据获取文件列表' })
  businessList(@Query() query: FileQueryDto) {
    return this.fileService.getBusinessFiles(query)
  }

  @Get('business/categories')
  @ApiOperation({ summary: '按业务单据获取文件分类' })
  businessCategories(@Query() query: FileQueryDto) {
    return this.fileService.getBusinessCategories(query)
  }

  @Post('upload/image')
  @ApiOperation({ summary: '上传图片' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: IMAGE_UPLOAD_LIMIT },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
          callback(new BadRequestException('仅支持 jpg、png、gif、webp、bmp 图片'), false)
          return
        }

        callback(null, true)
      }
    })
  )
  uploadImage(@UploadedFile() file: UploadedImageFile, @CurrentUser() user: RequestUser) {
    return this.fileService.uploadImage(file, user)
  }

  @Get(':id')
  @ApiOperation({ summary: '文件详情' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.fileService.getDetail(id)
  }

  @Post('create')
  @ApiOperation({ summary: '新增文件记录' })
  create(@Body() dto: CreateFileAssetDto, @CurrentUser() user: RequestUser) {
    return this.fileService.create(dto, user)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑文件记录' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFileAssetDto) {
    return this.fileService.update(id, dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除文件记录' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fileService.remove(id)
  }
}
