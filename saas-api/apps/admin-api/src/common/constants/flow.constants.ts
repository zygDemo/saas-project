/**
 * 流程节点编码
 *
 * 用于 Application.currentNode 字段，标识进件当前所处的业务阶段。
 * 编码规则：千位数表示阶段大类，百位及以下表示子节点。
 */
export enum FlowNode {
  /** 已取消 */
  CANCELLED = 0,
  /** 提交/录入阶段 */
  SUBMISSION = 1100,
  /** 驳回到提交（风控预审退回） */
  SUBMISSION_RETURNED = 1140,
  /** 风控预审 */
  RISK_PRE = 1200,
  /** 资方预审 */
  FUNDER_PRE = 1250,
  /** 补件阶段 */
  SUPPLEMENT = 1300,
  /** 初审 */
  FIRST_REVIEW = 1400,
  /** 终审 */
  FINAL_REVIEW = 1450,
  /** 资方审批 */
  FUNDER_REVIEW = 1500,
  /** 签约阶段 */
  SIGNING = 1600,
  /** 已签约 */
  SIGNED = 1660,
  /** 请款阶段 */
  LOAN_REQUEST = 1700,
  /** 放款阶段 */
  DISBURSEMENT = 1800,
  /** 贷后阶段 */
  POST_LOAN = 1900,
}

/**
 * 流程节点状态
 *
 * 用于 Application.currentStatus 字段，标识进件在当前节点的处理状态。
 */
export enum FlowStatus {
  /** 待处理 */
  PENDING = 10,
  /** 通过 */
  PASSED = 20,
  /** 拒绝 */
  REJECTED = 30,
  /** 驳回/退回 */
  RETURNED = 40,
  /** 补件中 */
  SUPPLEMENTING = 50,
  /** 已完成（终态：放款/结清） */
  COMPLETED = 90,
}

import { ApplicationStatus } from '@prisma/client'

/**
 * 默认流程状态映射
 *
 * 当机构未配置流程或配置缺失时，作为兜底映射使用。
 * 每个 ApplicationStatus 对应一个流程节点编码和节点状态。
 */
export const DEFAULT_FLOW_STATUS_MAP: Record<ApplicationStatus, { currentNode: number; currentStatus: number }> = {
  [ApplicationStatus.DRAFT]: { currentNode: FlowNode.SUBMISSION, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.SUBMITTED]: { currentNode: FlowNode.SUBMISSION, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.PENDING_RISK_PRE]: { currentNode: FlowNode.RISK_PRE, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.RISK_PRE_PASSED]: { currentNode: FlowNode.FUNDER_PRE, currentStatus: FlowStatus.PASSED },
  [ApplicationStatus.RISK_PRE_REJECTED]: { currentNode: FlowNode.RISK_PRE, currentStatus: FlowStatus.REJECTED },
  [ApplicationStatus.PENDING_FUNDER_PRE]: { currentNode: FlowNode.FUNDER_PRE, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.FUNDER_PRE_PASSED]: { currentNode: FlowNode.SUPPLEMENT, currentStatus: FlowStatus.PASSED },
  [ApplicationStatus.FUNDER_PRE_REJECTED]: { currentNode: FlowNode.FUNDER_PRE, currentStatus: FlowStatus.REJECTED },
  [ApplicationStatus.PENDING_SUPPLEMENT]: { currentNode: FlowNode.SUPPLEMENT, currentStatus: FlowStatus.SUPPLEMENTING },
  [ApplicationStatus.PENDING_FIRST_REVIEW]: { currentNode: FlowNode.FIRST_REVIEW, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.FIRST_REVIEW_PASSED]: { currentNode: FlowNode.FINAL_REVIEW, currentStatus: FlowStatus.PASSED },
  [ApplicationStatus.FIRST_REVIEW_REJECTED]: { currentNode: FlowNode.FIRST_REVIEW, currentStatus: FlowStatus.REJECTED },
  [ApplicationStatus.PENDING_FINAL_REVIEW]: { currentNode: FlowNode.FINAL_REVIEW, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.FINAL_REVIEW_PASSED]: { currentNode: FlowNode.FUNDER_REVIEW, currentStatus: FlowStatus.PASSED },
  [ApplicationStatus.FINAL_REVIEW_REJECTED]: { currentNode: FlowNode.FINAL_REVIEW, currentStatus: FlowStatus.REJECTED },
  [ApplicationStatus.PENDING_FUNDER_REVIEW]: { currentNode: FlowNode.FUNDER_REVIEW, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.FUNDER_REVIEW_PASSED]: { currentNode: FlowNode.SIGNING, currentStatus: FlowStatus.PASSED },
  [ApplicationStatus.FUNDER_REVIEW_REJECTED]: { currentNode: FlowNode.FUNDER_REVIEW, currentStatus: FlowStatus.REJECTED },
  [ApplicationStatus.PENDING_SIGN]: { currentNode: FlowNode.SIGNING, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.SIGNING_PROGRESS]: { currentNode: FlowNode.SIGNING, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.SIGNED]: { currentNode: FlowNode.SIGNED, currentStatus: FlowStatus.PASSED },
  [ApplicationStatus.PENDING_LOAN_REQUEST]: { currentNode: FlowNode.LOAN_REQUEST, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.LOAN_REQUEST_REVIEWING]: { currentNode: FlowNode.LOAN_REQUEST, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.LOAN_REQUEST_APPROVED]: { currentNode: FlowNode.DISBURSEMENT, currentStatus: FlowStatus.PASSED },
  [ApplicationStatus.LOAN_REQUEST_REJECTED]: { currentNode: FlowNode.LOAN_REQUEST, currentStatus: FlowStatus.REJECTED },
  [ApplicationStatus.PENDING_DISBURSEMENT]: { currentNode: FlowNode.DISBURSEMENT, currentStatus: FlowStatus.PENDING },
  [ApplicationStatus.DISBURSED]: { currentNode: FlowNode.POST_LOAN, currentStatus: FlowStatus.COMPLETED },
  [ApplicationStatus.CANCELLED]: { currentNode: FlowNode.CANCELLED, currentStatus: FlowStatus.REJECTED },
  [ApplicationStatus.SETTLED]: { currentNode: FlowNode.POST_LOAN, currentStatus: FlowStatus.COMPLETED }
}
