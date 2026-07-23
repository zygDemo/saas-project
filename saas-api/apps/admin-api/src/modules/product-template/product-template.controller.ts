
import { Body, Controller, Get, Param, Post, Query, UseGuards, Public } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { ProductTemplateService } from './product-template.service'
import { ProductTemplateQueryDto, CreateProductTemplateDto, UpdateProductTemplateDto } from './dto/product-template.dto'

@ApiTags('产品模板')
@Controller('product-template')
export class ProductTemplateController {
  constructor(private readonly service: ProductTemplateService) {}

  @Get('list')
  @Public()
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: ProductTemplateQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateProductTemplateDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateProductTemplateDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('R_SUPER', 'R_ADMIN')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
