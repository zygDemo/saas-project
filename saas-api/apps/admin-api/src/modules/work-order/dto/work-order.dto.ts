import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator'
import { PageQueryDto, ToDate, ToNumber } from '../../common/dto/common.dto'

export class CreateWorkOrderDto {
  @ApiProperty({ description: '工单标题' })
  @IsString()
  title: string

  @ApiPropertyOptional({ description: '工单内容' })
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional({ description: '工单类型', default: 'FEEDBACK' })
  @IsOptional()
  @IsString()
  orderType?: string

  @ApiPropertyOptional({ description: '优先级', default: 'NORMAL' })
  @IsOptional()
  @IsString()
  priority?: string

  @ApiPropertyOptional({ description: '状态', default: 'OPEN' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '创建人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  creatorId?: number

  @ApiPropertyOptional({ description: '处理人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  assigneeId?: number

  @ApiPropertyOptional({ description: '解决时间' })
  @IsOptional()
  @ToDate()
  @IsDate({ message: 'resolvedAt 必须是有效日期' })
  resolvedAt?: string | Date

  @ApiPropertyOptional({ description: '关闭时间' })
  @IsOptional()
  @ToDate()
  @IsDate({ message: 'closedAt 必须是有效日期' })
  closedAt?: string | Date

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}


export class UpdateWorkOrderDto extends PartialType(CreateWorkOrderDto) {}


export class WorkOrderQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词，匹配工单标题' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '工单标题，模糊查询' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: '租户ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  tenantId?: number

  @ApiPropertyOptional({ description: '工单类型' })
  @IsOptional()
  @IsString()
  orderType?: string

  @ApiPropertyOptional({ description: '优先级' })
  @IsOptional()
  @IsString()
  priority?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '创建人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  creatorId?: number

  @ApiPropertyOptional({ description: '处理人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  assigneeId?: number
}

