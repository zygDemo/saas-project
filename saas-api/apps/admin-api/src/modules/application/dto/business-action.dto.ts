import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { ToDate, ToNumber } from '../../business-common.dto'

export class PrecheckActionDto {
  @ApiPropertyOptional({ description: '预审人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  reviewerId?: number

  @ApiPropertyOptional({ description: '预审意见' })
  @IsOptional()
  @IsString()
  opinion?: string
}

export class ApprovalActionDto {
  @ApiProperty({ description: '审批人ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  approverId: number

  @ApiPropertyOptional({ description: '审批阶段', default: 'FINAL_REVIEW' })
  @IsOptional()
  @IsString()
  stage?: string

  @ApiPropertyOptional({ description: '审批意见' })
  @IsOptional()
  @IsString()
  opinion?: string

  @ApiPropertyOptional({ description: '核定金额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  amount?: number

  @ApiPropertyOptional({ description: '核定期限（月）' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  term?: number

  @ApiPropertyOptional({ description: '核定年利率' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  rate?: number
}

export class FunderReviewDto extends ApprovalActionDto {
  @ApiPropertyOptional({ description: '资方审批编号' })
  @IsOptional()
  @IsString()
  funderApprovalNo?: string
}

export class SupplementActionDto {
  @ApiProperty({ description: '审批人ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  approverId: number

  @ApiPropertyOptional({ description: '审批阶段', default: 'FINAL_REVIEW' })
  @IsOptional()
  @IsString()
  stage?: string

  @ApiProperty({ description: '补件原因' })
  @IsString()
  reason: string

  @ApiPropertyOptional({ description: '补件截止时间' })
  @IsOptional()
  @ToDate()
  @IsDateString({}, { message: 'deadline 必须是有效日期字符串' })
  deadline?: string | Date
}

export class CompleteSupplementDto {
  @ApiPropertyOptional({ description: '补件完成备注' })
  @IsOptional()
  @IsString()
  reason?: string

  @ApiPropertyOptional({ description: '补件截止时间' })
  @IsOptional()
  @ToDate()
  @IsDateString({}, { message: 'deadline 必须是有效日期字符串' })
  deadline?: string | Date
}

export class StartSigningDto {
  @ApiPropertyOptional({ description: '合同URL' })
  @IsOptional()
  @IsString()
  contractUrl?: string

  @ApiPropertyOptional({ description: '过期时间' })
  @IsOptional()
  @ToDate()
  expiredAt?: Date
}

export class CompleteSigningDto {
  @ApiPropertyOptional({ description: '合同URL' })
  @IsOptional()
  @IsString()
  contractUrl?: string

  @ApiPropertyOptional({ description: '面签视频URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string

  @ApiPropertyOptional({ description: '签约时间，不传默认当前时间' })
  @IsOptional()
  @ToDate()
  signedAt?: Date
}

export class GpsInstalledDto {
  @ApiPropertyOptional({ description: 'GPS设备号' })
  @IsOptional()
  @IsString()
  gpsDeviceNo?: string

  @ApiPropertyOptional({ description: 'GPS安装照片' })
  @IsOptional()
  @IsString()
  gpsInstallImg?: string

  @ApiPropertyOptional({ description: 'GPS安装时间，不传默认当前时间' })
  @IsOptional()
  @ToDate()
  gpsInstallAt?: Date
}

export class MortgageDoneDto {
  @ApiPropertyOptional({ description: '抵押状态', default: 'DONE' })
  @IsOptional()
  @IsString()
  mortgageStatus?: string

  @ApiPropertyOptional({ description: '抵押回执' })
  @IsOptional()
  @IsString()
  mortgageImg?: string

  @ApiPropertyOptional({ description: '抵押完成时间，不传默认当前时间' })
  @IsOptional()
  @ToDate()
  mortgageAt?: Date
}

export class RequestDisbursementDto {
  @ApiPropertyOptional({ description: '出账申请备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

export class ConfirmDisbursementDto {
  @ApiProperty({ description: '实际放款金额' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  disburseAmount: number

  @ApiPropertyOptional({ description: '放款账户' })
  @IsOptional()
  @IsString()
  disburseAccount?: string

  @ApiPropertyOptional({ description: '放款流水号' })
  @IsOptional()
  @IsString()
  transactionNo?: string

  @ApiPropertyOptional({ description: '放款凭证' })
  @IsOptional()
  @IsString()
  voucherUrl?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '放款时间，不传默认当前时间' })
  @IsOptional()
  @ToDate()
  disburseAt?: Date

  @ApiPropertyOptional({ description: '首期还款日，不传默认放款后一个月' })
  @IsOptional()
  @ToDate()
  firstDueDate?: Date
}

export class RegisterRepaymentDto {
  @ApiProperty({ description: '本次还款金额' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  amount: number

  @ApiPropertyOptional({ description: '本次还本金，不传默认按金额全额计入本金' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  principal?: number

  @ApiPropertyOptional({ description: '本次还利息' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  interest?: number

  @ApiPropertyOptional({ description: '本次还罚息' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  penalty?: number

  @ApiProperty({ description: '支付方式' })
  @IsString()
  paymentMethod: string

  @ApiPropertyOptional({ description: '交易流水号' })
  @IsOptional()
  @IsString()
  transactionNo?: string

  @ApiPropertyOptional({ description: '凭证URL' })
  @IsOptional()
  @IsString()
  voucherUrl?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '登记人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  createdBy?: number
}

export class SettleApplicationDto {
  @ApiPropertyOptional({ description: '结清备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

export class RejectApprovalDto extends PartialType(ApprovalActionDto) {}
