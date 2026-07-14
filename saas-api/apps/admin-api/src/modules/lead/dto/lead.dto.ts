import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { LeadStatus } from '@prisma/client'
import { OrgScopedQueryDto, ToDate, ToNumber } from '../../common/dto/common.dto'

export class CreateLeadFollowUpDto {
  @ApiProperty({ description: '跟进方式' })
  @IsString()
  followType: string

  @ApiProperty({ description: '跟进内容' })
  @IsString()
  content: string

  @ApiPropertyOptional({ description: '下次跟进时间' })
  @IsOptional()
  @ToDate()
  nextFollowAt?: Date

  @ApiPropertyOptional({ description: '创建人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  createdBy?: number
}


export class CreateLeadDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiProperty({ description: '来源' })
  @IsString()
  source: string

  @ApiProperty({ description: '姓名' })
  @IsString()
  name: string

  @ApiProperty({ description: '手机号' })
  @IsString()
  phone: string

  @ApiPropertyOptional({ description: '身份证号' })
  @IsOptional()
  @IsString()
  idCard?: string

  @ApiPropertyOptional({ description: '车品牌' })
  @IsOptional()
  @IsString()
  carBrand?: string

  @ApiPropertyOptional({ description: '车型' })
  @IsOptional()
  @IsString()
  carModel?: string

  @ApiPropertyOptional({ description: '贷款金额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  loanAmount?: number

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '状态', enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus

  @ApiPropertyOptional({ description: '分配业务员ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  assigneeId?: number

  @ApiPropertyOptional({ description: '下次跟进时间' })
  @IsOptional()
  @ToDate()
  nextFollowAt?: Date

  @ApiPropertyOptional({ description: '创建人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  createdBy?: number
}


export class UpdateLeadDto extends PartialType(CreateLeadDto) {}


export class LeadQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '姓名，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '手机号，模糊查询' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({ description: '状态', enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus

  @ApiPropertyOptional({ description: '分配业务员ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  assigneeId?: number
}


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

