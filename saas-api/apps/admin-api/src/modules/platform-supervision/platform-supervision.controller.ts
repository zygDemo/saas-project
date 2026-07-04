import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PlatformSupervisionService } from './platform-supervision.service'

@ApiTags('平台监管')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('platform-supervision')
export class PlatformSupervisionController {
  constructor(private readonly service: PlatformSupervisionService) {}

  @Get('overview')
  @ApiOperation({ summary: '平台概览统计' })
  overview() {
    return this.service.getOverview()
  }

  @Get('tenant-application-stats')
  @ApiOperation({ summary: '各租户申请数量统计' })
  tenantApplicationStats() {
    return this.service.getTenantApplicationStats()
  }

  @Get('work-order-status-distribution')
  @ApiOperation({ summary: '工单状态分布' })
  workOrderStatusDistribution() {
    return this.service.getWorkOrderStatusDistribution()
  }

  @Get('package-usage-distribution')
  @ApiOperation({ summary: '套餐使用分布' })
  packageUsageDistribution() {
    return this.service.getPackageUsageDistribution()
  }
}
