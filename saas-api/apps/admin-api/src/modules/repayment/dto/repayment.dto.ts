export { CreateRepaymentDto, UpdateRepaymentDto, RepaymentQueryDto, IdParamDto } from '../../business-common.dto'

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, Min } from 'class-validator'

/** 还款登记 DTO */
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

/** 逾期列表查询 DTO */
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

/** 催收记录 DTO */
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

/** 提前还款申请 DTO */
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

/** 提前还款审批 DTO */
export class ApproveEarlyRepaymentDto {
  @ApiProperty({ description: '审批人ID' })
  @IsNumber()
  approvedBy: number

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}
