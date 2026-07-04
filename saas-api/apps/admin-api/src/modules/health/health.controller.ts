import { Public } from '../../common/decorators/public.decorator'
import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { HealthCheckResponseDto } from './dto/health.dto'

@ApiTags('健康检查')
@Public()
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '服务健康检查', description: '检查 API 服务是否正常运行，返回服务状态和时间戳' })
  @ApiResponse({ status: 200, description: '服务正常', type: HealthCheckResponseDto })
  check(): HealthCheckResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  }
}
