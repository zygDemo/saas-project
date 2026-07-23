
import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { RequestUser } from '../../common/types/request-user'
import { BatchDeleteFileAssetDto, CreateFileAssetDto, FileQueryDto, UpdateFileAssetDto } from './dto/file.dto'
import { FileService, UploadedImageFile } from './file.service'
import { Public } from '../../common/decorators/public.decorator'

const IMAGE_UPLOAD_LIMIT = 10 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
])

@ApiTags('文件管理')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get('list')
  @Public()
  @ApiOperation({ summary: '文件列表' })
  list(@Query() query: FileQueryDto) {
    return this.fileService.getList(query)
  }

  @Get('business/list')
  @Public()
  @ApiOperation({ summary: '按业务单据获取文件列表' })
  businessList(@Query() query: FileQueryDto) {
    return this.fileService.getBusinessFiles(query)
  }

  @Get('business/categories')
  @Public()
  @ApiOperation({ summary: '按业务单据获取文件分类' })
  businessCategories(@Query() query: FileQueryDto) {
    return this.fileService.getBusinessCategories(query)
  }

  @Post('upload/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
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
  @Public()
  @ApiOperation({ summary: '文件详情' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.fileService.getDetail(id)
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '新增文件记录' })
  create(@Body() dto: CreateFileAssetDto, @CurrentUser() user: RequestUser) {
    return this.fileService.create(dto, user)
  }

  @Post('batch-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '批量删除文件记录' })
  batchRemove(@Body() dto: BatchDeleteFileAssetDto) {
    return this.fileService.batchRemove(dto.ids)
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑文件记录' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFileAssetDto) {
    return this.fileService.update(id, dto)
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除文件记录' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fileService.remove(id)
  }

}
