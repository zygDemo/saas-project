import type { AppRouteRecord } from '@/types/router'
import { useUserStore } from '@/store/modules/user'
import { useAppMode } from '@/hooks/core/useAppMode'
import { fetchGetMenuList } from '@/api/system-manage'
import { asyncRoutes } from '../routes/asyncRoutes'
import { RoutesAlias } from '../routesAlias'
import { formatMenuTitle } from '@/utils'

export class MenuProcessor {
  async getMenuList(): Promise<AppRouteRecord[]> {
    const { isFrontendMode } = useAppMode()
    const menuList = isFrontendMode.value
      ? await this.processFrontendMenu()
      : await this.processBackendMenu()

    return this.processMenuList(menuList)
  }

  /**
   * 获取完整路由列表（包含隐藏路由，用于路由注册和权限验证）
   */
  async getFullRouteList(): Promise<AppRouteRecord[]> {
    const { isFrontendMode } = useAppMode()
    const menuList = isFrontendMode.value
      ? await this.processFrontendMenu()
      : await this.processBackendMenu()

    return this.processRouteList(menuList)
  }

  processMenuList(menuList: AppRouteRecord[]): AppRouteRecord[] {
    const visibleMenuList = this.filterHiddenMenus(menuList)
    const filteredMenuList = this.filterEmptyMenus(visibleMenuList)
    this.validateMenuPaths(filteredMenuList)
    return this.normalizeMenuPaths(filteredMenuList)
  }

  /**
   * 处理路由列表（不过滤隐藏路由，保留 isHide 的路由用于注册）
   */
  processRouteList(menuList: AppRouteRecord[]): AppRouteRecord[] {
    const filteredMenuList = this.filterEmptyMenus(menuList)
    this.validateMenuPaths(filteredMenuList)
    return this.normalizeMenuPaths(filteredMenuList)
  }

  private async processFrontendMenu(): Promise<AppRouteRecord[]> {
    const userStore = useUserStore()
    const roles = userStore.info?.roles

    let menuList = [...asyncRoutes]

    if (roles && roles.length > 0) {
      menuList = this.filterMenuByRoles(menuList, roles)
    }

    return menuList
  }

  private async processBackendMenu(): Promise<AppRouteRecord[]> {
    return fetchGetMenuList()
  }

  private filterHiddenMenus(menuList: AppRouteRecord[]): AppRouteRecord[] {
    return menuList
      .filter((item) => !item.meta?.isHide)
      .map((item) => ({
        ...item,
        children: item.children?.length ? this.filterHiddenMenus(item.children) : item.children
      }))
  }

  private filterMenuByRoles(menu: AppRouteRecord[], roles: string[]): AppRouteRecord[] {
    return menu.reduce((acc: AppRouteRecord[], item) => {
      const itemRoles = item.meta?.roles
      const hasPermission = !itemRoles || itemRoles.some((role) => roles?.includes(role))

      if (hasPermission) {
        const filteredItem = { ...item }
        if (filteredItem.children?.length) {
          filteredItem.children = this.filterMenuByRoles(filteredItem.children, roles)
        }
        acc.push(filteredItem)
      }

      return acc
    }, [])
  }

  private filterEmptyMenus(menuList: AppRouteRecord[]): AppRouteRecord[] {
    return menuList
      .map((item) => {
        if (item.children && item.children.length > 0) {
          const filteredChildren = this.filterEmptyMenus(item.children)
          return {
            ...item,
            children: filteredChildren
          }
        }
        return item
      })
      .filter((item) => {
        if ('children' in item) {
          return true
        }

        if (item.meta?.isIframe === true || item.meta?.link) {
          return true
        }

        if (item.component && item.component !== RoutesAlias.Layout) {
          return true
        }

        return Boolean(item.path?.trim())
      })
  }

  validateMenuList(menuList: AppRouteRecord[]): boolean {
    return Array.isArray(menuList) && menuList.length > 0
  }

  private normalizeMenuPaths(menuList: AppRouteRecord[], parentPath = ''): AppRouteRecord[] {
    return menuList.map((item) => {
      const fullPath = this.buildFullPath(item.path || '', parentPath)
      const children = item.children?.length
        ? this.normalizeMenuPaths(item.children, fullPath)
        : item.children
      const redirect = item.redirect || this.resolveDefaultRedirect(children)

      return {
        ...item,
        path: fullPath,
        redirect,
        children
      }
    })
  }

  private resolveDefaultRedirect(children?: AppRouteRecord[]): string | undefined {
    if (!children?.length) {
      return undefined
    }

    for (const child of children) {
      if (this.isNavigableRoute(child)) {
        return child.path
      }

      const nestedRedirect = this.resolveDefaultRedirect(child.children)
      if (nestedRedirect) {
        return nestedRedirect
      }
    }

    return undefined
  }

  private isNavigableRoute(route: AppRouteRecord): boolean {
    return Boolean(
      route.path &&
        route.path !== '/' &&
        !route.meta?.link &&
        route.meta?.isIframe !== true &&
        route.component &&
        route.component !== ''
    )
  }

  private validateMenuPaths(menuList: AppRouteRecord[], level = 1): void {
    menuList.forEach((route) => {
      if (!route.children?.length) return

      const parentName = String(route.name || route.path || 'unknown route')

      route.children.forEach((child) => {
        const childPath = child.path || ''

        if (this.isValidAbsolutePath(childPath)) return

        if (childPath.startsWith('/')) {
          this.logPathError(child, childPath, parentName, level)
        }
      })

      this.validateMenuPaths(route.children, level + 1)
    })
  }

  private isValidAbsolutePath(path: string): boolean {
    return (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('/outside/iframe/')
    )
  }

  private logPathError(
    route: AppRouteRecord,
    path: string,
    parentName: string,
    level: number
  ): void {
    const routeName = String(route.name || path || 'unknown route')
    const menuTitle = route.meta?.title || routeName
    const suggestedPath = path.split('/').pop() || path.slice(1)

    console.error(
      `[Route config error] Menu "${formatMenuTitle(String(menuTitle))}" (name: ${routeName}, path: ${path}) is invalid\n` +
        `  Location: ${parentName} > ${routeName}\n` +
        `  Problem: level ${level + 1} menu path cannot start with /\n` +
        `  Current: path: '${path}'\n` +
        `  Suggested: path: '${suggestedPath}'`
    )
  }

  private buildFullPath(path: string, parentPath: string): string {
    if (!path) return ''

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    if (path.startsWith('/')) {
      return path
    }

    if (parentPath) {
      const cleanParent = parentPath.replace(/\/$/, '')
      const cleanChild = path.replace(/^\//, '')
      return `${cleanParent}/${cleanChild}`
    }

    return `/${path}`
  }
}
