import { AppRouteRecord } from '@/types/router'

const roles = ['R_SUPER', 'R_ADMIN']

export const foodRoutes: AppRouteRecord = {
  path: '/food',
  name: 'Food',
  component: '/index/index',
  meta: {
    title: '点餐管理',
    icon: 'ri:restaurant-line',
    roles
  },
  children: [
    {
      path: 'category',
      name: 'FoodCategory',
      component: '/food/category/index',
      meta: {
        title: '菜品分类',
        icon: 'ri:folder-2-line',
        keepAlive: true,
        roles,
        authList: [
          { title: '新增', authMark: 'add' },
          { title: '编辑', authMark: 'edit' },
          { title: '删除', authMark: 'delete' }
        ]
      }
    },
    {
      path: 'dishes',
      name: 'FoodDishes',
      component: '/food/dishes/index',
      meta: {
        title: '菜品管理',
        icon: 'ri:dish-line',
        keepAlive: true,
        roles,
        authList: [
          { title: '新增', authMark: 'add' },
          { title: '编辑', authMark: 'edit' },
          { title: '删除', authMark: 'delete' }
        ]
      }
    },
    {
      path: 'orders',
      name: 'FoodOrders',
      component: '/food/orders/index',
      meta: {
        title: '订单管理',
        icon: 'ri:file-list-3-line',
        keepAlive: true,
        roles,
        authList: [
          { title: '接单', authMark: 'accept' },
          { title: '完成', authMark: 'complete' },
          { title: '取消', authMark: 'cancel' }
        ]
      }
    }
  ]
}
