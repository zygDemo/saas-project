import request from '@/utils/http'

/** 获取数据库状态概览 */
export function getDbOpsStatus() {
  return request.get({ url: '/db-ops/status' })
}

/** 执行数据库迁移 */
export function runDbMigrate() {
  return request.post({ url: '/db-ops/migrate', timeout: 120000 })
}

/** 执行种子数据 */
export function runDbSeed() {
  return request.post({ url: '/db-ops/seed', timeout: 120000 })
}

/** 同步角色菜单权限 */
export function runDbSyncRoles() {
  return request.post({ url: '/db-ops/sync-roles', timeout: 120000 })
}

/** 一键全部执行 */
export function runDbOpsAll() {
  return request.post({ url: '/db-ops/run-all', timeout: 300000 })
}
