import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PlatformSupervisionService } from './platform-supervision.service'
import { PlatformStatsQueryDto } from './dto/platform-supervision.dto'

@ApiTags('平台监管')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('platform-supervision')
export class PlatformSupervisionController {
  constructor(private readonly service: PlatformSupervisionService) {}

  @Get('stats')
  @ApiOperation({ summary: '平台监管列表（各机构业务统计）' })
  stats(@Query() query: PlatformStatsQueryDto) {
    return this.service.getStats(query)
  }

  @Get('overview')
  @ApiOperation({ summary: '平台概览统计' })
  overview() {
    return this.service.getOverview()
  }
}
