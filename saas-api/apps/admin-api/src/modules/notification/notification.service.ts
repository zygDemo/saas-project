import { Injectable, Logger } from '@nestjs/common'
import { toPaginatedResponse } from '@saas/shared'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationGateway } from './notification.gateway'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'

export type NotificationType =
  | 'announcement'   // 公告
  | 'approval'       // 审批
  | 'supplement'     // 补件
  | 'signing'        // 签约
  | 'loan'           // 放款
  | 'order'          // 订单
  | 'system'         // 系统

export interface PushNotification {
  type: NotificationType
  title: string
  content: string
  /** 目标用户ID，不传则推送给整个租户 */
  userId?: number
  /** 目标租户ID，不传则从 context 获取 */
  tenantId?: number
  /** 附加数据（如订单ID、跳转链接等） */
  extra?: Record<string, unknown>
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(
    private readonly gateway: NotificationGateway,
    private readonly prisma: PrismaService
  ) {}

  /** 持久化通知到数据库 */
  private async persist(tenantId: number, notification: { type: string; title: string; content: string; userId?: number; extra?: Record<string, unknown> }) {
    try {
      await this.prisma.notificationLog.create({
        data: {
          tenantId,
          userId: notification.userId ?? null,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          extra: notification.extra ?? undefined,
        }
      })
    } catch (err) {
      this.logger.warn(`通知持久化失败: ${(err as Error).message}`)
    }
  }

  /** 推送通知给指定用户 */
  async pushToUser(userId: number, notification: Omit<PushNotification, 'userId'>) {
    const tenantId = notification.tenantId ?? getCurrentTenantId()
    if (tenantId) {
      await this.persist(tenantId, { ...notification, userId })
    }
    try {
      this.gateway.emitToUser(userId, 'notification', {
        type: notification.type,
        title: notification.title,
        content: notification.content,
        extra: notification.extra,
      })
      this.logger.debug(`推送通知 → user:${userId} [${notification.type}] ${notification.title}`)
    } catch (err) {
      this.logger.warn(`推送失败 → user:${userId}: ${(err as Error).message}`)
    }
  }

  /** 推送通知给指定租户所有在线用户 */
  async pushToTenant(tenantId: number, notification: Omit<PushNotification, 'tenantId'>) {
    await this.persist(tenantId, notification)
    try {
      this.gateway.emitToTenant(tenantId, 'notification', {
        type: notification.type,
        title: notification.title,
        content: notification.content,
        userId: notification.userId,
        extra: notification.extra,
      })
      this.logger.debug(`推送通知 → tenant:${tenantId} [${notification.type}] ${notification.title}`)
    } catch (err) {
      this.logger.warn(`推送失败 → tenant:${tenantId}: ${(err as Error).message}`)
    }
  }

  /** 推送公告给指定租户 */
  async pushAnnouncement(tenantId: number, announcement: { id: number; title: string; content: string }) {
    await this.persist(tenantId, {
      type: 'announcement',
      title: announcement.title,
      content: announcement.content,
      extra: { announcementId: announcement.id },
    })
    try {
      this.gateway.emitToTenant(tenantId, 'announcement', {
        type: 'announcement',
        title: announcement.title,
        content: announcement.content,
        extra: { announcementId: announcement.id },
      })
      this.logger.debug(`推送公告 → tenant:${tenantId}: ${announcement.title}`)
    } catch (err) {
      this.logger.warn(`推送公告失败 → tenant:${tenantId}: ${(err as Error).message}`)
    }
  }

  /** 推送审批状态变更 */
  pushApprovalStatus(
    userId: number,
    data: { applicationId: number; status: string; title: string },
  ) {
    this.pushToUser(userId, {
      type: 'approval',
      title: data.title,
      content: `进件 #${data.applicationId} 状态变更为: ${data.status}`,
      extra: { applicationId: data.applicationId, status: data.status },
    })
  }

  /** 推送补件通知 */
  pushSupplement(
    userId: number,
    data: { applicationId: number; title: string },
  ) {
    this.pushToUser(userId, {
      type: 'supplement',
      title: data.title,
      content: `进件 #${data.applicationId} 需要补充材料`,
      extra: { applicationId: data.applicationId },
    })
  }

  /** 推送签约通知 */
  pushSigning(
    userId: number,
    data: { applicationId: number; title: string },
  ) {
    this.pushToUser(userId, {
      type: 'signing',
      title: data.title,
      content: `进件 #${data.applicationId} 签约状态更新`,
      extra: { applicationId: data.applicationId },
    })
  }

  /** 推送放款通知 */
  pushLoan(
    userId: number,
    data: { applicationId: number; amount: number },
  ) {
    this.pushToUser(userId, {
      type: 'loan',
      title: '放款完成',
      content: `进件 #${data.applicationId} 已放款 ¥${data.amount.toLocaleString()}`,
      extra: { applicationId: data.applicationId, amount: data.amount },
    })
  }

  /** 获取通知列表（分页） */
  async getNotifications(userId: number, query?: { current?: number; size?: number }) {
    const current = Math.max(Number(query?.current ?? 1) || 1, 1)
    const size = Math.min(Math.max(Number(query?.size ?? 20) || 20, 1), 100)
    const tenantId = getCurrentTenantId()
    const where = { tenantId: tenantId!, userId }
    const [records, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        skip: (current - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.notificationLog.count({ where })
    ])
    return toPaginatedResponse(records, total, { page: current, pageSize: size })
  }

  /** 管理端：获取通知日志列表（分页，带筛选） */
  async getNotificationLogs(query: {
    current?: number
    size?: number
    type?: string
    userId?: number
    startTime?: string
    endTime?: string
  }) {
    const current = Math.max(Number(query?.current ?? 1) || 1, 1)
    const size = Math.min(Math.max(Number(query?.size ?? 20) || 20, 1), 100)
    const tenantId = getCurrentTenantId()
    const where: Record<string, unknown> = { tenantId: tenantId! }
    if (query?.type) where.type = query.type
    if (query?.userId) where.userId = Number(query.userId)
    if (query?.startTime || query?.endTime) {
      const createdAt: Record<string, Date> = {}
      if (query?.startTime) createdAt.gte = new Date(query.startTime)
      if (query?.endTime) createdAt.lte = new Date(query.endTime)
      where.createdAt = createdAt
    }
    const [records, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where,
        skip: (current - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, userName: true, nickName: true } }
        }
      }),
      this.prisma.notificationLog.count({ where })
    ])
    return toPaginatedResponse(records, total, { page: current, pageSize: size })
  }

  /** 标记通知为已读 */
  async markAsRead(id: number, userId: number) {
    const tenantId = getCurrentTenantId()
    return this.prisma.notificationLog.update({
      where: { id, tenantId: tenantId!, userId },
      data: { readAt: new Date() }
    })
  }

  /** 全部标记已读 */
  async markAllAsRead(userId: number) {
    const tenantId = getCurrentTenantId()
    return this.prisma.notificationLog.updateMany({
      where: { tenantId: tenantId!, userId, readAt: null },
      data: { readAt: new Date() }
    })
  }

  /** 获取未读通知数量 */
  async getUnreadCount(userId: number) {
    const tenantId = getCurrentTenantId()
    return this.prisma.notificationLog.count({
      where: { tenantId: tenantId!, userId, readAt: null }
    })
  }

  /** 获取在线用户统计 */
  getOnlineStats() {
    return this.gateway.getOnlineStats()
  }
}
