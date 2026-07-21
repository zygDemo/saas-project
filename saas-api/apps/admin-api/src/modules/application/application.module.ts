import { Module } from '@nestjs/common'
import { FlowConfigModule } from '../flow-config/flow-config.module'
import { RepaymentModule } from '../repayment/repayment.module'
import { DisbursementModule } from '../disbursement/disbursement.module'
import { NotificationModule } from '../notification/notification.module'
import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'
import { ApplicationMapper } from './application.mapper'
import { ApprovalWorkflowService } from './approval-workflow.service'
import { ApplicationNotificationService } from './notification.service'

@Module({
  imports: [FlowConfigModule, RepaymentModule, DisbursementModule, NotificationModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, ApplicationMapper, ApprovalWorkflowService, ApplicationNotificationService],
  exports: [ApplicationService]
})
export class ApplicationModule {}
