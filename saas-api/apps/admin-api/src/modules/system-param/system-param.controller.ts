import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { SystemParamService } from './system-param.service'
import { CreateSystemParamDto, UpdateSystemParamDto } from './dto/system-param.dto'

@ApiTags('系统参数管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('system-param')
export class SystemParamController {
  constructor(private readonly service: SystemParamService) {}

  @Get('list')
  @ApiOperation({ summary: '获取系统参数列表' })
  list(@Query() query: Record<string, string | undefined>) {
    return this.service.getList(query)
  }

  @Post('create')
  @ApiOperation({ summary: '新增系统参数' })
  create(@Body() dto: CreateSystemParamDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑系统参数' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSystemParamDto) {
    return this.service.update(id, dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除系统参数' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id)
  }

  @Get('by-keys')
  @ApiOperation({ summary: '按 key 批量获取参数' })
  getByKeys(@Query('keys') keys: string) {
    const keyList = keys.split(',').map(k => k.trim()).filter(Boolean)
    return this.service.getByKeys(keyList)
  }
}
