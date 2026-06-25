import { AppRouteRecord } from '@/types/router'
import { businessRoutes } from './business'
import { orgConfigRoutes } from './org-config'
import { operationCenterRoutes } from './operation-center'
import { dashboardRoutes } from './dashboard'
import { dataCenterRoutes } from './data-center'
import { templateRoutes } from './template'
import { widgetsRoutes } from './widgets'
import { examplesRoutes } from './examples'
import { systemRoutes } from './system'
import { articleRoutes } from './article'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'
import { safeguardRoutes } from './safeguard'
import { helpRoutes } from './help'
import { readingRoutes } from './reading'

/**
 * 导出所有模块化路由
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  businessRoutes,
  orgConfigRoutes,
  operationCenterRoutes,
  dataCenterRoutes,
  templateRoutes,
  widgetsRoutes,
  examplesRoutes,
  systemRoutes,
  articleRoutes,
  resultRoutes,
  exceptionRoutes,
  safeguardRoutes,
  readingRoutes,
  ...helpRoutes
]
