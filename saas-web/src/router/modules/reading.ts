import { AppRouteRecord } from '@/types/router'

export const readingRoutes: AppRouteRecord = {
  path: '/reading',
  name: 'Reading',
  component: '/index/index',
  meta: {
    title: 'menus.reading.title',
    icon: 'ri:book-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'bookshelf',
      name: 'ReadingBookshelf',
      component: '/reading/bookshelf/index',
      meta: {
        title: 'menus.reading.bookshelf',
        icon: 'ri:bookshelf-line',
        keepAlive: true
      }
    },
    {
      path: 'books',
      name: 'ReadingBooks',
      component: '/reading/books/index',
      meta: {
        title: 'menus.reading.books',
        icon: 'ri:book-open-line',
        keepAlive: true,
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
        title: 'menus.reading.category',
        icon: 'ri:folder-2-line',
        keepAlive: true,
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
      meta: {
        title: 'menus.reading.comment',
        icon: 'ri:chat-3-line',
        keepAlive: true
      }
    },
    {
      path: 'crawler',
      name: 'ReadingCrawler',
      component: '/reading/crawler/index',
      meta: {
        title: 'menus.reading.crawler',
        icon: 'ri:download-cloud-2-line',
        keepAlive: true
      }
    },
    {
      path: 'chapters/:bookId',
      name: 'ReadingChapters',
      component: '/reading/chapters/index',
      meta: {
        title: '章节管理',
        isHide: true,
        isHideTab: false
      }
    }
  ]
}
