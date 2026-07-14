import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator'
import { PageQueryDto } from '../../common/dto/common.dto'

const TEMPLATE_CHANNELS = ['SMS', 'APP', 'WECHAT', 'EMAIL', 'SYSTEM'] as const
const TEMPLATE_STATUS = ['ACTIVE', 'INACTIVE', 'DRAFT'] as const

function ToJsonObject() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  })
}

export class CreateMsgTemplateDto {
  @ApiProperty({ description: '模板名称', example: '预审通过通知' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @ApiProperty({ description: '模板编码', example: 'PRECHECK_PASS_SMS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code!: string

  @ApiPropertyOptional({ description: '发送渠道', enum: TEMPLATE_CHANNELS, example: 'SMS' })
  @IsOptional()
  @IsIn(TEMPLATE_CHANNELS)
  channel?: string

  @ApiPropertyOptional({ description: '业务场景', example: 'CARLOAN_PRECHECK' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  scene?: string

  @ApiPropertyOptional({ description: '标题/主题' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @ApiProperty({ description: '模板内容，支持 {{变量名}} 占位符' })
  @IsString()
  @IsNotEmpty()
  content!: string

  @ApiPropertyOptional({ description: '变量说明 JSON 对象或数组' })
  @IsOptional()
  @ToJsonObject()
  @IsObject()
  variables?: Record<string, unknown>

  @ApiPropertyOptional({ description: '状态', enum: TEMPLATE_STATUS, example: 'ACTIVE' })
  @IsOptional()
  @IsIn(TEMPLATE_STATUS)
  status?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string
}

export class UpdateMsgTemplateDto extends PartialType(CreateMsgTemplateDto) {}

export class MsgTemplateQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '关键词，匹配名称、编码、标题、内容' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '模板名称' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '模板编码' })
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional({ description: '发送渠道', enum: TEMPLATE_CHANNELS })
  @IsOptional()
  @IsIn(TEMPLATE_CHANNELS)
  channel?: string

  @ApiPropertyOptional({ description: '业务场景' })
  @IsOptional()
  @IsString()
  scene?: string

  @ApiPropertyOptional({ description: '状态', enum: TEMPLATE_STATUS })
  @IsOptional()
  @IsIn(TEMPLATE_STATUS)
  status?: string
}
