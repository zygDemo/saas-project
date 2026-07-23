
import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { DictService } from './dict.service'
import { CreateDictDataDto, CreateDictTypeDto, UpdateDictDataDto, UpdateDictTypeDto, DictDataQueryDto } from './dto/dict.dto'
@ApiTags('字典管理')
@Controller('dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}
  @Get('type/list')
  @Public()
  @ApiOperation({ summary: '获取字典类型列表' })
  typeList(@Query() query: Record<string, string | undefined>) {
    return this.dictService.getTypeList(query)
  }
  @Get('options')
  @Public()
  @ApiOperation({ summary: '按字典编码批量获取下拉选项' })
  options(@Query() query: { codes?: string; code?: string }) {
    return this.dictService.getOptions(query.codes || query.code || '')
  }
  @Get('options/:code')
  @Public()
  @ApiOperation({ summary: '按字典编码获取下拉选项' })
  optionsByCode(@Param('code') code: string) {
    return this.dictService.getOptionsByCode(code)
  }
  @Post('type/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '新增字典类型' })
  createType(@Body() dto: CreateDictTypeDto) {
    return this.dictService.createType(dto)
  }
  @Post('type/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑字典类型' })
  updateType(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDictTypeDto) {
    return this.dictService.updateType(id, dto)
  }
  @Post('type/:id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除字典类型' })
  deleteType(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteType(id)
  }
  @Get('data/list')
  @Public()
  @ApiOperation({ summary: '获取字典项列表' })
  dataList(@Query() query: DictDataQueryDto) {
    return this.dictService.getDataList(query)
  }
  @Post('data/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '新增字典项' })
  createData(@Body() dto: CreateDictDataDto) {
    return this.dictService.createData(dto)
  }
  @Post('data/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑字典项' })
  updateData(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDictDataDto) {
    return this.dictService.updateData(id, dto)
  }
  @Post('data/:id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除字典项' })
  deleteData(@Param('id', ParseIntPipe) id: number) {
    return this.dictService.deleteData(id)
  }
}
