import { Module } from '@nestjs/common'
import { FlowConfigModule } from '../flow-config/flow-config.module'
import { RepaymentModule } from '../repayment/repayment.module'
import { DisbursementModule } from '../disbursement/disbursement.module'
import { ApplicationController } from './application.controller'
import { ApplicationService } from './application.service'
import { ApprovalWorkflowService } from './approval-workflow.service'
import { NotificationService } from './notification.service'

@Module({
  imports: [FlowConfigModule, RepaymentModule, DisbursementModule],
  controllers: [ApplicationController],
  providers: [ApplicationService, ApprovalWorkflowService, NotificationService],
  exports: [ApplicationService]
})
export class ApplicationModule {}
