import { AppRouteRecord } from '@/types/router'

const roles = ['R_SUPER', 'R_ADMIN']

export const readingRoutes: AppRouteRecord = {
  path: '/reading',
  name: 'Reading',
  component: '/index/index',
  meta: {
    title: '读书管理',
    icon: 'ri:book-3-line',
    roles
  },
  children: [
    {
      path: 'bookshelf',
      name: 'ReadingBookshelf',
      component: '/reading/bookshelf/index',
      meta: { title: '书架管理', icon: 'ri:book-2-line', keepAlive: true, roles }
    },
    {
      path: 'books',
      name: 'ReadingBooks',
      component: '/reading/books/index',
      meta: {
        title: '图书管理',
        icon: 'ri:book-open-line',
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
      path: 'category',
      name: 'ReadingCategory',
      component: '/reading/category/index',
      meta: {
        title: '分类管理',
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
      path: 'comment',
      name: 'ReadingComment',
      component: '/reading/comment/index',
      meta: { title: '评论管理', icon: 'ri:chat-3-line', keepAlive: true, roles }
    },
    {
      path: 'crawler',
      name: 'ReadingCrawler',
      component: '/reading/crawler/index',
      meta: { title: '小说爬取', icon: 'ri:download-cloud-2-line', keepAlive: true, roles }
    },
    {
      path: 'notes',
      name: 'ReadingNotes',
      component: '/reading/notes/index',
      meta: { title: '阅读笔记', icon: 'ri:sticky-note-line', keepAlive: true, roles }
    },
    {
      path: 'dashboard',
      name: 'ReadingDashboard',
      component: '/reading/dashboard/index',
      meta: { title: '阅读统计', icon: 'ri:bar-chart-2-line', keepAlive: true, roles }
    },
    {
      path: 'chapters/:bookId',
      name: 'ReadingChapters',
      component: '/reading/chapters/index',
      meta: {
        title: '章节管理',
        icon: 'ri:file-list-2-line',
        roles,
        isHide: true,
        isHideTab: false
      }
    }
  ]
}
