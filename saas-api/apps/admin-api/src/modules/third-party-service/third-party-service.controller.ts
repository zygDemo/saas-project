import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ThirdPartyServiceService } from './third-party-service.service'
import { ThirdPartyServiceQueryDto, CreateThirdPartyServiceDto, UpdateThirdPartyServiceDto } from './dto/third-party-service.dto'

@ApiTags('第三方服务管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('third-party-service')
export class ThirdPartyServiceController {
  constructor(private readonly service: ThirdPartyServiceService) {}

  @Get('list')
  @ApiOperation({ summary: '列表查询' })
  list(@Query() query: ThirdPartyServiceQueryDto) {
    return this.service.getList(query)
  }

  @Get(':id')
  @ApiOperation({ summary: '详情' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(Number(id))
  }

  @Post()
  @ApiOperation({ summary: '新增' })
  create(@Body() dto: CreateThirdPartyServiceDto) {
    return this.service.create(dto)
  }

  @Post(':id')
  @ApiOperation({ summary: '编辑' })
  update(@Param('id') id: string, @Body() dto: UpdateThirdPartyServiceDto) {
    return this.service.update(Number(id), dto)
  }

  @Post(':id/delete')
  @ApiOperation({ summary: '删除' })
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id))
  }
}
