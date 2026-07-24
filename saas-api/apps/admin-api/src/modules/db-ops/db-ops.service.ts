import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common'
import { execSync } from 'child_process'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DbOpsService {
  private readonly logger = new Logger(DbOpsService.name)
  private running = false

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取数据库状态概览
   */
  async getStatus() {
    const userCount = await this.prisma.user.count()
    const roleCount = await this.prisma.role.count()
    const menuCount = await this.prisma.menu.count()

    return {
      users: userCount,
      roles: roleCount,
      menus: menuCount,
      running: this.running
    }
  }

  /**
   * 执行数据库迁移 (prisma migrate deploy)
   */
  async runMigrate(): Promise<string> {
    return this.execCommand('migrate', 'npx prisma migrate deploy --schema prisma/schema.prisma')
  }

  /**
   * 执行种子数据 (prisma/seed.ts)
   */
  async runSeed(): Promise<string> {
    return this.execCommand('seed', 'npx tsx prisma/scripts/seed.ts')
  }

  /**
   * 同步角色菜单权限 (prisma/migrate-roles-menus.ts)
   */
  async runSyncRoles(): Promise<string> {
    return this.execCommand('sync-roles', 'npx tsx prisma/scripts/migrate-roles-menus.ts')
  }

  /**
   * 一键全部执行：migrate → seed → sync-roles
   */
  async runAll(): Promise<{ migrate: string; seed: string; syncRoles: string }> {
    this.checkRunning()
    this.running = true

    const results: { migrate: string; seed: string; syncRoles: string } = {
      migrate: '',
      seed: '',
      syncRoles: ''
    }

    try {
      this.logger.log('[1/3] 执行 migrate deploy...')
      results.migrate = this.runSync('npx prisma migrate deploy --schema prisma/schema.prisma')
    } catch (e: unknown) {
      this.running = false
      throw new InternalServerErrorException('migrate 失败: ' + (e instanceof Error ? e.message : String(e)))
    }

    try {
      this.logger.log('[2/3] 执行 seed...')
      results.seed = this.runSync('npx tsx prisma/scripts/seed.ts')
    } catch (e: unknown) {
      this.running = false
      throw new InternalServerErrorException('seed 失败: ' + (e instanceof Error ? e.message : String(e)))
    }

    try {
      this.logger.log('[3/3] 同步角色菜单...')
      results.syncRoles = this.runSync('npx tsx prisma/scripts/migrate-roles-menus.ts')
    } catch (e: unknown) {
      this.running = false
      throw new InternalServerErrorException('角色菜单同步失败: ' + (e instanceof Error ? e.message : String(e)))
    }

    this.running = false
    this.logger.log('全部运维操作完成')
    return results
  }

  /**
   * 通用命令执行
   */
  private async execCommand(name: string, command: string): Promise<string> {
    this.checkRunning()
    this.running = true
    try {
      this.logger.log(`开始执行 ${name}...`)
      const output = this.runSync(command)
      this.logger.log(`${name} 完成`)
      return output
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      this.logger.error(`${name} 失败: ${errorMsg}`)
      throw new InternalServerErrorException(`${name} 失败: ${errorMsg}`)
    } finally {
      this.running = false
    }
  }

  /**
   * 同步执行命令并返回输出
   */
  private runSync(command: string): string {
    const cwd = this.getCwd()
    try {
      const output = execSync(command, {
        cwd,
        timeout: 120000,
        env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' },
        stdio: ['pipe', 'pipe', 'pipe']
      })
      return String(output).trim()
    } catch (e: unknown) {
      const execError = e as { stderr?: Buffer; stdout?: Buffer; message?: string }
      const stderr = execError.stderr ? execError.stderr.toString().trim() : ''
      const stdout = execError.stdout ? execError.stdout.toString().trim() : ''
      const detail = stderr || stdout || (execError.message ?? String(e))
      this.logger.error(`命令执行失败 [${command}]: ${detail}`)
      throw new Error(detail)
    }
  }

  private getCwd(): string {
    // pnpm 启动时 cwd 已经是 saas-api/apps/admin-api
    return process.cwd()
  }

  private checkRunning() {
    if (this.running) {
      throw new Error('有运维任务正在执行，请稍后再试')
    }
  }
}
