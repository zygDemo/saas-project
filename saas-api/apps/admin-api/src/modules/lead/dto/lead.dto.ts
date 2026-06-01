import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'
import { CreateLeadDto, UpdateLeadDto, LeadQueryDto, CreateLeadFollowUpDto, IdParamDto, ToNumber } from '../../business-common.dto'

export { CreateLeadDto, UpdateLeadDto, LeadQueryDto, CreateLeadFollowUpDto, IdParamDto }

export class AssignLeadDto {
  @ApiProperty({ description: '业务员ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  assigneeId: number

  @ApiPropertyOptional({ description: '分配备注' })
  @IsOptional()
  @IsString()
  remark?: string
}
