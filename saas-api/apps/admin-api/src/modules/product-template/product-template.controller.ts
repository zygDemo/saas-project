import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ProductTemplateService } from './product-template.service'
import { ProductTemplateQueryDto, CreateProductTemplateDto, UpdateProductTemplateDto } from './dto/product-template.dto'

@ApiTags('产品模板')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('product-template')
export class ProductTemplateController {
  constructor(private readonly service: ProductTemplateService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: ProductTemplateQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateProductTemplateDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateProductTemplateDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
