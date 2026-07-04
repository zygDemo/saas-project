import { Controller, Get, Post, HttpCode, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { DbOpsService } from './db-ops.service'
import { DbStatusResponseDto, DbOpsResultResponseDto, DbOpsRunAllResponseDto } from './dto/db-ops.dto'

@ApiTags('数据库运维')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('db-ops')
export class DbOpsController {
  constructor(private readonly dbOpsService: DbOpsService) {}

  @Get('status')
  @ApiOperation({ summary: '获取数据库状态', description: '获取数据库各表记录数和运维任务执行状态' })
  @ApiResponse({ status: 200, description: '数据库状态信息', type: DbStatusResponseDto })
  async getStatus(): Promise<DbStatusResponseDto> {
    return this.dbOpsService.getStatus()
  }

  @Post('migrate')
  @HttpCode(200)
  @ApiOperation({ summary: '执行数据库迁移', description: '执行 prisma migrate deploy 部署待迁移的数据库变更' })
  @ApiResponse({ status: 200, description: '迁移执行结果', type: DbOpsResultResponseDto })
  async runMigrate(): Promise<DbOpsResultResponseDto> {
    const output = await this.dbOpsService.runMigrate()
    return { success: true, message: '数据库迁移完成', output }
  }

  @Post('seed')
  @HttpCode(200)
  @ApiOperation({ summary: '执行种子数据', description: '执行 prisma/seed.ts 初始化基础数据' })
  @ApiResponse({ status: 200, description: '种子数据执行结果', type: DbOpsResultResponseDto })
  async runSeed(): Promise<DbOpsResultResponseDto> {
    const output = await this.dbOpsService.runSeed()
    return { success: true, message: '种子数据执行完成', output }
  }

  @Post('sync-roles')
  @HttpCode(200)
  @ApiOperation({ summary: '同步角色菜单', description: '执行角色菜单权限同步脚本' })
  @ApiResponse({ status: 200, description: '同步执行结果', type: DbOpsResultResponseDto })
  async runSyncRoles(): Promise<DbOpsResultResponseDto> {
    const output = await this.dbOpsService.runSyncRoles()
    return { success: true, message: '角色菜单同步完成', output }
  }

  @Post('run-all')
  @HttpCode(200)
  @ApiOperation({ summary: '一键全部执行', description: '依次执行 migrate → seed → sync-roles 三个运维操作' })
  @ApiResponse({ status: 200, description: '全部执行结果', type: DbOpsRunAllResponseDto })
  async runAll(): Promise<DbOpsRunAllResponseDto> {
    const results = await this.dbOpsService.runAll()
    return { success: true, message: '全部运维操作完成', results }
  }
}
