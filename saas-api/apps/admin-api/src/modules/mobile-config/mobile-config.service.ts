import { Injectable } from '@nestjs/common';
import { getRequiredTenantId } from '../../common/utils/helpers';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMobileConfigDto } from './dto/mobile-config.dto';

/** 可用的移动端业务模块定义 */
export const MOBILE_MODULES = [
  { key: 'carloan', name: '车抵贷', icon: 'car', desc: '业务进件 · 进度查询' },
  { key: 'food',    name: '点餐',   icon: 'bag', desc: '门店点餐 · 外卖配送' },
  { key: 'credit',  name: '征信查询', icon: 'file-text', desc: '在线查询 · 信用报告' },
  { key: 'reading', name: '读书',   icon: 'book', desc: '小说阅读 · 离线下载' },
] as const;

export type MobileModuleKey = (typeof MOBILE_MODULES)[number]['key'];

@Injectable()
export class MobileConfigService {
  constructor(private readonly prisma: PrismaService) {}

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

    // 校验模块 key 合法性
    const validKeys: string[] = MOBILE_MODULES.map((m) => m.key);
    const invalid = dto.mobileModules.filter((k) => !validKeys.includes(k));
    if (invalid.length) {
      throw new Error(`无效的模块 key: ${invalid.join(', ')}`);
    }

    // 如果只有一个模块，自动设为默认
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
}
