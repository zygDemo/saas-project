import { Injectable, NotFoundException } from '@nestjs/common';
import { getRequiredTenantId } from '../../common/utils/helpers';
import { PrismaService } from '../prisma/prisma.service';
import { SaveEntityMobileConfigDto, UpdateMobileConfigDto } from './dto/mobile-config.dto';

/** 可用的移动端业务模块定义 */
export const MOBILE_MODULES = [
  { key: 'carloan', name: '车抵贷', icon: 'car', desc: '业务进件 · 进度查询' },
  { key: 'food', name: '点餐', icon: 'bag', desc: '门店点餐 · 外卖配送' },
  { key: 'credit', name: '征信查询', icon: 'file-text', desc: '在线查询 · 信用报告' },
  { key: 'reading', name: '读书', icon: 'book', desc: '小说阅读 · 离线下载' },
] as const;

export type MobileModuleKey = (typeof MOBILE_MODULES)[number]['key'];

@Injectable()
export class MobileConfigService {
  constructor(private readonly prisma: PrismaService) {}

  // ───── 租户级配置（现有逻辑） ─────

  /** 获取当前租户的移动端模块配置 */
  async getConfig(tenantId?: number) {
    const tid = tenantId ?? getRequiredTenantId();
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tid },
      select: { mobileModules: true, defaultMobileModule: true },
    });

    const enabled = (tenant?.mobileModules as string[]) ?? [];
    return {
      available: MOBILE_MODULES,
      enabled,
      defaultModule: tenant?.defaultMobileModule ?? null,
      isMultiModule: enabled.length > 1,
    };
  }

  /** 更新当前租户的移动端模块配置 */
  async updateConfig(dto: UpdateMobileConfigDto, tenantId?: number) {
    const tid = tenantId ?? getRequiredTenantId();
    this.validateModuleKeys(dto.mobileModules);

    const defaultModule =
      dto.mobileModules.length === 1
        ? dto.mobileModules[0]
        : dto.defaultMobileModule ?? null;

    await this.prisma.tenant.update({
      where: { id: tid },
      data: {
        mobileModules: dto.mobileModules,
        defaultMobileModule: defaultModule,
      },
    });

    return this.getConfig(tid);
  }

  // ───── 用户级配置（最高优先级） ─────

  /** 获取指定用户的移动端模块配置（包含角色信息，供管理端编辑使用） */
  async getUserConfig(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mobileModules: true, mobileMultiModule: true, roles: { select: { roleId: true, role: { select: { name: true } } } } },
    });
    if (!user) throw new NotFoundException('用户不存在');

    const enabled = (user.mobileModules as string[]) ?? [];
    return {
      available: MOBILE_MODULES,
      enabled,
      defaultModule: enabled.length === 1 ? enabled[0] : null,
      mobileMultiModule: user.mobileMultiModule ?? false,
      isMultiModule: enabled.length > 1,
      roles: user.roles.map(r => ({ roleId: r.roleId, roleName: r.role.name })),
    };
  }

  /** 更新指定用户的移动端模块配置 */
  async updateUserConfig(userId: number, dto: SaveEntityMobileConfigDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    if (dto.mobileModules) this.validateModuleKeys(dto.mobileModules);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.mobileModules !== undefined ? { mobileModules: dto.mobileModules } : {}),
        ...(dto.mobileMultiModule !== undefined ? { mobileMultiModule: dto.mobileMultiModule } : {}),
      },
    });

    return this.getUserConfig(userId);
  }

  /** 清除用户级配置（恢复使用角色/租户配置） */
  async resetUserConfig(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mobileModules: null, mobileMultiModule: false },
    });
    return this.getUserConfig(userId);
  }

  // ───── 角色级配置 ─────

  /** 获取指定角色的移动端模块配置 */
  async getRoleConfig(roleId: number) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { name: true, mobileModules: true, mobileMultiModule: true },
    });
    if (!role) throw new NotFoundException('角色不存在');

    const enabled = (role.mobileModules as string[]) ?? [];
    return {
      available: MOBILE_MODULES,
      enabled,
      defaultModule: enabled.length === 1 ? enabled[0] : null,
      mobileMultiModule: role.mobileMultiModule ?? false,
      isMultiModule: enabled.length > 1,
      roleName: role.name,
    };
  }

  /** 更新指定角色的移动端模块配置 */
  async updateRoleConfig(roleId: number, dto: SaveEntityMobileConfigDto) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('角色不存在');

    if (dto.mobileModules) this.validateModuleKeys(dto.mobileModules);

    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...(dto.mobileModules !== undefined ? { mobileModules: dto.mobileModules } : {}),
        ...(dto.mobileMultiModule !== undefined ? { mobileMultiModule: dto.mobileMultiModule } : {}),
      },
    });

    return this.getRoleConfig(roleId);
  }

  /** 清除角色级配置（恢复使用租户配置） */
  async resetRoleConfig(roleId: number) {
    await this.prisma.role.update({
      where: { id: roleId },
      data: { mobileModules: null, mobileMultiModule: false },
    });
    return this.getRoleConfig(roleId);
  }

  // ───── 移动端解析逻辑（用户 → 角色 → 租户） ─────

  /**
   * 移动端 APP 调用的配置接口
   * 优先级：用户级 > 角色级 > 租户级
   * 
   * 规则：
   * - 如果当前用户配置了 mobileMultiModule = true → 多模块模式，显示勾选的模块
   * - 如果用户级只有一个模块或 mobileMultiModule = false → 单模块模式
   * - 如果用户没有配置 → 看用户的角色（取第一个角色的配置）
   * - 如果角色也没有配置 → 看租户配置
   */
  async getResolvedConfig(userId: number, tenantId?: number) {
    const tid = tenantId ?? getRequiredTenantId();

    // 1. 查用户级配置
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        mobileModules: true,
        mobileMultiModule: true,
        roles: { select: { roleId: true }, orderBy: { roleId: 'asc' }, take: 1 },
      },
    });

    if (!user) throw new NotFoundException('用户不存在');

    // 用户级配置（明确设置过）
    const userModules = user.mobileModules as string[] | null;
    if (userModules && userModules.length > 0) {
      return this.buildResolved(userModules, user.mobileMultiModule ?? false);
    }

    // 2. 查角色级配置（取第一个角色）
    const firstRoleId = user.roles[0]?.roleId;
    if (firstRoleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: firstRoleId },
        select: { mobileModules: true, mobileMultiModule: true },
      });
      const roleModules = role?.mobileModules as string[] | null;
      if (roleModules && roleModules.length > 0) {
        return this.buildResolved(roleModules, role?.mobileMultiModule ?? false);
      }
    }

    // 3. 回退到租户级配置
    return this.getConfig(tid);
  }

  // ───── 辅助方法 ─────

  private buildResolved(modules: string[], multiModule: boolean) {
    const enabled = multiModule ? modules : [modules[0]];
    return {
      available: MOBILE_MODULES,
      enabled,
      defaultModule: enabled[0] ?? null,
      isMultiModule: multiModule && enabled.length > 1,
    };
  }

  private validateModuleKeys(keys: string[]) {
    const validKeys: string[] = MOBILE_MODULES.map((m) => m.key);
    const invalid = keys.filter((k) => !validKeys.includes(k));
    if (invalid.length) {
      throw new Error(`无效的模块 key: ${invalid.join(', ')}`);
    }
  }
}
