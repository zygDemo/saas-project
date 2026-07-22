import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { AnnouncementService } from './announcement.service'
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto } from './dto/announcement.dto'

@ApiTags('公告管理')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: '未授权' })
@UseGuards(JwtAuthGuard)
@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly service: AnnouncementService) {}

  @ApiResponse({ status: 200, description: '成功' })
  @Get('list')
  @ApiOperation({ summary: '获取公告列表' })
  list(@Query() query: AnnouncementQueryDto) {
    return this.service.getList(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get('active')
  @ApiOperation({ summary: '获取当前有效公告' })
  getActive() {
    return this.service.getActive()
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get(':id')
  @ApiOperation({ summary: '获取公告详情' })
  getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post('create')
  @ApiOperation({ summary: '新增公告' })
  create(@Body() dto: CreateAnnouncementDto) {
    return this.service.create(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id')
  @ApiOperation({ summary: '编辑公告' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnnouncementDto) {
    return this.service.update(id, dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/publish')
  @ApiOperation({ summary: '发布公告' })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.service.publish(id)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/unpublish')
  @ApiOperation({ summary: '撤回公告' })
  unpublish(@Param('id', ParseIntPipe) id: number) {
    return this.service.unpublish(id)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/expire')
  @ApiOperation({ summary: '设为过期' })
  expire(@Param('id', ParseIntPipe) id: number) {
    return this.service.expire(id)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/delete')
  @ApiOperation({ summary: '删除公告' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id)
  }
}
