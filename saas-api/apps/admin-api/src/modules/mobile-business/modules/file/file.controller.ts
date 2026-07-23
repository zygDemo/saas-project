import {
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard'
import { RequestUser } from '../../../../common/types/request-user'
import { UploadedImageFile } from '../../../file/file.service'
import { imageUploadInterceptor } from '../../common/mobile-upload.interceptor'
import { MobileFileService } from '../../mobile-file.service'

@ApiTags('移动端文件')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('m/file')
export class MobileFileController {
  constructor(private readonly fileService: MobileFileService) {}

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
