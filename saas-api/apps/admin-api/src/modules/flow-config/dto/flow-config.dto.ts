import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator'
import { OrgScopedQueryDto, ToBoolean, ToNumber } from '../../common/dto/common.dto'

export class CreateFlowConfigDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiProperty({ description: '配置名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '业务类型' })
  @IsString()
  businessType: string

  @ApiProperty({ description: '流程节点编码' })
  @IsString()
  nodeCode: string

  @ApiProperty({ description: '流程节点名称' })
  @IsString()
  nodeName: string

  @ApiPropertyOptional({ description: '审批层级' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  approveLevel?: number

  @ApiPropertyOptional({ description: '金额阈值' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  amountLimit?: number

  @ApiPropertyOptional({ description: '超时时长（小时）' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  timeoutHours?: number

  @ApiPropertyOptional({ description: '是否要求资料' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  requireMaterials?: boolean

  @ApiPropertyOptional({ description: '是否要求审批' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  requireApproval?: boolean

  @ApiPropertyOptional({ description: '是否自动通过' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  autoPass?: boolean

  @ApiPropertyOptional({ description: '规则配置JSON' })
  @IsOptional()
  @IsObject()
  ruleConfig?: Record<string, unknown>

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}


export class UpdateFlowConfigDto extends PartialType(CreateFlowConfigDto) {}


export class FlowConfigQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '配置名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '业务类型' })
  @IsOptional()
  @IsString()
  businessType?: string

  @ApiPropertyOptional({ description: '流程节点编码' })
  @IsOptional()
  @IsString()
  nodeCode?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}


export class InitDefaultFlowConfigDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiPropertyOptional({ description: '业务类型', default: 'CAR_LOAN' })
  @IsOptional()
  @IsString()
  businessType?: string
}

