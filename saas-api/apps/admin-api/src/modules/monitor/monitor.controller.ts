import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { MonitorService } from './monitor.service'

@ApiTags('系统监控')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitor')
export class MonitorController {
  constructor(private readonly service: MonitorService) {}

  @Get('logs')
  @ApiOperation({ summary: '查询监控日志' })
  logs(@Query() query: Record<string, string | undefined>) {
    return this.service.getLogs(query)
  }

  @Get('logs/:id')
  @ApiOperation({ summary: '查询监控日志明细' })
  detail(@Param('id') id: string) {
    return this.service.getDetail(id)
  }

  @Get('stats')
  @ApiOperation({ summary: '监控统计概览' })
  stats(@Query() query: Record<string, string | undefined>) {
    return this.service.getStats(query)
  }
}
