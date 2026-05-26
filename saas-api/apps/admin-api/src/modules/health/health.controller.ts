import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '服务健康检查', description: '检查 API 服务是否正常运行，返回服务状态和时间戳' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  }
}
