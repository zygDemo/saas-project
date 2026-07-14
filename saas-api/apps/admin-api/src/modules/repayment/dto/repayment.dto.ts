import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { RepaymentStatus } from '@prisma/client'
import { PageQueryDto, ToDate, ToNumber } from '../../common/dto/common.dto'

export class CreateRepaymentDto {
  @ApiProperty({ description: '进件ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId: number

  @ApiProperty({ description: '期数' })
  @ToNumber()
  @IsInt()
  @Min(1)
  period: number

  @ApiProperty({ description: '应还日期' })
  @ToDate()
  dueDate: Date

  @ApiProperty({ description: '应还本金' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  principal: number

  @ApiProperty({ description: '应还利息' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  interest: number

  @ApiProperty({ description: '应还总额' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  totalAmount: number

  @ApiPropertyOptional({ description: '已还本金' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  paidPrincipal?: number

  @ApiPropertyOptional({ description: '已还利息' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  paidInterest?: number

  @ApiPropertyOptional({ description: '已还总额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  paidTotal?: number

  @ApiPropertyOptional({ description: '状态', enum: RepaymentStatus })
  @IsOptional()
  @IsEnum(RepaymentStatus)
  status?: RepaymentStatus

  @ApiPropertyOptional({ description: '逾期天数' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  overdueDays?: number

  @ApiPropertyOptional({ description: '违约金' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  penaltyAmount?: number

  @ApiPropertyOptional({ description: '还清时间' })
  @IsOptional()
  @ToDate()
  paidAt?: Date
}


export class UpdateRepaymentDto extends PartialType(CreateRepaymentDto) {}


export class RepaymentQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '进件ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId?: number

  @ApiPropertyOptional({ description: '状态', enum: RepaymentStatus })
  @IsOptional()
  @IsEnum(RepaymentStatus)
  status?: RepaymentStatus
}


export class RegisterRepaymentDto {
  @ApiProperty({ description: '还款金额' })
  @IsNumber()
  @Min(0)
  amount: number

  @ApiPropertyOptional({ description: '还款本金' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  principal?: number

  @ApiPropertyOptional({ description: '还款利息' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  interest?: number

  @ApiPropertyOptional({ description: '违约金' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penalty?: number

  @ApiProperty({ description: '还款方式' })
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

  @ApiPropertyOptional({ description: '操作人ID' })
  @IsOptional()
  @IsNumber()
  createdBy?: number
}


export class OverdueQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @ApiPropertyOptional({ description: '每页条数', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pageSize?: number
}


export class AddCollectionRecordDto {
  @ApiPropertyOptional({ description: '催收人ID' })
  @IsOptional()
  @IsNumber()
  collectorId?: number

  @ApiPropertyOptional({ description: '催收方式：PHONE/SMS/VISIT' })
  @IsOptional()
  @IsString()
  collectType?: string

  @ApiProperty({ description: '催收内容' })
  @IsString()
  content: string

  @ApiPropertyOptional({ description: '催收结果' })
  @IsOptional()
  @IsString()
  result?: string

  @ApiPropertyOptional({ description: '下一步动作' })
  @IsOptional()
  @IsString()
  nextAction?: string

  @ApiPropertyOptional({ description: '下一步日期' })
  @IsOptional()
  @IsString()
  nextDate?: string
}


export class ApplyEarlyRepaymentDto {
  @ApiPropertyOptional({ description: '还款类型：FULL/PARTIAL' })
  @IsOptional()
  @IsString()
  repayType?: string

  @ApiPropertyOptional({ description: '还款总额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number

  @ApiPropertyOptional({ description: '还款本金' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  principal?: number

  @ApiPropertyOptional({ description: '还款利息' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  interest?: number

  @ApiPropertyOptional({ description: '违约金' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penalty?: number

  @ApiPropertyOptional({ description: '申请原因' })
  @IsOptional()
  @IsString()
  reason?: string
}


export class ApproveEarlyRepaymentDto {
  @ApiProperty({ description: '审批人ID' })
  @IsNumber()
  approvedBy: number

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

