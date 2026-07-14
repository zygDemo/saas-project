import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ApplicationStatus } from '@prisma/client'
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min , ValidateNested } from 'class-validator'
import { OrgScopedQueryDto, ToBoolean, ToDate, ToNumber } from '../../common/dto/common.dto'
export class ApplicationFileDto {
  @ApiProperty({ description: '文件类型' })
  @IsString()
  fileType: string
  @ApiProperty({ description: '文件URL' })
  @IsString()
  fileUrl: string
  @ApiPropertyOptional({ description: '文件名' })
  @IsOptional()
  @IsString()
  fileName?: string
  @ApiPropertyOptional({ description: 'OCR结果' })
  @IsOptional()
  ocrResult?: unknown
  @ApiPropertyOptional({ description: '是否有效' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isValid?: boolean
}
export class CreateApplicationDto {
  @ApiPropertyOptional({ description: '机构ID，不传时由后端根据客户所属机构自动填充' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId?: number
  @ApiProperty({ description: '客户ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  customerId: number
  @ApiPropertyOptional({ description: '产品ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  productId?: number
  @ApiPropertyOptional({ description: '资方ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  funderId?: number
  @ApiPropertyOptional({ description: '申请编号，不传则自动生成' })
  @IsOptional()
  @IsString()
  applicationNo?: string
  @ApiProperty({ description: '申请金额' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  amount: number
  @ApiProperty({ description: '期限（月）' })
  @ToNumber()
  @IsInt()
  @Min(1)
  term: number
  @ApiProperty({ description: '年利率' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  rate: number
  @ApiProperty({ description: '还款方式' })
  @IsString()
  repaymentMethod: string
  @ApiPropertyOptional({ description: '贷款用途' })
  @IsOptional()
  @IsString()
  purpose?: string
  @ApiPropertyOptional({ description: '状态', enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus
  @ApiPropertyOptional({ description: '业务类型', default: 'CAR_LOAN' })
  @IsOptional()
  @IsString()
  businessType?: string
  @ApiPropertyOptional({ description: '当前流程节点' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  currentNode?: number
  @ApiPropertyOptional({ description: '当前节点状态' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  currentStatus?: number
  @ApiProperty({ description: '创建人ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  creatorId: number
  @ApiPropertyOptional({ description: '来源线索ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  sourceLeadId?: number
  @ApiPropertyOptional({ description: '补件原因' })
  @IsOptional()
  @IsString()
  supplementReason?: string
  @ApiPropertyOptional({ description: '补件截止时间' })
  @IsOptional()
  @ToDate()
  supplementDeadline?: Date
  @ApiPropertyOptional({ description: '审批通过金额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  approvedAmount?: number
  @ApiPropertyOptional({ description: '审批通过期限' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  approvedTerm?: number
  @ApiPropertyOptional({ description: '审批通过利率' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  approvedRate?: number
  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
  @ApiPropertyOptional({ description: '进件文件', type: [ApplicationFileDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ApplicationFileDto)
  files?: ApplicationFileDto[]
}
export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {}
export class ApplicationQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '申请编号，模糊查询' })
  @IsOptional()
  @IsString()
  applicationNo?: string
  @ApiPropertyOptional({ description: '状态', enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus
  @ApiPropertyOptional({ description: '业务类型' })
  @IsOptional()
  @IsString()
  businessType?: string
  @ApiPropertyOptional({ description: '当前流程节点' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  currentNode?: number
  @ApiPropertyOptional({ description: '当前节点状态' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  currentStatus?: number
  @ApiPropertyOptional({ description: '阶段编码，按大节点过滤订单' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  phaseCode?: number
  @ApiPropertyOptional({ description: '客户ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  customerId?: number
  @ApiPropertyOptional({ description: '创建人ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  creatorId?: number
}
export class OrderListQueryDto extends ApplicationQueryDto {
  @ApiPropertyOptional({ description: '当前页，兼容移动端 pageNum 字段', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  pageNum?: number
  @ApiPropertyOptional({ description: '每页数量，兼容移动端 pageSize 字段', default: 20 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  pageSize?: number
  @ApiPropertyOptional({ description: '订单号/申请编号，模糊查询' })
  @IsOptional()
  @IsString()
  orderNo?: string
  @ApiPropertyOptional({ description: '授信订单号，兼容移动端字段，模糊查询' })
  @IsOptional()
  @IsString()
  creditOrderId?: string
  @ApiPropertyOptional({ description: '客户姓名，模糊查询' })
  @IsOptional()
  @IsString()
  personName?: string
  @ApiPropertyOptional({ description: '客户姓名，兼容 customerName 字段，模糊查询' })
  @IsOptional()
  @IsString()
  customerName?: string
  @ApiPropertyOptional({ description: '客户姓名，兼容 name 字段，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string
  @ApiPropertyOptional({ description: '手机号，模糊查询' })
  @IsOptional()
  @IsString()
  phone?: string
  @ApiPropertyOptional({ description: '手机号，兼容 telephone 字段，模糊查询' })
  @IsOptional()
  @IsString()
  telephone?: string
  @ApiPropertyOptional({ description: '车牌号，模糊查询' })
  @IsOptional()
  @IsString()
  plateNumber?: string
  @ApiPropertyOptional({ description: '节点编码，兼容 nodeCode 字段' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  nodeCode?: number
  @ApiPropertyOptional({ description: '业务节点字符串编码，如 PRE_AUDIT、SIGN_CONTRACT' })
  @IsOptional()
  @IsString()
  businessNode?: string
  @ApiPropertyOptional({ description: '节点状态，兼容 nodeStatus 字段' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  nodeStatus?: number
  @ApiPropertyOptional({ description: '关键字，匹配订单号、姓名、手机号、车牌号' })
  @IsOptional()
  @IsString()
  keyword?: string
}