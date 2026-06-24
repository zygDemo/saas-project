import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { DataCenterService } from './data-center.service'
import { AuditLogQueryDto, AuditLogStatsDto, DateRangeQueryDto } from './dto/data-center.dto'

@ApiTags('数据中心')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('data-center')
export class DataCenterController {
  constructor(private readonly service: DataCenterService) {}

  @Get('stats')
  @ApiOperation({ summary: '数据统计总览' })
  stats(@Query() query: DateRangeQueryDto) {
    return this.service.getStats(query)
  }

  @Get('audit-logs')
  @ApiOperation({ summary: '日志审计列表' })
  auditLogs(@Query() query: AuditLogQueryDto) {
    return this.service.getAuditLogs(query)
  }

  @Get('audit-log/stats')
  @ApiOperation({ summary: '日志审计统计' })
  auditLogStats(@Query() query: AuditLogStatsDto) {
    return this.service.getAuditLogStats(query)
  }
}
