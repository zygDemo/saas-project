import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { ApprovalAction } from '@prisma/client'
import { PageQueryDto, ToNumber } from '../../common/dto/common.dto'

export class CreateApprovalDto {
  @ApiProperty({ description: '进件ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId: number

  @ApiProperty({ description: '审批人ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  approverId: number

  @ApiProperty({ description: '审批阶段' })
  @IsString()
  stage: string

  @ApiProperty({ description: '审批动作', enum: ApprovalAction })
  @IsEnum(ApprovalAction)
  action: ApprovalAction

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

  @ApiPropertyOptional({ description: '核定期限' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  term?: number

  @ApiPropertyOptional({ description: '核定利率' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  rate?: number
}


export class UpdateApprovalDto extends PartialType(CreateApprovalDto) {}


export class ApprovalQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '进件ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId?: number

  @ApiPropertyOptional({ description: '审批阶段' })
  @IsOptional()
  @IsString()
  stage?: string

  @ApiPropertyOptional({ description: '审批动作', enum: ApprovalAction })
  @IsOptional()
  @IsEnum(ApprovalAction)
  action?: ApprovalAction
}

