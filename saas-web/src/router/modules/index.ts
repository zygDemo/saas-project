import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { platformRoutes } from './platform'
import { orgConfigRoutes } from './org-config'
import { dataCenterRoutes } from './data-center'
import { systemRoutes } from './system'
import { operationCenterRoutes } from './operation-center'
import { readingRoutes } from './reading'
import { foodRoutes } from './food'
import { businessRoutes } from './business'

/**
 * 默认菜单路由
 * 与 prisma/seed.ts、prisma/migrate-roles-menus.ts 保持一致：
 * 仪表盘 / 平台管理 / 机构配置 / 数据中心 / 系统管理 / 运营中心 / 读书管理 / 车贷业务
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  platformRoutes,
  orgConfigRoutes,
  dataCenterRoutes,
  systemRoutes,
  operationCenterRoutes,
  readingRoutes,
  foodRoutes,
  businessRoutes
]
