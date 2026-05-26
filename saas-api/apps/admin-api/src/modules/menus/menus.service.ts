import { Injectable } from '@nestjs/common'
import { Menu } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

type MenuWithPermissions = Menu & {
  permissions: Array<{ title: string; authMark: string }>
}

export interface AppRouteRecord {
  path: string
  name: string
  component: string
  meta: Record<string, unknown>
  children?: AppRouteRecord[]
}

@Injectable()
export class MenusService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenuTree(roleCodes: string[]): Promise<AppRouteRecord[]> {
    const menus = await this.prisma.menu.findMany({
      where: {
        roles: {
          some: {
            role: {
              code: { in: roleCodes },
              enabled: true
            }
          }
        }
      },
      include: {
        permissions: {
          where: {
            roles: {
              some: {
                role: {
                  code: { in: roleCodes }
                }
              }
            }
          },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: [{ sort: 'asc' }, { id: 'asc' }]
    })

    return buildTree(menus)
  }
}

function buildTree(menus: MenuWithPermissions[], parentId: number | null = null): AppRouteRecord[] {
  return menus
    .filter((menu) => menu.parentId === parentId)
    .map((menu) => {
      const children = buildTree(menus, menu.id)
      return {
        path: menu.path,
        name: menu.name,
        component: menu.component,
        meta: {
          title: menu.title,
          icon: menu.icon,
          keepAlive: menu.keepAlive,
          isHide: menu.hidden,
          isHideTab: menu.hiddenTab,
          link: menu.link,
          isIframe: menu.iframe,
          authList: menu.permissions.map((permission) => ({
            title: permission.title,
            authMark: permission.authMark
          }))
        },
        ...(children.length ? { children } : {})
      }
    })
}
