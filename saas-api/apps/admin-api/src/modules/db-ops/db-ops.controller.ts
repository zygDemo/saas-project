import { Controller, Get, Post, HttpCode, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { DbOpsService } from './db-ops.service'

@ApiTags('数据库运维')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('db-ops')
export class DbOpsController {
  constructor(private readonly dbOpsService: DbOpsService) {}

  @Get('status')
  async getStatus() {
    return this.dbOpsService.getStatus()
  }

  @Post('migrate')
  @HttpCode(200)
  async runMigrate() {
    const output = await this.dbOpsService.runMigrate()
    return { success: true, message: '数据库迁移完成', output }
  }

  @Post('seed')
  @HttpCode(200)
  async runSeed() {
    const output = await this.dbOpsService.runSeed()
    return { success: true, message: '种子数据执行完成', output }
  }

  @Post('sync-roles')
  @HttpCode(200)
  async runSyncRoles() {
    const output = await this.dbOpsService.runSyncRoles()
    return { success: true, message: '角色菜单同步完成', output }
  }

  @Post('run-all')
  @HttpCode(200)
  async runAll() {
    const results = await this.dbOpsService.runAll()
    return { success: true, message: '全部运维操作完成', results }
  }
}
