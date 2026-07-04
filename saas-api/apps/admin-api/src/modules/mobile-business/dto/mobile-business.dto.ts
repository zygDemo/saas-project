import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export function ToNumber() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    return Number(value)
  })
}

export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    const text = String(value).trim().toLowerCase()
    if (['true', '1', 'yes'].includes(text)) return true
    if (['false', '0', 'no'].includes(text)) return false
    return value
  })
}

export class MobileUuidQueryDto {
  @ApiProperty({ description: '客户唯一标识' })
  @IsString()
  uuid: string
}

export class MobileUserListQueryDto {
  @ApiPropertyOptional({ description: '数据来源' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  dataSource?: number

  @ApiPropertyOptional({ description: '客户姓名' })
  @IsOptional()
  @IsString()
  personName?: string
}

export class MobileCreditListQueryDto {
  @ApiPropertyOptional({ description: '当前页', default: 1 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  current?: number

  @ApiPropertyOptional({ description: '兼容旧前端：pageNum' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  pageNum?: number

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  size?: number

  @ApiPropertyOptional({ description: '兼容旧前端：pageSize' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  pageSize?: number

  @ApiPropertyOptional({ description: '业务员ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  salesmanId?: number

  @ApiPropertyOptional({ description: '业务节点' })
  @IsOptional()
  @IsString()
  businessNode?: string

  @ApiPropertyOptional({ description: '状态筛选（支持数字或字符串状态码）' })
  @IsOptional()
  status?: string | number

  @ApiPropertyOptional({ description: '客户姓名' })
  @IsOptional()
  @IsString()
  personName?: string
}

export class MobileIdCardInfoDto {
  @ApiPropertyOptional({ description: '客户唯一标识，编辑时传入' })
  @IsOptional()
  @IsString()
  uuid?: string

  @ApiPropertyOptional({ description: '业务员ID' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  salesmanId?: number

  @ApiPropertyOptional({ description: '是否同步创建订单草稿' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  createOrder?: boolean

  @ApiPropertyOptional({ description: '业务类型，例如 CAR_LOAN 或 PAWN' })
  @IsOptional()
  @IsString()
  businessType?: string

  @ApiPropertyOptional({ description: '姓名' })
  @IsOptional()
  @IsString()
  personName?: string

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  telephone?: string

  @ApiPropertyOptional({ description: '身份证号' })
  @IsOptional()
  @IsString()
  personIdcard?: string

  @ApiPropertyOptional({ description: '性别，1男 2女' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  gender?: number

  @ApiPropertyOptional({ description: '年龄' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  age?: number

  @ApiPropertyOptional({ description: '民族' })
  @IsOptional()
  @IsString()
  race?: string

  @ApiPropertyOptional({ description: '民族（兼容旧前端字段）' })
  @IsOptional()
  @IsString()
  nation?: string

  @ApiPropertyOptional({ description: '身份证地址' })
  @IsOptional()
  @IsString()
  personAddress?: string

  @ApiPropertyOptional({ description: '户籍地址（兼容旧前端字段）' })
  @IsOptional()
  @IsString()
  householdAddress?: string

  @ApiPropertyOptional({ description: '签发机关' })
  @IsOptional()
  @IsString()
  personIssuingAuthority?: string

  @ApiPropertyOptional({ description: '签发机关（兼容旧前端字段）' })
  @IsOptional()
  @IsString()
  issuingAuthority?: string

  @ApiPropertyOptional({ description: '有效期起' })
  @IsOptional()
  @IsString()
  personValidDateStart?: string

  @ApiPropertyOptional({ description: '有效期止' })
  @IsOptional()
  @IsString()
  personValidDateEnd?: string

  @ApiPropertyOptional({ description: '身份证人像面 objectKey 或 URL' })
  @IsOptional()
  @IsString()
  idcardFront?: string

  @ApiPropertyOptional({ description: '身份证国徽面 objectKey 或 URL' })
  @IsOptional()
  @IsString()
  idcardBack?: string

  // ========== 客户补充信息（可选） ==========

  @ApiPropertyOptional({ description: '授信订单号' })
  @IsOptional()
  @IsString()
  creditOrderId?: string

  @ApiPropertyOptional({ description: '居住状况' })
  @IsOptional()
  @IsString()
  dwellingCondition?: string

  @ApiPropertyOptional({ description: '居住省' })
  @IsOptional()
  @IsString()
  liveProvince?: string

  @ApiPropertyOptional({ description: '居住市' })
  @IsOptional()
  @IsString()
  liveCity?: string

  @ApiPropertyOptional({ description: '居住区' })
  @IsOptional()
  @IsString()
  liveDistrict?: string

  @ApiPropertyOptional({ description: '居住详细地址' })
  @IsOptional()
  @IsString()
  liveDetailedAddress?: string

  @ApiPropertyOptional({ description: '居住地址（兼容旧前端字段）' })
  @IsOptional()
  @IsString()
  liveAddress?: string

  @ApiPropertyOptional({ description: '婚姻状况' })
  @IsOptional()
  @IsString()
  marriage?: string

  @ApiPropertyOptional({ description: '月收入' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  personIncome?: number

  @ApiPropertyOptional({ description: '供养子女数' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  childrenNum?: number

  @ApiPropertyOptional({ description: '学历' })
  @IsOptional()
  @IsString()
  education?: string

  @ApiPropertyOptional({ description: '学位' })
  @IsOptional()
  @IsString()
  degree?: string

  @ApiPropertyOptional({ description: '职业' })
  @IsOptional()
  @IsString()
  personOccupation?: string

  @ApiPropertyOptional({ description: '单位名称' })
  @IsOptional()
  @IsString()
  workingName?: string

  @ApiPropertyOptional({ description: '单位省' })
  @IsOptional()
  @IsString()
  workingProvince?: string

  @ApiPropertyOptional({ description: '单位市' })
  @IsOptional()
  @IsString()
  workingCity?: string

  @ApiPropertyOptional({ description: '单位区' })
  @IsOptional()
  @IsString()
  workingDistrict?: string

  @ApiPropertyOptional({ description: '单位详细地址' })
  @IsOptional()
  @IsString()
  workingDetailedAddress?: string

  @ApiPropertyOptional({ description: '公司电话' })
  @IsOptional()
  @IsString()
  workingTelephone?: string
}

export class MobileVehicleInfoDto {
  @ApiProperty({ description: '客户唯一标识' })
  @IsString()
  uuid: string

  @ApiPropertyOptional({ description: '行驶证主页 objectKey 或 URL' })
  @IsOptional()
  @IsString()
  vehicleImgUrl?: string

  @ApiProperty({ description: '车牌号码' })
  @IsString()
  plateNumber: string

  @ApiPropertyOptional({ description: '车辆品牌' })
  @IsOptional()
  @IsString()
  vehicleBrand?: string

  @ApiProperty({ description: '车型' })
  @IsString()
  vehicleModel: string

  @ApiProperty({ description: '所属人姓名' })
  @IsString()
  vehicleOwner: string

  @ApiPropertyOptional({ description: '住址' })
  @IsOptional()
  @IsString()
  address?: string

  @ApiPropertyOptional({ description: '使用性质' })
  @IsOptional()
  @IsString()
  usageNature?: string

  @ApiPropertyOptional({ description: '印章信息' })
  @IsOptional()
  @IsString()
  sealInfo?: string

  @ApiPropertyOptional({ description: '发动机号' })
  @IsOptional()
  @IsString()
  engineNumber?: string

  @ApiPropertyOptional({ description: '注册日期' })
  @IsOptional()
  @IsString()
  registerDate?: string

  @ApiProperty({ description: '车辆识别代码' })
  @IsString()
  vehicleCode: string

  @ApiPropertyOptional({ description: '行驶里程' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  mileage?: number

  @ApiPropertyOptional({ description: '购买方式' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  purchaseType?: number

  @ApiPropertyOptional({ description: '购买日期' })
  @IsOptional()
  @IsString()
  purchaseDate?: string

  @ApiPropertyOptional({ description: '购买金额，分' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  purchasePrice?: number

  @ApiPropertyOptional({ description: '估值金额（兼容旧前端字段）' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  valuationPrice?: number

  @ApiPropertyOptional({ description: '授信订单号（兼容旧前端字段）' })
  @IsOptional()
  @IsString()
  creditOrderId?: string

  @ApiPropertyOptional({ description: '贷款金额，分' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  loanAmount?: number

  @ApiPropertyOptional({ description: '贷款期限' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  loanTerm?: number

  @ApiPropertyOptional({ description: '月还款金额，分' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  monthlyPayment?: number

  @ApiPropertyOptional({ description: '燃油类型' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  fuelType?: number

  @ApiPropertyOptional({ description: '车辆颜色' })
  @IsOptional()
  @IsString()
  vehicleColor?: string

  @ApiPropertyOptional({ description: '是否故障' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  isFault?: number

  @ApiPropertyOptional({ description: '是否抵押' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  isMortgage?: number

  @ApiPropertyOptional({ description: '是否投保' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  isInsurance?: number

  @ApiPropertyOptional({ description: '保险到期日' })
  @IsOptional()
  @IsString()
  insuranceExpirationDate?: string
}

export class MobileCreditApplyDto {
  @ApiPropertyOptional({ description: '授信订单号，存在草稿时传入用于更新草稿' })
  @IsOptional()
  @IsString()
  creditOrderId?: string

  @ApiProperty({ description: '客户唯一标识' })
  @IsString()
  uuid: string

  @ApiPropertyOptional({ description: '申请金额，元，传入 creditOrderId 时可省略' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  amount?: number

  @ApiPropertyOptional({ description: '贷款期数，传入 creditOrderId 时可省略' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  periods?: number

  @ApiPropertyOptional({ description: '业务类型，例如 pawn' })
  @IsOptional()
  @IsString()
  businessType?: string

  @ApiPropertyOptional({ description: '订单类型' })
  @IsOptional()
  @IsString()
  orderType?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '停车费' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  parkingFee?: number

  @ApiPropertyOptional({ description: '车辆状态' })
  @IsOptional()
  @IsString()
  vehicleStatus?: string

  @ApiPropertyOptional({ description: '车库' })
  @IsOptional()
  @IsString()
  garage?: string

  @ApiPropertyOptional({ description: '门店' })
  @IsOptional()
  @IsString()
  storeName?: string

  @ApiPropertyOptional({ description: '负责人' })
  @IsOptional()
  @IsString()
  ownerName?: string

  @ApiPropertyOptional({ description: '押金' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  deposit?: number
}

export class MobileCreditUpdateDto extends PartialType(MobileCreditApplyDto) {
  @ApiProperty({ description: '授信订单号' })
  @IsString()
  creditOrderId: string
}

// ==================== 联系人 DTO ====================

export class MobileContactDto {
  @ApiPropertyOptional({ description: '联系人ID，编辑时传入' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  id?: number

  @ApiProperty({ description: '客户UUID' })
  @IsString()
  userUuid: string

  @ApiPropertyOptional({ description: '联系人类型 1：共借人；2：配偶；3：配偶且共借人；4：担保人' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  contactType?: number

  @ApiPropertyOptional({ description: '联系人姓名' })
  @IsOptional()
  @IsString()
  contactName?: string

  @ApiPropertyOptional({ description: '联系方式' })
  @IsOptional()
  @IsString()
  contactTelephone?: string

  @ApiPropertyOptional({ description: '身份证号码' })
  @IsOptional()
  @IsString()
  contactIdcard?: string

  @ApiPropertyOptional({ description: '与客户关系 1配偶 2父母 3子女 4朋友 5兄弟姐妹 6亲戚 7同事 8其他' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  contactRelationship?: number
}

// ==================== 销售线索 DTO ====================

export class MobileSalesLeadDto {
  @ApiProperty({ description: '客户姓名' })
  @IsString()
  personName: string

  @ApiProperty({ description: '手机号' })
  @IsString()
  telephone: string

  @ApiPropertyOptional({ description: '身份证号' })
  @IsOptional()
  @IsString()
  idCard?: string

  @ApiPropertyOptional({ description: '车辆品牌' })
  @IsOptional()
  @IsString()
  carBrand?: string

  @ApiPropertyOptional({ description: '车辆型号' })
  @IsOptional()
  @IsString()
  carModel?: string

  @ApiPropertyOptional({ description: '意向金额' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  loanAmount?: number

  @ApiPropertyOptional({ description: '来源' })
  @IsOptional()
  @IsString()
  source?: string

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string

  @ApiPropertyOptional({ description: '授信订单号（兼容旧前端透传字段）' })
  @IsOptional()
  @IsString()
  creditOrderId?: string
}

// ==================== 跟进记录 DTO ====================

export class MobileFollowUpDto {
  @ApiProperty({ description: '客户UUID' })
  @IsString()
  uuid: string

  @ApiPropertyOptional({ description: '跟进方式 PHONE/VISIT/WECHAT/OTHER' })
  @IsOptional()
  @IsString()
  followType?: string

  @ApiPropertyOptional({ description: '跟进内容（兼容旧前端字段）' })
  @IsOptional()
  @IsString()
  followContent?: string

  @ApiPropertyOptional({ description: '跟进内容' })
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional({ description: '下次跟进时间（兼容旧前端字段）' })
  @IsOptional()
  @IsString()
  nextFollowTime?: string

  @ApiPropertyOptional({ description: '下次跟进时间' })
  @IsOptional()
  @IsString()
  nextFollowAt?: string
}

// ==================== 签约 DTO ====================

export class MobileSigningStartDto {
  @ApiPropertyOptional({ description: '客户UUID' })
  @IsOptional()
  @IsString()
  uuid?: string

  @ApiPropertyOptional({ description: '回调URL' })
  @IsOptional()
  @IsString()
  redirectUrl?: string

  @ApiPropertyOptional({ description: '授信订单号' })
  @IsOptional()
  @IsString()
  creditOrderId?: string

  @ApiPropertyOptional({ description: '备注（兼容旧前端字段）' })
  @IsOptional()
  @IsString()
  remark?: string
}

// ==================== 客户补充信息 DTO ====================

export class MobileCustomerExtraDto {
  @ApiPropertyOptional({ description: '客户UUID' })
  @IsOptional()
  @IsString()
  uuid?: string

  @ApiPropertyOptional({ description: '授信订单号' })
  @IsOptional()
  @IsString()
  creditOrderId?: string

  @ApiPropertyOptional({ description: '居住状况' })
  @IsOptional()
  @IsString()
  dwellingCondition?: string

  @ApiPropertyOptional({ description: '居住省' })
  @IsOptional()
  @IsString()
  liveProvince?: string

  @ApiPropertyOptional({ description: '居住市' })
  @IsOptional()
  @IsString()
  liveCity?: string

  @ApiPropertyOptional({ description: '居住区' })
  @IsOptional()
  @IsString()
  liveDistrict?: string

  @ApiPropertyOptional({ description: '居住详细地址' })
  @IsOptional()
  @IsString()
  liveDetailedAddress?: string

  @ApiPropertyOptional({ description: '居住地址（兼容旧前端字段）' })
  @IsOptional()
  @IsString()
  liveAddress?: string

  @ApiPropertyOptional({ description: '婚姻状况' })
  @IsOptional()
  @IsString()
  marriage?: string

  @ApiPropertyOptional({ description: '月收入' })
  @IsOptional()
  @ToNumber()
  @IsNumber()
  @Min(0)
  personIncome?: number

  @ApiPropertyOptional({ description: '供养子女数' })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(0)
  childrenNum?: number

  @ApiPropertyOptional({ description: '学历' })
  @IsOptional()
  @IsString()
  education?: string

  @ApiPropertyOptional({ description: '学位' })
  @IsOptional()
  @IsString()
  degree?: string

  @ApiPropertyOptional({ description: '职业' })
  @IsOptional()
  @IsString()
  personOccupation?: string

  @ApiPropertyOptional({ description: '单位名称' })
  @IsOptional()
  @IsString()
  workingName?: string

  @ApiPropertyOptional({ description: '单位省' })
  @IsOptional()
  @IsString()
  workingProvince?: string

  @ApiPropertyOptional({ description: '单位市' })
  @IsOptional()
  @IsString()
  workingCity?: string

  @ApiPropertyOptional({ description: '单位区' })
  @IsOptional()
  @IsString()
  workingDistrict?: string

  @ApiPropertyOptional({ description: '单位详细地址' })
  @IsOptional()
  @IsString()
  workingDetailedAddress?: string

  @ApiPropertyOptional({ description: '公司电话' })
  @IsOptional()
  @IsString()
  workingTelephone?: string
}
