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

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @ToNumber()
  @IsInt()
  @Min(1)
  size?: number

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

  @ApiProperty({ description: '姓名' })
  @IsString()
  personName: string

  @ApiProperty({ description: '手机号' })
  @IsString()
  telephone: string

  @ApiProperty({ description: '身份证号' })
  @IsString()
  personIdcard: string

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

  @ApiPropertyOptional({ description: '身份证地址' })
  @IsOptional()
  @IsString()
  personAddress?: string

  @ApiPropertyOptional({ description: '签发机关' })
  @IsOptional()
  @IsString()
  personIssuingAuthority?: string

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

  @ApiProperty({ description: '住址' })
  @IsString()
  address: string

  @ApiProperty({ description: '使用性质' })
  @IsString()
  usageNature: string

  @ApiProperty({ description: '印章信息' })
  @IsString()
  sealInfo: string

  @ApiProperty({ description: '发动机号' })
  @IsString()
  engineNumber: string

  @ApiProperty({ description: '注册日期' })
  @IsString()
  registerDate: string

  @ApiProperty({ description: '车辆识别代码' })
  @IsString()
  vehicleCode: string

  @ApiProperty({ description: '行驶里程' })
  @ToNumber()
  @IsNumber()
  @Min(0)
  mileage: number

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

  @ApiProperty({ description: '跟进内容' })
  @IsString()
  content: string

  @ApiPropertyOptional({ description: '下次跟进时间' })
  @IsOptional()
  @IsString()
  nextFollowAt?: string
}

// ==================== 签约 DTO ====================

export class MobileSigningStartDto {
  @ApiProperty({ description: '客户UUID' })
  @IsString()
  uuid: string

  @ApiPropertyOptional({ description: '回调URL' })
  @IsOptional()
  @IsString()
  redirectUrl?: string

  @ApiPropertyOptional({ description: '授信订单号' })
  @IsOptional()
  @IsString()
  creditOrderId?: string
}
