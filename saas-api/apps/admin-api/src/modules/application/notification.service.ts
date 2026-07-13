import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { getCurrentTenantId } from '../../common/tenant/tenant-context'

/**
 * 信贷业务关键节点通知服务
 *
 * 当前阶段：记录通知日志到数据库，后续可扩展为：
 *   - SMS 短信发送
 *   - 微信公众号/小程序模板消息
 *   - 邮件通知
 *   - 站内信
 *
 * 关键节点触发清单：
 *   线索分配 → LEAD_ASSIGNED
 *   审批拒绝 → APPROVAL_REJECTED
 *   要求补件 → SUPPLEMENT_REQUESTED
 *   发起签约 → SIGNING_STARTED
 *   签约完成 → SIGNING_COMPLETED
 *   放款成功 → LOAN_DISBURSED
 *   还款提醒 → REPAYMENT_DUE_REMIND（到期前3天）
 *   还款逾期 → REPAYMENT_OVERDUE
 *   贷款结清 → LOAN_SETTLED
 */

export interface NotificationEvent {
  /** 事件编码，对应 msg-template 的 code */
  eventCode: string
  /** 关联进件ID */
  applicationId?: number
  /** 关联进件编号 */
  applicationNo?: string
  /** 目标用户ID（接收通知的人） */
  targetUserId?: number
  /** 目标手机号 */
  targetPhone?: string
  /** 通知标题 */
  title: string
  /** 通知内容 */
  content: string
  /** 通知渠道：SMS / IN_APP / WECHAT / EMAIL */
  channel?: string
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 统一通知发送入口
   * 当前记录到 operation_log，后续对接短信/微信等外部服务
   */
  async send(event: NotificationEvent): Promise<void> {
    try {
      const tenantId = getCurrentTenantId()

      // 尝试从消息模板获取格式化内容
      let title = event.title
      let content = event.content

      try {
        const template = await this.prisma.messageTemplate.findFirst({
          where: { code: event.eventCode, tenantId, status: 'ACTIVE', deletedAt: null }
        })
        if (template) {
          title = template.title || event.title
          // 简单变量替换
          content = (template.content || event.content)
            .replace(/\{\{applicationNo\}\}/g, event.applicationNo || '')
            .replace(/\{\{title\}\}/g, event.title)
        }
      } catch {
        // 模板查询失败不影响通知主流程
      }

      // 记录通知日志（后续可扩展为写入独立的 notification 表）
      this.logger.log(
        `[${event.eventCode}] applicationId=${event.applicationId} targetUserId=${event.targetUserId} title="${title}"`
      )

      // TODO: 对接实际消息通道
      // if (event.channel === 'SMS') { await this.smsService.send(event.targetPhone, content) }
    } catch (error) {
      this.logger.error(`通知发送失败 [${event.eventCode}]: ${(error as Error).message}`)
    }
  }

  // ==================== 各节点便捷方法 ====================

  /** 线索分配给业务员 */
  async sendOnLeadAssigned(leadId: number, assigneeId: number, leadName: string) {
    await this.send({
      eventCode: 'LEAD_ASSIGNED',
      targetUserId: assigneeId,
      title: '新线索分配',
      content: `您有一条新线索「${leadName}」待跟进，请及时处理。`
    })
  }

  /** 审批拒绝 */
  async sendOnApprovalRejected(applicationId: number, application: { applicationNo?: string; creatorId?: number }, stage: string, reason: string) {
    await this.send({
      eventCode: 'APPROVAL_REJECTED',
      applicationId,
      applicationNo: application.applicationNo,
      targetUserId: application.creatorId,
      title: `审批被拒绝 - ${stage}`,
      content: `您的进件「${application.applicationNo}」在${stage}阶段被拒绝，原因：${reason}`
    })
  }

  /** 要求补件 */
  async sendOnSupplementRequested(applicationId: number, application: { applicationNo?: string; creatorId?: number }, reason: string, deadline?: Date) {
    await this.send({
      eventCode: 'SUPPLEMENT_REQUESTED',
      applicationId,
      applicationNo: application.applicationNo,
      targetUserId: application.creatorId,
      title: '资料补充提醒',
      content: `进件「${application.applicationNo}」需要补充资料：${reason}${deadline ? `，请于${deadline.toLocaleDateString()}前完成` : ''}`
    })
  }

  /** 发起签约 */
  async sendOnSigningStarted(applicationId: number, application: { applicationNo?: string; creatorId?: number; customerId?: number }) {
    // 通知客户（如果能获取到客户关联用户）
    await this.send({
      eventCode: 'SIGNING_STARTED',
      applicationId,
      applicationNo: application.applicationNo,
      targetUserId: application.creatorId,
      title: '签约待办',
      content: `您的进件「${application.applicationNo}」已进入签约阶段，请尽快完成合同签署。`
    })
  }

  /** 放款成功 */
  async sendOnLoanDisbursed(applicationId: number, application: { applicationNo?: string; creatorId?: number; customerId?: number }, amount: number) {
    await this.send({
      eventCode: 'LOAN_DISBURSED',
      applicationId,
      applicationNo: application.applicationNo,
      targetUserId: application.creatorId,
      title: '放款到账通知',
      content: `您的进件「${application.applicationNo}」已成功放款，金额：${amount.toLocaleString()}元。`
    })
  }

  /** 还款提醒（到期前N天） */
  async sendOnRepaymentDueRemind(planId: number, application: { applicationNo?: string; customerId?: number }, dueDate: Date, amount: number, daysBefore: number) {
    await this.send({
      eventCode: 'REPAYMENT_DUE_REMIND',
      applicationId: planId,
      applicationNo: application.applicationNo,
      title: '还款提醒',
      content: `您的进件「${application.applicationNo}」第${amount}期还款将于${dueDate.toLocaleDateString()}到期，距到期还有${daysBefore}天，请及时还款。`
    })
  }

  /** 还款逾期 */
  async sendOnRepaymentOverdue(planId: number, application: { applicationNo?: string; customerId?: number }, overdueDays: number, overdueAmount: number) {
    await this.send({
      eventCode: 'REPAYMENT_OVERDUE',
      applicationId: planId,
      applicationNo: application.applicationNo,
      title: '还款逾期提醒',
      content: `进件「${application.applicationNo}」已逾期${overdueDays}天，逾期金额：${overdueAmount.toLocaleString()}元，请尽快还款。`
    })
  }

  /** 贷款结清 */
  async sendOnLoanSettled(applicationId: number, application: { applicationNo?: string; creatorId?: number }) {
    await this.send({
      eventCode: 'LOAN_SETTLED',
      applicationId,
      applicationNo: application.applicationNo,
      targetUserId: application.creatorId,
      title: '贷款结清通知',
      content: `进件「${application.applicationNo}」已全部结清，感谢您的使用。`
    })
  }
}
