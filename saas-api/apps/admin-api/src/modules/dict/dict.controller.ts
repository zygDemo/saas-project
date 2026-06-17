import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { DictService } from './dict.service'
import { CreateDictDataDto, CreateDictTypeDto, UpdateDictDataDto, UpdateDictTypeDto } from './dto/dict.dto'

@ApiTags('字典管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Get('type/list')
  @ApiOperation({ summary: '获取字典类型列表' })
  typeList(@Query() query: Record<string, string | undefined>) {
    return this.dictService.getTypeList(query)
  }

  @Get('options')
  @ApiOperation({ summary: '按字典编码批量获取下拉选项' })
  options(@Query() query: { codes?: string; code?: string }) {
    return this.dictService.getOptions(query.codes || query.code || '')
  }

  @Get('options/:code')
  @ApiOperation({ summary: '按字典编码获取下拉选项' })
  optionsByCode(@Param('code') code: string) {
    return this.dictService.getOptionsByCode(code)
  }

  @Post('type/create')
  @ApiOperation({ summary: '新增字典类型' })
  createType(@Body() dto: CreateDictTypeDto) {
    return this.dictService.createType(dto)
  }

  @Post('type/:id')
  @ApiOperation({ summary: '编辑字典类型' })
  updateType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDictTypeDto) {
    return this.dictService.updateType(id, dto)
  }

  @Post('type/:id/delete')
  @ApiOperation({ summary: '删除字典类型' })
  deleteType(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteType(id)
  }

  @Get('data/list')
  @ApiOperation({ summary: '获取字典项列表' })
  dataList(@Query() query: Record<string, string | undefined>) {
    return this.dictService.getDataList(query)
  }

  @Post('data/create')
  @ApiOperation({ summary: '新增字典项' })
  createData(@Body() dto: CreateDictDataDto) {
    return this.dictService.createData(dto)
  }

  @Post('data/:id')
  @ApiOperation({ summary: '编辑字典项' })
  updateData(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDictDataDto) {
    return this.dictService.updateData(id, dto)
  }

  @Post('data/:id/delete')
  @ApiOperation({ summary: '删除字典项' })
  deleteData(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteData(id)
  }
}
