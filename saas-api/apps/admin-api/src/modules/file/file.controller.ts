import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CreateFileAssetDto, FileQueryDto, UpdateFileAssetDto } from './dto/file.dto'
import { FileService } from './file.service'

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

  @Get(':id')
  @ApiOperation({ summary: '文件详情' })
  detail(@Param('id', ParseIntPipe) id: number) {
    return this.fileService.getDetail(id)
  }

  @Post('create')
  @ApiOperation({ summary: '新增文件记录' })
  create(@Body() dto: CreateFileAssetDto) {
    return this.fileService.create(dto)
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
