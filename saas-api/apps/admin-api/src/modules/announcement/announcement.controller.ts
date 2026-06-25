import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AnnouncementService } from './announcement.service'
import { CreateAnnouncementDto, UpdateAnnouncementDto } from './dto/announcement.dto'

@ApiTags('公告管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly service: AnnouncementService) {}

  @Get('list')
  @ApiOperation({ summary: '获取公告列表' })
  list(@Query() query: Record<string, string | undefined>) {
    return this.service.getList(query)
  }

  @Get('active')
  @ApiOperation({ summary: '获取当前有效公告' })
  getActive() {
    return this.service.getActive()
  }

  @Get(':id')
  @ApiOperation({ summary: '获取公告详情' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id)
  }

  @Post('create')
  @ApiOperation({ summary: '新增公告' })
  create(@Body() dto: CreateAnnouncementDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑公告' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto)
  }

  @Post(':id/publish')
  @ApiOperation({ summary: '发布公告' })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.service.publish(id)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除公告' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id)
  }
}
