import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { FunderService } from './funder.service'
import { FunderQueryDto, CreateFunderDto, UpdateFunderDto } from './dto/funder.dto'

@ApiTags('资方管理')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: '未授权' })
@UseGuards(JwtAuthGuard)
@Controller('funder')
export class FunderController {
  constructor(private readonly service: FunderService) {}

  @ApiResponse({ status: 200, description: '成功' })
  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: FunderQueryDto) {
    return this.service.getList(query)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateFunderDto) {
    return this.service.create(dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateFunderDto) {
    return this.service.update(Number(id), dto)
  }

  @ApiResponse({ status: 200, description: '成功' })
  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
