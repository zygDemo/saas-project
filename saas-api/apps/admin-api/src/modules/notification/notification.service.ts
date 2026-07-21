import { Injectable, Logger } from '@nestjs/common'
import { NotificationGateway } from './notification.gateway'

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

  constructor(private readonly gateway: NotificationGateway) {}

  /**
   * 推送通知给指定用户
   */
  pushToUser(userId: number, notification: Omit<PushNotification, 'userId'>) {
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

  /**
   * 推送通知给指定租户所有在线用户
   */
  pushToTenant(tenantId: number, notification: Omit<PushNotification, 'tenantId'>) {
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

  /**
   * 推送公告给指定租户
   */
  pushAnnouncement(tenantId: number, announcement: { id: number; title: string; content: string }) {
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

  /**
   * 推送审批状态变更
   */
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

  /**
   * 推送补件通知
   */
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

  /**
   * 推送签约通知
   */
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

  /**
   * 推送放款通知
   */
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

  /**
   * 获取在线用户统计
   */
  getOnlineStats() {
    return this.gateway.getOnlineStats()
  }
}
