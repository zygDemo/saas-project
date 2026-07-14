import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

const ANNOUNCE_TYPE = ['NOTICE', 'ANNOUNCEMENT', 'ALERT'] as const
const ANNOUNCE_LEVEL = ['NORMAL', 'IMPORTANT', 'URGENT'] as const
const ANNOUNCE_STATUS = ['DRAFT', 'PUBLISHED', 'EXPIRED'] as const

export class CreateAnnouncementDto {
  @ApiProperty({ description: '公告标题', example: '系统升级通知' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string

  @ApiPropertyOptional({ description: '公告内容（支持富文本HTML）' })
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional({ description: '公告类型', enum: ANNOUNCE_TYPE, example: 'NOTICE' })
  @IsOptional()
  @IsIn(ANNOUNCE_TYPE)
  type?: string

  @ApiPropertyOptional({ description: '重要程度', enum: ANNOUNCE_LEVEL, example: 'NORMAL' })
  @IsOptional()
  @IsIn(ANNOUNCE_LEVEL)
  level?: string

  @ApiPropertyOptional({ description: '状态', enum: ANNOUNCE_STATUS, example: 'DRAFT' })
  @IsOptional()
  @IsIn(ANNOUNCE_STATUS)
  status?: string

  @ApiPropertyOptional({ description: '发布时间' })
  @IsOptional()
  @IsString()
  publishAt?: string

  @ApiPropertyOptional({ description: '过期时间' })
  @IsOptional()
  @IsString()
  expireAt?: string


  @ApiPropertyOptional({ description: '发布范围', example: '全部用户' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  target?: string

  @ApiPropertyOptional({ description: '是否置顶', example: false })
  @IsOptional()
  @IsBoolean()
  topFlag?: boolean

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string
}

export class UpdateAnnouncementDto extends PartialType(CreateAnnouncementDto) {}

export class AnnouncementQueryDto {
  @ApiPropertyOptional({ description: '公告标题（模糊搜索）' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: '公告类型', enum: ANNOUNCE_TYPE })
  @IsOptional()
  @IsIn(ANNOUNCE_TYPE)
  type?: string

  @ApiPropertyOptional({ description: '重要程度', enum: ANNOUNCE_LEVEL })
  @IsOptional()
  @IsIn(ANNOUNCE_LEVEL)
  level?: string

  @ApiPropertyOptional({ description: '状态', enum: ANNOUNCE_STATUS })
  @IsOptional()
  @IsIn(ANNOUNCE_STATUS)
  status?: string

  @ApiPropertyOptional({ description: '当前页码' })
  current?: string | number

  @ApiPropertyOptional({ description: '每页条数' })
  size?: string | number
}
