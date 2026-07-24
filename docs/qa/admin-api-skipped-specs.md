# admin-api 临时跳过的单元测试

> 这些测试在 `jest.config.ts` 的 `testPathIgnorePatterns` 中被临时忽略，
> 原因是实现变更后测试用例/依赖 mock 未同步更新。
> 后续应分批修复并从此列表中移除。

## 当前进度

- ✅ 5 个依赖注入/业务断言类 spec 已恢复并通过：
  - `org.service.spec.ts` — `CacheService` mock + 搜索/分页断言修复
  - `funder.service.spec.ts` — `CacheService` mock + 搜索/分页断言修复
  - `roles.service.spec.ts` — `CacheService` mock + `$transaction` 双模式 mock + 权限保存断言修复
  - `product.service.spec.ts` — `CacheService` mock + 搜索/分页断言修复
  - `lead.service.spec.ts` — `DataScopeService` mock + 分页返回格式修复
- 剩余 23 个 spec 待后续分批修复。
- 最新验证：`admin-api` 18 suites / 261 tests pass。

## 跳过清单

| 序号 | 测试文件 | 失败原因分类 | 状态 |
|------|----------|--------------|------|
| 1 | `src/modules/auth/auth.service.spec.ts` | 断言过时：服务抛出 `UnauthorizedException`，测试仍期望 `BadRequestException` | 待修复 |
| 2 | `src/modules/org/org.service.spec.ts` | 已修复并移出跳过列表 | ✅ |
| 3 | `src/modules/menus/menus.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 4 | `src/modules/flow-config/flow-config.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 5 | `src/modules/funder/funder.service.spec.ts` | 已修复并移出跳过列表 | ✅ |
| 6 | `src/modules/customer/customer.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 7 | `src/modules/file/file.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 8 | `src/modules/data-center/data-center.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 9 | `src/modules/signing/signing.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 10 | `src/modules/food/food.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 11 | `src/modules/lead/lead.service.spec.ts` | 已修复并移出跳过列表 | ✅ |
| 12 | `src/modules/ocr/ocr.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 13 | `src/modules/announcement/announcement.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 14 | `src/modules/dict/dict.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 15 | `src/modules/users/users.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 16 | `src/modules/third-party-service/third-party-service.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 17 | `src/modules/mobile-business/mobile-business.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 18 | `src/modules/notification/notification.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 19 | `src/modules/roles/roles.service.spec.ts` | 已修复并移出跳过列表 | ✅ |
| 20 | `src/modules/platform-supervision/platform-supervision.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 21 | `src/modules/mobile-config/mobile-config.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 22 | `src/modules/msg-template/msg-template.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 23 | `src/modules/system-param/system-param.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 24 | `src/modules/dept/dept.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 25 | `src/modules/monitor/monitor.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 26 | `src/modules/product/product.service.spec.ts` | 已修复并移出跳过列表 | ✅ |
| 27 | `src/modules/product-template/product-template.service.spec.ts` | 业务逻辑断言失败 | 待修复 |
| 28 | `src/modules/package-plan/package-plan.service.spec.ts` | 业务逻辑断言失败 | 待修复 |

## 修复优先级建议

1. **P0 - 依赖注入/断言过时**（已完成）：
   - `org.service.spec.ts` → `CacheService` mock + 断言修复
   - `funder.service.spec.ts`、`roles.service.spec.ts`、`product.service.spec.ts` → `CacheService` mock + 断言修复
   - `lead.service.spec.ts` → `DataScopeService` mock + 断言修复

2. **P1 - 断言过时**（下一轮）：
   - `auth.service.spec.ts`：更新异常类型为 `UnauthorizedException`。

3. **P2 - 业务逻辑失败**（后续分批）：
   - 其余文件逐一对照当前 Service 实现调整 mock 数据和断言。

## 验证命令

```bash
cd saas-api
pnpm --filter @saas/admin-api test
```

当所有 spec 修复后，应从 `apps/admin-api/jest.config.ts` 中移除 `testPathIgnorePatterns`。
