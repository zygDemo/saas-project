import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested
} from 'class-validator'
import { ApplicationStatus, ApprovalAction, DisbursementStatus, Gender, LeadStatus, OrgStatus, RepaymentStatus, SignStatus } from '@prisma/client'

export function ToNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    return Number(value)
  })
}

export function ToDate() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    return new Date(value)
  })
}

export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    if (typeof value === 'boolean') return value
    return value === 'true' || value === '1' || value === 1
  })
}

export class IdParamDto {
  @ApiProperty({ description: '主键ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  id: number
}

export class PageQueryDto {
  @ApiPropertyOptional({ description: '当前页', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  current?: number

  @ApiPropertyOptional({ description: '每页数量', default: 20, maximum: 200 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  @Max(200)
  size?: number
}

export class OrgScopedQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '机构ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId?: number
}

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
  @IsDateString({}, { message: 'expireAt 必须是有效日期字符串' })
  expireAt?: string | Date

  @ApiPropertyOptional({ description: 'API开关' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  apiEnabled?: boolean
}

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {}

export class OrganizationQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '机构名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '机构编码，模糊查询' })
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional({ description: '状态', enum: OrgStatus })
  @IsOptional()
  @IsEnum(OrgStatus)
  status?: OrgStatus
}

export class CreateDeptDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiPropertyOptional({ description: '父部门ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  parentId?: number

  @ApiProperty({ description: '部门名称' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: '部门负责人用户ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  managerId?: number

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  sort?: number
}

export class UpdateDeptDto extends PartialType(CreateDeptDto) {}

export class DeptQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '部门名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '父部门ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  parentId?: number
}

export class CreateProductDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiProperty({ description: '产品名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '产品类型' })
  @IsString()
  productType: string

  @ApiProperty({ description: '最低年利率' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  minRate: number

  @ApiProperty({ description: '最高年利率' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  maxRate: number

  @ApiProperty({ description: '最低金额' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  minAmount: number

  @ApiProperty({ description: '最高金额' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  maxAmount: number

  @ApiProperty({ description: '最短期限（月）' })
  @ToNumber()
  @IsInt()
  @Min(1)
  minTerm: number

  @ApiProperty({ description: '最长期限（月）' })
  @ToNumber()
  @IsInt()
  @Min(1)
  maxTerm: number

  @ApiProperty({ description: '还款方式' })
  @IsString()
  repaymentMethod: string

  @ApiPropertyOptional({ description: '最低年龄' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  minAge?: number

  @ApiPropertyOptional({ description: '最高年龄' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  maxAge?: number

  @ApiPropertyOptional({ description: '最大车龄' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  maxCarAge?: number

  @ApiPropertyOptional({ description: '最大里程' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  maxMileage?: number

  @ApiPropertyOptional({ description: '最高贷款价值比' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  ltvLimit?: number

  @ApiPropertyOptional({ description: '最低首付比例' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  minDownPayment?: number

  @ApiPropertyOptional({ description: '适用区域' })
  @IsOptional()
  @IsString()
  regions?: string

  @ApiPropertyOptional({ description: '适用资方配置，JSON对象' })
  @IsOptional()
  @IsObject()
  applicableFunders?: Record<string, unknown>

  @ApiPropertyOptional({ description: '准入条件配置，JSON对象' })
  @IsOptional()
  @IsObject()
  accessConditions?: Record<string, unknown>

  @ApiPropertyOptional({ description: '估值折扣率' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  valuationDiscountRate?: number

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '文件清单JSON' })
  @IsOptional()
  fileChecklist?: unknown
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '产品名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '产品类型' })
  @IsOptional()
  @IsString()
  productType?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}

export class CreateFunderDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

  @ApiProperty({ description: '资方名称' })
  @IsString()
  name: string

  @ApiProperty({ description: '资方编码' })
  @IsString()
  code: string

  @ApiProperty({ description: '资方类型' })
  @IsString()
  funderType: string

  @ApiPropertyOptional({ description: '联系人' })
  @IsOptional()
  @IsString()
  contactName?: string

  @ApiPropertyOptional({ description: '联系电话' })
  @IsOptional()
  @IsString()
  contactPhone?: string

  @ApiPropertyOptional({ description: '对接方式：API、文件导入导出、人工录入' })
  @IsOptional()
  @IsString()
  integrationMode?: string

  @ApiPropertyOptional({ description: '额度配置' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  creditLimit?: number

  @ApiPropertyOptional({ description: 'API配置' })
  @IsOptional()
  @IsObject()
  apiConfig?: Record<string, unknown>

  @ApiPropertyOptional({ description: '审批规则配置' })
  @IsOptional()
  @IsObject()
  approvalRules?: Record<string, unknown>

  @ApiPropertyOptional({ description: '优先级' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  priority?: number

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}

export class UpdateFunderDto extends PartialType(CreateFunderDto) {}

export class FunderQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '资方名称，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '资方编码，模糊查询' })
  @IsOptional()
  @IsString()
  code?: string

  @ApiPropertyOptional({ description: '资方类型' })
  @IsOptional()
  @IsString()
  funderType?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}

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

export class CustomerContactDto {
  @ApiProperty({ description: '联系人姓名' })
  @IsString()
  name: string

  @ApiProperty({ description: '关系' })
  @IsString()
  relation: string

  @ApiProperty({ description: '手机号' })
  @IsString()
  phone: string

  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string

  @ApiPropertyOptional({ description: '是否紧急联系人' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isEmergency?: boolean
}

export class VehicleDto {
  @ApiPropertyOptional({ description: '车架号' })
  @IsOptional()
  @IsString()
  vin?: string

  @ApiPropertyOptional({ description: '车牌号' })
  @IsOptional()
  @IsString()
  plateNumber?: string

  @ApiPropertyOptional({ description: '品牌' })
  @IsOptional()
  @IsString()
  brand?: string

  @ApiPropertyOptional({ description: '车型' })
  @IsOptional()
  @IsString()
  model?: string

  @ApiPropertyOptional({ description: '颜色' })
  @IsOptional()
  @IsString()
  color?: string

  @ApiPropertyOptional({ description: '年份' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1900)
  year?: number

  @ApiPropertyOptional({ description: '里程' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  mileage?: number

  @ApiPropertyOptional({ description: '购买价格' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  purchasePrice?: number

  @ApiPropertyOptional({ description: '评估价' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  estimateValue?: number

  @ApiPropertyOptional({ description: '是否抵押' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isMortgaged?: boolean

  @ApiPropertyOptional({ description: '抵押信息' })
  @IsOptional()
  @IsString()
  mortgageInfo?: string
}

export class BankCardDto {
  @ApiProperty({ description: '银行名称' })
  @IsString()
  bankName: string

  @ApiProperty({ description: '卡号' })
  @IsString()
  cardNo: string

  @ApiProperty({ description: '卡类型' })
  @IsString()
  cardType: string

  @ApiPropertyOptional({ description: '是否默认' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isDefault?: boolean
}

export class CreateCustomerDto {
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

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

  @ApiPropertyOptional({ description: '性别', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender

  @ApiPropertyOptional({ description: '出生日期' })
  @IsOptional()
  @ToDate()
  birthDate?: Date

  @ApiPropertyOptional({ description: '婚姻状态' })
  @IsOptional()
  @IsString()
  maritalStatus?: string

  @ApiPropertyOptional({ description: '学历' })
  @IsOptional()
  @IsString()
  education?: string

  @ApiPropertyOptional({ description: '职业' })
  @IsOptional()
  @IsString()
  occupation?: string

  @ApiPropertyOptional({ description: '公司名称' })
  @IsOptional()
  @IsString()
  companyName?: string

  @ApiPropertyOptional({ description: '月收入' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  monthlyIncome?: number

  @ApiPropertyOptional({ description: '地址' })
  @IsOptional()
  @IsString()
  address?: string

  @ApiPropertyOptional({ description: '紧急联系人' })
  @IsOptional()
  @IsString()
  emergencyName?: string

  @ApiPropertyOptional({ description: '紧急联系人手机号' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string

  @ApiPropertyOptional({ description: '联系人列表', type: [CustomerContactDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomerContactDto)
  contacts?: CustomerContactDto[]

  @ApiPropertyOptional({ description: '车辆列表', type: [VehicleDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VehicleDto)
  vehicles?: VehicleDto[]

  @ApiPropertyOptional({ description: '银行卡列表', type: [BankCardDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BankCardDto)
  bankCards?: BankCardDto[]
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}

export class CustomerQueryDto extends OrgScopedQueryDto {
  @ApiPropertyOptional({ description: '姓名，模糊查询' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '手机号，模糊查询' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({ description: '身份证号，模糊查询' })
  @IsOptional()
  @IsString()
  idCard?: string

  @ApiPropertyOptional({ description: '状态' })
  @IsOptional()
  @IsString()
  status?: string
}

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
  @ApiProperty({ description: '机构ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  orgId: number

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

export class CreateSigningDto {
  @ApiProperty({ description: '进件ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId: number

  @ApiPropertyOptional({ description: '签约状态', enum: SignStatus })
  @IsOptional()
  @IsEnum(SignStatus)
  status?: SignStatus

  @ApiPropertyOptional({ description: '合同URL' })
  @IsOptional()
  @IsString()
  contractUrl?: string

  @ApiPropertyOptional({ description: '签约时间' })
  @IsOptional()
  @ToDate()
  signedAt?: Date

  @ApiPropertyOptional({ description: '面签视频URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string

  @ApiPropertyOptional({ description: '过期时间' })
  @IsOptional()
  @ToDate()
  expiredAt?: Date

  @ApiPropertyOptional({ description: '取消原因' })
  @IsOptional()
  @IsString()
  cancelledReason?: string
}

export class UpdateSigningDto extends PartialType(CreateSigningDto) {}

export class SigningQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '进件ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId?: number

  @ApiPropertyOptional({ description: '签约状态', enum: SignStatus })
  @IsOptional()
  @IsEnum(SignStatus)
  status?: SignStatus
}

export class CreateDisbursementDto {
  @ApiProperty({ description: '进件ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId: number

  @ApiPropertyOptional({ description: '放款状态', enum: DisbursementStatus })
  @IsOptional()
  @IsEnum(DisbursementStatus)
  status?: DisbursementStatus

  @ApiPropertyOptional({ description: 'GPS设备号' })
  @IsOptional()
  @IsString()
  gpsDeviceNo?: string

  @ApiPropertyOptional({ description: 'GPS安装照片' })
  @IsOptional()
  @IsString()
  gpsInstallImg?: string

  @ApiPropertyOptional({ description: 'GPS安装时间' })
  @IsOptional()
  @ToDate()
  gpsInstallAt?: Date

  @ApiPropertyOptional({ description: '抵押状态' })
  @IsOptional()
  @IsString()
  mortgageStatus?: string

  @ApiPropertyOptional({ description: '抵押回执' })
  @IsOptional()
  @IsString()
  mortgageImg?: string

  @ApiPropertyOptional({ description: '抵押时间' })
  @IsOptional()
  @ToDate()
  mortgageAt?: Date

  @ApiPropertyOptional({ description: '实际放款金额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  disburseAmount?: number

  @ApiPropertyOptional({ description: '放款账户' })
  @IsOptional()
  @IsString()
  disburseAccount?: string

  @ApiPropertyOptional({ description: '放款时间' })
  @IsOptional()
  @ToDate()
  disburseAt?: Date

  @ApiPropertyOptional({ description: '流水号' })
  @IsOptional()
  @IsString()
  transactionNo?: string

  @ApiPropertyOptional({ description: '放款凭证' })
  @IsOptional()
  @IsString()
  voucherUrl?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string
}

export class UpdateDisbursementDto extends PartialType(CreateDisbursementDto) {}

export class DisbursementQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '进件ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId?: number

  @ApiPropertyOptional({ description: '放款状态', enum: DisbursementStatus })
  @IsOptional()
  @IsEnum(DisbursementStatus)
  status?: DisbursementStatus
}

export class CreateRepaymentDto {
  @ApiProperty({ description: '进件ID' })
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId: number

  @ApiProperty({ description: '期数' })
  @ToNumber()
  @IsInt()
  @Min(1)
  period: number

  @ApiProperty({ description: '应还日期' })
  @ToDate()
  dueDate: Date

  @ApiProperty({ description: '应还本金' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  principal: number

  @ApiProperty({ description: '应还利息' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  interest: number

  @ApiProperty({ description: '应还总额' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  totalAmount: number

  @ApiPropertyOptional({ description: '已还本金' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  paidPrincipal?: number

  @ApiPropertyOptional({ description: '已还利息' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  paidInterest?: number

  @ApiPropertyOptional({ description: '已还总额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  paidTotal?: number

  @ApiPropertyOptional({ description: '状态', enum: RepaymentStatus })
  @IsOptional()
  @IsEnum(RepaymentStatus)
  status?: RepaymentStatus

  @ApiPropertyOptional({ description: '逾期天数' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  overdueDays?: number

  @ApiPropertyOptional({ description: '违约金' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  penaltyAmount?: number

  @ApiPropertyOptional({ description: '还清时间' })
  @IsOptional()
  @ToDate()
  paidAt?: Date
}

export class UpdateRepaymentDto extends PartialType(CreateRepaymentDto) {}

export class RepaymentQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '进件ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  applicationId?: number

  @ApiPropertyOptional({ description: '状态', enum: RepaymentStatus })
  @IsOptional()
  @IsEnum(RepaymentStatus)
  status?: RepaymentStatus
}
