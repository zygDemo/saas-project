import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { SigningService } from './signing.service'
import { SigningQueryDto, CreateSigningDto, UpdateSigningDto } from './dto/signing.dto'

@ApiTags('签约管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('signing')
export class SigningController {
  constructor(private readonly service: SigningService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: SigningQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateSigningDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateSigningDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }

  @Post(':id/authorize-sign')
  @ApiOperation({ summary: '授权签署（一键签署）' })
  authorizeSign(@Param('id') id: string) {
    return this.service.authorizeSign(Number(id))
  }
}
