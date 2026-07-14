import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsDate, IsEnum, IsIn, IsOptional, IsString } from 'class-validator'
import { OrgStatus } from '@prisma/client'
import { PageQueryDto, ToBoolean, ToDate } from '../../common/dto/common.dto'

export class CreateOrganizationDto {
  @ApiProperty({ description: '机构名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '机构编码' })
  @IsString()
  code: string

  @ApiPropertyOptional({ description: '统一社会信用代码' })
  @IsOptional()
  @IsString()
  creditCode?: string

  @ApiPropertyOptional({ description: '联系人' })
  @IsOptional()
  @IsString()
  contactName?: string

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  contactPhone?: string

  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string

  @ApiPropertyOptional({ description: '状态', enum: OrgStatus })
  @IsOptional()
  @IsEnum(OrgStatus)
  status?: OrgStatus

  @ApiPropertyOptional({ description: '套餐类型' })
  @IsOptional()
  @IsString()
  packageType?: string

  @ApiPropertyOptional({ description: '到期时间' })
  @IsOptional()
  @ToDate()
  @IsDate({ message: 'expireAt 必须是有效日期' })
  expireAt?: string | Date

  @ApiPropertyOptional({ description: 'API开关' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  apiEnabled?: boolean
}


export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}


export class OrganizationQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词，匹配机构名称、编码、信用代码、联系人或联系电话' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '机构名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '机构编码，模糊查询' })
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional({ description: '统一社会信用代码，模糊查询' })
  @IsOptional()
  @IsString()
  creditCode?: string

  @ApiPropertyOptional({ description: '联系电话，模糊查询' })
  @IsOptional()
  @IsString()
  contactPhone?: string

  @ApiPropertyOptional({ description: '状态', enum: OrgStatus })
  @IsOptional()
  @IsEnum(OrgStatus)
  status?: OrgStatus

  @ApiPropertyOptional({ description: '套餐类型' })
  @IsOptional()
  @IsString()
  packageType?: string

  @ApiPropertyOptional({ description: 'API开关' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  apiEnabled?: boolean

  @ApiPropertyOptional({ description: '到期状态', enum: ['EXPIRED', 'EXPIRING', 'VALID', 'UNSET'] })
  @IsOptional()
  @IsIn(['EXPIRED', 'EXPIRING', 'VALID', 'UNSET'])
  expireState?: 'EXPIRED' | 'EXPIRING' | 'VALID' | 'UNSET'
}

